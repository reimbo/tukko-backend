require("dotenv").config();
import axios from "axios";
import { AxiosResponse } from "axios";
import { sensorRepository } from "./client";
import { isSensorDataUpdated } from "./lastUpdated";

// Define TMS API URL
const urlAPI = (process.env.TMS_API_URL ||
  "https://tie.digitraffic.fi/api/tms/v1") as string;

// Define URLs for TMS endpoints
const urlData = urlAPI + "/stations/data";

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tukko",
  },
};

// Global helper variables
// Sensor count
let sensorCount = 0;
// IDs of sensors with 5 min measurement rate
const fastExpireSensorIDs = new Set<number>([
  5058, 5061, 5116, 5119, 5122, 5125, 5158, 5161, 5164, 5168,
]);
// IDs of sensors with 60 min measurement rate
const slowExpireSensorIDs = new Set<number>([5054, 5055, 5056, 5057]);
// IDs of sensors useless for real time data
const uselessSensorIDs = new Set<number>([
  5016, 5019, 5022, 5025, 5064, 5067, 5068, 5071, 5152,
]);

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
    value: sensor.value,
  };
}

// Helper function to calculate time to live for sensor keys in Redis
function calculateTimeToLive(sensor: any) {
  // Set measurement rate in minutes
  let minutes = 0;
  if (fastExpireSensorIDs.has(sensor.id)) {
    minutes = 5;
  } else if (slowExpireSensorIDs.has(sensor.id)) {
    minutes = 60;
  }
  // Calculate time in seconds before next measurement
  const ttlInSeconds = Math.floor(
    (new Date().getTime() -
      new Date(sensor.measuredTime).getTime() +
      minutes * 60 * 1000) /
      1000
  );
  return ttlInSeconds > 0 ? ttlInSeconds : 0;
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
      sensorCount++;
    }
  }
  // Store sensors
  if (newSensors) {
    for (const sensor of newSensors) {
      const id = `${station.id}${sensor.id}`;
      // Set entity ID as "stationID:sensorID
      await sensorRepository.save(id, sensor);
      // Set time to live for the sensor key
      await sensorRepository.expire(id, calculateTimeToLive(sensor));
    }
  }
}

// Function to load sensors
export async function loadSensors() {
  try {
    console.log("[REDIS] Fetching and storing sensors...");
    // Check if data has been updated
    if (!(await isSensorDataUpdated())) {
      console.log("[REDIS] Database already contains the latest sensor data.");
      return;
    }
    // Fetch data
    const response: AxiosResponse = await axios.get(urlData, axiosConf);
    const stations = response.data.stations;
    // Check if any data has been fetched
    if (stations.length === 0) {
      console.log("[REDIS] No data has been fetched.");
      return;
    }
    // Append sensor data to stations
    for (const station of stations) {
      storeSensors(station);
    }
  } catch (error: any) {
    throw new Error("[REDIS] Error loading sensors: " + error.message);
  } finally {
    console.log(`[REDIS] Stored ${sensorCount} sensors.`);
    sensorCount = 0;
  }
}
