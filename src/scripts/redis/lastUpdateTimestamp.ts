require("dotenv").config();
import axios from "axios";
import { AxiosResponse } from "axios";
import { client } from "./client";

// Define TMS API URL
const urlAPI = (process.env.TMS_API_URL ||
  "https://tie.digitraffic.fi/api/tms/v1") as string;

// Define URLs for TMS endpoints
const urlData = urlAPI + "/stations/data";
const urlStations = urlAPI + "/stations";

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tukko",
  },
  params: { lastUpdated: true },
};

class LastUpdateTimestamp {
  // Stations updated bool
  #_isStationUpdated: boolean;
  // Data updated bool
  #_isDataUpdated: boolean;

  constructor() {
    // Initialize private fields
    this.#_isStationUpdated = false;
    this.#_isDataUpdated = false;
  }

  get stationTimestamp() {
    return (async () => {
      const timestamp = await client.get("stationts");
      return timestamp === null ? new Date(0) : new Date(timestamp);
    })();
  }

  // Getter method for isStationUpdated
  get isStationUpdated() {
    this.#_isStationUpdated = false;
    return (async () => {
      // Get timestamps
      const response: AxiosResponse = await axios.get(urlStations, {
        ...axiosConf,
      });
      const responseTimestamp = response.data.dataUpdatedTime;
      const stationTimestamp = await this.stationTimestamp;
      if (new Date(responseTimestamp) > stationTimestamp) {
        // Update timestamp
        await client.set("stationts", responseTimestamp);
        this.#_isStationUpdated = true;
      }
      return this.#_isStationUpdated;
    })();
  }

  get dataTimestamp() {
    return (async () => {
      const timestamp = await client.get("datats");
      return timestamp === null ? new Date(0) : new Date(timestamp);
    })();
  }

  // Getter method for isDataUpdated
  get isDataUpdated() {
    this.#_isDataUpdated = false;
    return (async () => {
      // Get timestamps
      const response: AxiosResponse = await axios.get(urlData, {
        ...axiosConf,
      });
      const responseTimestamp = response.data.dataUpdatedTime;
      const dataTimestamp = await this.dataTimestamp;
      if (new Date(responseTimestamp) > dataTimestamp) {
        // Update timestamp
        await client.set("datats", responseTimestamp);
        this.#_isDataUpdated = true;
      }
      return this.#_isDataUpdated;
    })();
  }
}

const lastUpdateTimestamp = new LastUpdateTimestamp();
export default lastUpdateTimestamp;
