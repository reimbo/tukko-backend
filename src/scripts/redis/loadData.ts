require('dotenv').config();
const axios = require('axios').default;
import { AxiosResponse } from 'axios';
import { stationRepository, sensorRepository } from './client';
// import { delayBy } from '../schedule';

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
let sensorsUpdateTimestamp = new Date(0);
let stationsUpdateTimestamp = new Date(0);
let stationIds = new Set<string>();

// Helper function to check if data has been updated, as well as to update local timestamps
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
            // Set entity ID as "stationID:sensorID" while saving
            await sensorRepository.save(`${station.id}:${sensor.id}`, {
              id: sensor.id,
              stationId: sensor.stationId,
              name: sensor.name,
              timeWindowStart: sensor.timeWindowStart,
              timeWindowEnd: sensor.timeWindowEnd,
              measuredTime: sensor.measuredTime,
              unit: sensor.unit,
              value: sensor.value
            });
            sensorsCount++;
          }
          // Generate a set of unique station IDs
          stationIds.add(station.id);
        }
        else {
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
          sensors: station.sensors
        });
        stationsCount++;
        //await delayBy(1500); // =1.5s intervals
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