require('dotenv').config();
const axios = require('axios').default;
import { AxiosResponse } from 'axios';
import { stationRepository, sensorRepository } from './client';

// Define the URLs for stations and sensors
const urlStations = (process.env.TMS_STATION_LIST_URL || 'https://tie.digitraffic.fi/api/tms/v1/stations') as string;
const urlSensors = (process.env.TMS_STATIONS_DATA_URL || 'https://tie.digitraffic.fi/api/tms/v1/stations/data') as string;

// Configuration for Axios request
const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Travis"
  }
};

// Global helper variables
// Latest timestap of sensor data update time
let sensorsUpdateTimestamp = new Date(0);
// Latest timestap of station data update time
let stationsUpdateTimestamp = new Date(0);
// IDs of active stations containing sensors values
let stationIds = new Set<string>();
// IDs of sensors with 5 min measurement rate
const fastExpireSensorIDs = new Set<number>([5016, 5019, 5022, 5025, 5058, 5061, 5064, 5068, 5116, 5119, 5122, 5125, 5152, 5158, 5161, 5164, 5168]);
// IDs of sensors with 60 min measurement rate
const slowExpireSensorIDs = new Set<number>([5054, 5055, 5056, 5057, 5067, 5071]);

// Helper function to check if data has been updated and to update local timestamps
async function isDataUpdated(url: string, dataType: string) {
  // Fetch dataUpdatedTime
  const response: AxiosResponse = await axios.get(
    url, {
    ...axiosConf,
    params: { lastUpdated: true }
  });
  const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
  if (dataType === 'sensor' && fetchedDataTimestamp > sensorsUpdateTimestamp) {
    // Update timestamp
    sensorsUpdateTimestamp = fetchedDataTimestamp;
    return true;
  }
  if (dataType === 'station' && fetchedDataTimestamp > stationsUpdateTimestamp) {
    // Update timestamp
    stationsUpdateTimestamp = fetchedDataTimestamp;
    return true;
  }
  return false;
}

// Helper function to calculate time to live for sensor keys in Redis
function calculateTimeToLive(sensor: any) {
  // Set measurement rate in minutes
  let minutes = 0;
  if (fastExpireSensorIDs.has(sensor.id)) { minutes = 5; }
  else if (slowExpireSensorIDs.has(sensor.id)) { minutes = 60; }
  // Calculate time in seconds before next measurement
  const ttlInSeconds = Math.floor((new Date().getTime() - new Date(sensor.measuredTime).getTime() + minutes * 60 * 1000) / 1000);
  return ttlInSeconds > 0 ? ttlInSeconds : 0;
}

// Function to load sensors
async function loadSensors(url: string) {
  let sensorsCount = 0;
  try {
    console.log('Fetching and storing sensors...');
    // Check if data has been updated
    if (await isDataUpdated(url, 'sensor')) {
      // Fetch data
      let response: AxiosResponse = await axios.get(url, axiosConf);
      // Save sensors to the repository
      for (const station of response.data.stations) {
        const sensors = station.sensorValues
        if (sensors.length !== 0) {
          for (const sensor of sensors) {
            // Set entity ID as "stationID:sensorID"
            const id = `${station.id}:${sensor.id}`;
            await sensorRepository.save(id, {
              id: sensor.id,
              stationId: sensor.stationId,
              name: sensor.name,
              timeWindowStart: sensor.timeWindowStart,
              timeWindowEnd: sensor.timeWindowEnd,
              measuredTime: sensor.measuredTime,
              unit: sensor.unit,
              value: sensor.value
            });
            // Set time to live for the sensor key
            await sensorRepository.expire(id, calculateTimeToLive(sensor));
            sensorsCount++;
          }
          // Add station IDs to the set of active stations containing sensors values
          stationIds.add(station.id);
        } else {
          // If the station does not include any sensor values, delete its ID from the set
          stationIds.delete(station.id);
        }
      }
    } else {
      console.log('Redis already contatins the latest sensor data.');
    }
  } catch (error: any) {
    throw new Error('Error loading sensors: ' + error.message);
  } finally {
    console.log(`Stored ${sensorsCount} sensors.`);
  }
}

// Function to load stations
async function loadStations(url: string) {
  let stationsCount = 0;
  try {
    console.log('Fetching and storing stations...');
    // Check if station data has been updated
    if (await isDataUpdated(url, 'station') && stationIds.size !== 0) {
      // Fetch data for each station ID and save it to the repository
      for (const stationId of stationIds) {
        const response: AxiosResponse = await axios.get(`${url}/${stationId}`, axiosConf);
        const station = response.data;
        // Set entity ID as "stationID"
        await stationRepository.save(`${station.id}`, {
          id: station.id,
          tmsNumber: station.properties.tmsNumber,
          name: station.properties.name,
          dataUpdatedTime: station.properties.dataUpdatedTime,
          coordinates: {
            longitude: station.geometry.coordinates[0],
            latitude: station.geometry.coordinates[1]
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
          sensors: station.properties.sensors
        });
        stationsCount++;
      }
      // Remove from the repository all stations that are not in the stationIds set
      const storedStations = await stationRepository.search().return.all();
      for (const station of storedStations) {
        const stationId = station.id as string;
        if (!stationIds.has(stationId)) await stationRepository.remove(stationId);
      }
    } else {
      console.log('Redis already contatins the latest station data.');
    }
  } catch (error: any) {
    throw new Error('Error loading stations: ' + error.message);
  } finally {
    console.log(`Stored ${stationsCount} stations.`);
  }
}

// Function to load all data
export async function loadData() {
  // Load stations and sensors data
  await loadSensors(urlSensors);
  await loadStations(urlStations);
}

// Function to load sensor data
export async function loadSensorData() {
  // Load stations and sensors data
  await loadSensors(urlSensors);
}