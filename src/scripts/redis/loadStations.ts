require("dotenv").config();
const axios = require("axios").default;
import { AxiosResponse } from "axios";
import { stationRepository, client } from "./client";

// Define TMS API URL
const urlAPI = (process.env.TMS_API_URL ||
  "https://tie.digitraffic.fi/api/tms/v1") as string;

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Travis",
  },
};

// Global helper variables
// Latest timestap of station data update time
let stationsUpdateTimestamp = new Date(0);
// Latest timestap of sensor data update time
let sensorsUpdateTimestamp = new Date(0);
// Sensor count
let sensorsCount = 0;
// IDs of stations sotred in the database
let storedStationIds = new Set<string>();
// IDs of sensors useless for real time data
const uselessSensorIDs = new Set<number>([
  5016, 5019, 5022, 5025, 5064, 5067, 5068, 5071,
]);

// Helper function to check if stattion data has been updated and to update local timestamps
async function isStationDataUpdated() {
  // Get response
  const response: AxiosResponse = await axios.get(`${urlAPI}/stations`, {
    ...axiosConf,
    params: { lastUpdated: true },
  });
  // Get dataUpdatedTime
  const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
  if (fetchedDataTimestamp > stationsUpdateTimestamp) {
    // Update timestamp
    stationsUpdateTimestamp = fetchedDataTimestamp;
    return true;
  }
  return false;
}

// Helper function to check if sensor data has been updated and to update local timestamps
async function isSensorDataUpdated() {
  // Get response
  const response: AxiosResponse = await axios.get(`${urlAPI}/stations/data`, {
    ...axiosConf,
    params: { lastUpdated: true },
  });
  // Get dataUpdatedTime
  const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
  if (fetchedDataTimestamp > sensorsUpdateTimestamp) {
    // Update timestamp
    sensorsUpdateTimestamp = fetchedDataTimestamp;
    return true;
  }
  return false;
}

// Helper function to construct a new station object
function constructStationObject(station: any) {
  return {
    id: station.id,
    tmsNumber: station.properties.tmsNumber,
    dataUpdatedTime: station.properties.dataUpdatedTime,
    name: station.properties.name,
    names: {
      fi: station.properties.names.fi,
      sv: station.properties.names.sv || station.properties.names.fi,
      en: station.properties.names.en || station.properties.names.fi,
    },
    collectionStatus: station.properties.collectionStatus,
    coordinates: {
      longitude: station.geometry.coordinates[0],
      latitude: station.geometry.coordinates[1],
    },
    roadNumber: station.properties.roadAddress.roadNumber,
    roadSection: station.properties.roadAddress.roadSection,
    carriageway: station.properties.roadAddress.carriageway,
    side: station.properties.roadAddress.side,
    municipality: station.properties.municipality,
    municipalityCode: station.properties.municipalityCode,
    province: station.properties.province,
    provinceCode: station.properties.provinceCode,
    direction1Municipality: station.properties.direction1Municipality,
    direction1MunicipalityCode: station.properties.direction1MunicipalityCode,
    direction2Municipality: station.properties.direction2Municipality,
    direction2MunicipalityCode: station.properties.direction2MunicipalityCode,
    freeFlowSpeed1: station.properties.freeFlowSpeed1,
    freeFlowSpeed2: station.properties.freeFlowSpeed2,
  };
}

// Helper function to construct a new sensor object
function constructSensorObject(sensor: any) {
  return {
    id: sensor.id,
    stationId: sensor.stationId,
    name: sensor.name,
    shortName: sensor.shortName,
    timeWindowStart: sensor.timeWindowStart,
    timeWindowEnd: sensor.timeWindowEnd,
    measuredTime: sensor.measuredTime,
    unit: sensor.unit,
    sensorValueDescriptionFi: sensor.sensorValueDescriptionFi,
    sensorValueDescriptionEn: sensor.sensorValueDescriptionEn,
    value: sensor.value,
  };
}

// Helper function to delete all stored stations
async function flushAllStations() {
  const storedStations = await stationRepository.search().return.all();
  let stationsToDelete: string[] = [];
  for (const station of storedStations)
    stationsToDelete.push(station.id as string);
  await stationRepository.remove(stationsToDelete);
}

// Helper function to fetch and store a station
async function fetchAndStoreStation(stationId: string) {
  const response: AxiosResponse = await axios.get(
    `${urlAPI}/stations/${stationId}`,
    axiosConf
  );
  const station = response.data;
  // Check if station exists
  if (Object.keys(station).length === 0) return;
  // Set entity ID as "stationID"
  await stationRepository.save(
    `${station.id}`,
    constructStationObject(station)
  );
  // Add station IDs to the set of stored stations
  storedStationIds.add(stationId);
}

// Helper function to store sensors
async function storeSensors(station: any) {
  const sensors = station.sensorValues;
  // Check if station holds any sensors
  if (sensors.length === 0) return;
  let newSensors: any[] = [];
  for (const sensor of sensors) {
    // Skip sensors useless for real time data
    if (uselessSensorIDs.has(sensor.id)) continue;
    // Construct a new sensor object
    const newSensor = constructSensorObject(sensor);
    if (!newSensors.includes(newSensor)) {
      newSensors.push(newSensor);
      sensorsCount++;
    }
  }
  // Append sensors to station as a list of nested JSON objects
  if (newSensors)
    client.json.set(`station:${station.id}`, "$.sensors", newSensors);
}

// Function to load stations
export async function loadStations() {
  try {
    console.log("[REDIS] Fetching and storing stations...");
    // Check if station data has been updated
    if (await isStationDataUpdated()) {
      // Get a list of all stations
      const response: AxiosResponse = await axios.get(
        `${urlAPI}/stations`,
        axiosConf
      );
      const stations = response.data.features;
      // Check if any data has been fetched
      if (stations.length === 0) {
        console.log("[REDIS] No data has been fetched.");
        return;
      }
      await flushAllStations();
      // Fetch data for each fetched station and save it to the repository
      for (const station of stations) {
        const stationId = station.id;
        await fetchAndStoreStation(stationId);
      }
    } else {
      console.log("[REDIS] Database already contains the latest station data.");
    }
  } catch (error: any) {
    throw new Error("[REDIS] Error loading stations: " + error.message);
  } finally {
    console.log(`[REDIS] Stored ${storedStationIds.size} stations.`);
    // Attach sensor data to stations
    await loadSensors();
  }
}

// Function to load sensors
export async function loadSensors() {
  let missingStationIds: string[] = [];
  try {
    console.log("[REDIS] Fetching and storing sensors...");
    // Check if data has been updated
    if (!(await isSensorDataUpdated())) {
      console.log("[REDIS] Database already contains the latest sensor data.");
      return;
    }
    // Fetch data
    const response: AxiosResponse = await axios.get(
      `${urlAPI}/stations/data`,
      axiosConf
    );
    const stations = response.data.stations;
    // Check if any data has been fetched
    if (stations.length === 0) {
      console.log("[REDIS] No data has been fetched.");
      return;
    }
    // Reset sensor count
    sensorsCount = 0;
    // Append sensor data to stations
    for (const station of stations) {
      // Skip station if it is not stored in database
      if (!storedStationIds.has(station.id)) {
        missingStationIds.push(station.id);
        continue;
      }
      storeSensors(station);
    }
  } catch (error: any) {
    throw new Error("[REDIS] Error loading sensors: " + error.message);
  } finally {
    if (missingStationIds.length > 0)
      console.log(
        `[REDIS] Redis is missing stations! Station IDs: ${missingStationIds}`
      );
    console.log(`[REDIS] Stored ${sensorsCount} sensors.`);
  }
}
