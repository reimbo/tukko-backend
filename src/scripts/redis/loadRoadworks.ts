require("dotenv").config();
import axios from "axios";
import { AxiosResponse } from "axios";
import { client, roadworkRepository } from "./client";

// Define traffic message API URL
const urlAPI = (process.env.TM_API_URL ||
  "https://tie.digitraffic.fi/api/traffic-message/v1") as string;

// Define URLs for TMS endpoints
const urlRoadworks = urlAPI + "/messages";

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tukko",
  },
};

// Global helper variables
// Latest timestap of road work data update time
let roadworksUpdateTimestamp = new Date(0);
// Road work count
let roadworksCount = 0;

// Helper function to construct a new road work object
function constructRoadworkObject(roadwork: any) {
  // Check if roadAddressLocation exists
  const primaryPoint = roadwork.locationDetails.roadAddressLocation
    ? roadwork.locationDetails.roadAddressLocation.primaryPoint
    : null;
  const secondaryPoint = roadwork.locationDetails.roadAddressLocation
    ? roadwork.locationDetails.roadAddressLocation.secondaryPoint
    : null;
  return {
    id: roadwork.id,
    primaryPointRoadNumber: primaryPoint ? primaryPoint.roadAddress.road : null,
    primaryPointRoadSection: primaryPoint
      ? primaryPoint.roadAddress.roadSection
      : null,
    secondaryPointRoadNumber: secondaryPoint
      ? secondaryPoint.roadAddress.road
      : null,
    secondaryPointRoadSection: secondaryPoint
      ? secondaryPoint.roadAddress.roadSection
      : null,
    direction: roadwork.locationDetails.roadAddressLocation
      ? roadwork.locationDetails.roadAddressLocation.direction
      : null,
    startTime: roadwork.timeAndDuration.startTime,
    endTime: roadwork.timeAndDuration.endTime,
    severity: roadwork.severity,
  };
}

// Helper function to genereate a list of restrictions
function generateListOfRestrictions(roadwork: any) {
  let restrictions: any[] = [];
  for (const restriction of roadwork.restrictions) {
    const newRestriction = {
      type: restriction.type,
      name: restriction.restriction.name,
      quantity: restriction.restriction.quantity,
      unit: restriction.restriction.unit,
    };
    restrictions.push(newRestriction);
  }
  return restrictions;
}

// Helper function to validate response
function isResponseValid(response: AxiosResponse) {
  const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
  // Check if data has been updated
  if (fetchedDataTimestamp < roadworksUpdateTimestamp) {
    console.log("[REDIS] Database already contains the latest road work data.");
    return false;
  }
  roadworksUpdateTimestamp = fetchedDataTimestamp;
  // Check if any data has been fetched
  if (response.data.features.length === 0) {
    console.log("[REDIS] No data has been fetched.");
    return false;
  }
  return true;
}

// Helper function to store road works
async function storeRoadworks(response: AxiosResponse) {
  roadworksCount = 0;
  for (const feature of response.data.features) {
    for (const announcement of feature.properties.announcements) {
      for (const roadwork of announcement.roadWorkPhases) {
        // Set entity ID as "roadworkID"
        const id = `${roadwork.id}`.substring(4);
        await roadworkRepository.save(id, constructRoadworkObject(roadwork));
        // Generate a list of restrictions for the road work
        const restrictions = generateListOfRestrictions(roadwork);
        // Append nested JSON objects to the road work key
        client.json.set(
          `roadwork:${id}`,
          "$.workingHours",
          roadwork.workingHours
        );
        client.json.set(`roadwork:${id}`, "$.workTypes", roadwork.workTypes);
        client.json.set(`roadwork:${id}`, "$.restrictions", restrictions);

        const ttlInSeconds = Math.floor(
          (new Date(roadwork.timeAndDuration.endTime).getTime() -
            new Date().getTime()) /
            1000
        );
        // Set time to live for the road work key
        await roadworkRepository.expire(id, ttlInSeconds);
        roadworksCount++;
      }
    }
  }
}

// Function to load road works
export async function loadRoadworks() {
  try {
    console.log("[REDIS] Fetching and storing road works...");
    // Fetch data
    const response: AxiosResponse = await axios.get(urlRoadworks, {
      ...axiosConf,
      params: {
        situationType: "ROAD_WORK",
        includeAreaGeometry: false,
      },
    });
    // Validate response
    if (!isResponseValid(response)) return;
    // Save road works to the repository
    await storeRoadworks(response);
  } catch (error: any) {
    throw new Error("Error loading road works: " + error.message);
  } finally {
    console.log(`[REDIS] Stored ${roadworksCount} road works.`);
  }
}
