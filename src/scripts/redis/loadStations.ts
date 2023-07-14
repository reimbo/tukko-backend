require("dotenv").config();
import axios from "axios";
import { AxiosResponse } from "axios";
import { client, stationRepository } from "./client";
import lastUpdateTimestamp from "./lastUpdateTimestamp";

// Define TMS API URL
const urlAPI = (process.env.TMS_API_URL ||
  "https://tie.digitraffic.fi/api/tms/v1") as string;

// Define URLs for TMS endpoints
const urlStations = urlAPI + "/stations";

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tukko",
  },
};

// Global helper variables
// Station count
let stationCount = 0;

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
    `${urlStations}/${stationId}`,
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
  stationCount++;
}

// Function to load stations
export async function loadStations() {
  try {
    console.log("[REDIS] Fetching and storing stations...");
    // Check if station data has been updated
    if (!(await lastUpdateTimestamp.isStationUpdated)) {
      console.log("[REDIS] Database already contains the latest station data.");
      return;
    }
    // Save station data last update timestamp to the repository
    client.set(
      "stationupdatetimestamp",
      lastUpdateTimestamp.stationTimestamp.toString()
    );
    // Get a list of all stations
    const response: AxiosResponse = await axios.get(urlStations, axiosConf);
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
  } catch (error: any) {
    throw new Error("[REDIS] Error loading stations: " + error.message);
  } finally {
    console.log(`[REDIS] Stored ${stationCount} stations.`);
    stationCount = 0;
  }
}
