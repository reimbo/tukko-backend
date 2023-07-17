require("dotenv").config();
import axios from "axios";
import { AxiosResponse } from "axios";
import { client } from "./client";

// Define TMS API URL
const urlAPI = (process.env.TMS_API_URL ||
  "https://tie.digitraffic.fi/api/tms/v1") as string;

// Define URLs for TMS endpoints
const urlSensors = urlAPI + "/stations/data";
const urlStations = urlAPI + "/stations";

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tukko",
  },
  params: { lastUpdated: true },
};

// Define keys for lastUpdated timestamps
const stationLastUpdatedKey = "stationlastupdated";
const sensorLastUpdatedKey = "sensorlastupdated";

// Function to fetch station last updated timestamp
export async function fetchStationLastUpdated() {
  const timestamp = await client.get(stationLastUpdatedKey);
  return timestamp === null ? new Date(0) : new Date(timestamp);
}

// Function to check whether station data has been updated
export async function isStationDataUpdated() {
  try {
    // Get timestamps
    const response: AxiosResponse = await axios.get(urlStations, {
      ...axiosConf,
    });
    const responseTimestamp = response.data.dataUpdatedTime;
    if (new Date(responseTimestamp) > (await fetchStationLastUpdated())) {
      // Update timestamp
      await client.set(stationLastUpdatedKey, responseTimestamp);
      return true;
    }
    return false;
  } catch (error: any) {
    throw new Error(
      "[REDIS] Error station last updated status: " + error.message
    );
  }
}

// Function to fetch sensor last updated timestamp
export async function fetchSensorLastUpdated() {
  const timestamp = await client.get(sensorLastUpdatedKey);
  return timestamp === null ? new Date(0) : new Date(timestamp);
}

// Function to check whether sensor data has been updated
export async function isSensorDataUpdated() {
  try {
    // Get timestamps
    const response: AxiosResponse = await axios.get(urlSensors, {
      ...axiosConf,
    });
    const responseTimestamp = response.data.dataUpdatedTime;
    if (new Date(responseTimestamp) > (await fetchSensorLastUpdated())) {
      // Update timestamp
      await client.set(sensorLastUpdatedKey, responseTimestamp);
      return true;
    }
    return false;
  } catch (error: any) {
    throw new Error(
      "[REDIS] Error sensor last updated status: " + error.message
    );
  }
}
