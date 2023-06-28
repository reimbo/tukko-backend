const axios = require('axios').default;
import { AxiosResponse } from 'axios';
import { stationRepository, sensorRepository } from '../../models/redis/tmsModels';
// import { delayBy } from '../schedule';
import client from './client';

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
let latestSensorsTimestamp = new Date(0);
let latestStationsTimestamp = new Date(0);
let filteredStationIds: string[] = [];

// Function to load sensors
async function loadSensors(url: string) {
  // Reset station IDs
  filteredStationIds = [];

  let sensorsCount = 0;
  try {
    console.log('Fetching and storing sensors...');
    // Fetch sensors
    const response: AxiosResponse = await axios.get(url, axiosConf);
    // Check if data has been updated
    const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
    if (fetchedDataTimestamp > latestSensorsTimestamp) {
      latestSensorsTimestamp = fetchedDataTimestamp;
      // Save sensors to the repository
      for (const station of response.data.stations) {
        for (const sensor of station.sensorValues) {
          await sensorRepository.save(`${station.id}:${sensor.id}`,{
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
          // Create list of station IDs for further filtering
          if (!filteredStationIds.includes(sensor.stationId)) {
            filteredStationIds.push(sensor.stationId);
          }
        }
      }
      // Create index in the repository for efficient searching
      await sensorRepository.createIndex();
    }
    else {
      console.log('Redis already contatins latest sensors.');
    }
  } catch (error: any) {
    throw new Error('Error loading sensors: ' + error.message);
  }
  finally {
    console.log(`${sensorsCount} sensors stored.`);
  }
}

// Function to load stations
async function loadStations(url: string) {
  let stationsCount = 0;
  try {
    console.log('Fetching and storing stations...');
    // Fetch stations
    const response: AxiosResponse = await axios.get(url, axiosConf);
    // Check if data has been updated
    const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
    if (fetchedDataTimestamp > latestSensorsTimestamp || fetchedDataTimestamp > latestStationsTimestamp) {
      latestStationsTimestamp = fetchedDataTimestamp;
      // Save stations to the repository
      for (const station of response.data.features) {
        if (station.properties.collectionStatus === 'GATHERING' && filteredStationIds.includes(station.id)) {
          // Set entity ID as station ID while saving
          await stationRepository.save(`${station.id}`, {
            id: station.id,
            tmsNumber: station.properties.tmsNumber,
            name: station.properties.name,
            dataUpdatedTime: station.properties.dataUpdatedTime,
            coordinates: {
              longitude: station.geometry.coordinates[0],
              latitude: station.geometry.coordinates[1]
            }
          });
          stationsCount++;
        }
      }
      // Create index in the repository for efficient searching
      await stationRepository.createIndex();
    }
    else {
      console.log('Redis already contatins latest stations.');
    }
  } catch (error: any) {
    throw new Error('Error loading station: ' + error.message);
  }
  finally {
    console.log(`Stored ${stationsCount} stations.`);
  }
}

// Function to update existing station entities with load road data
async function updateStationsWithRoadData(url: string) {
  let stations = 0;
  try {
    if (filteredStationIds.length !== 0) {
      console.log('Fetching and storing road data...');
      // Fetch data for each station
      for (const stationId of filteredStationIds) {
        const response: AxiosResponse = await axios.get(`${url}/${stationId}`, axiosConf);
        const station = response.data.properties;
        // Get existing station entity form Redis
        const stationEntity = await stationRepository.fetch(stationId);
        // If found, update the entity with new values
        if (stationEntity) {
          await stationRepository.save(`${station.id}`, {
            id: station.id,
            tmsNumber: stationEntity.tmsNumber,
            name: stationEntity.name,
            dataUpdatedTime: stationEntity.dataUpdatedTime,
            coordinates: stationEntity.coordinates,
            roadNumber: station.roadAddress.roadNumber,
            roadSection: station.roadAddress.roadSection,
            carriageway: station.roadAddress.carriageway,
            side: station.roadAddress.side,
            municipality: station.municipality,
            municipalityCode: station.municipalityCode,
            province: station.province,
            provinceCode: station.provinceCode,
            direction1Municipality: station.direction1Municipality,
            direction1MunicipalityCode: station.direction1MunicipalityCode,
            direction2Municipality: station.direction2Municipality,
            direction2MunicipalityCode: station.direction2MunicipalityCode
          });
          stations++;
          //await delayBy(1500); // =1.5s intervals
        }
      }
    }
    else {
      console.log("Failed. Sensors and stations should be fetched before fetching road data.");
    }
  } catch (error: any) {
    throw new Error('Error updating stations with road data: ' + error.message);
  }
  finally {
    console.log(`${stations} stations updated.`);
  }
}

// Function to load all data excluding road data
export async function loadData() {
  try {
    // Connect to Redis
    await client.connect();
    // Load stations and sensors data
    await loadSensors(urlSensors);
    await loadStations(urlStations);
  } catch (error: any) {
    throw new Error('Error loading data: ' + error.message);
  } finally {
    // Disconnect from Redis
    await client.quit();
  }
}

// Function to load all data including road data
export async function loadRoadData() {
  try {
    // Connect to Redis
    await client.connect();
    // Load stations and sensors data
    await loadSensors(urlSensors);
    await loadStations(urlStations);
    // Load stations and sensors data
    await updateStationsWithRoadData(urlStations);
  } catch (error: any) {
    throw new Error('Error loading road data: ' + error.message);
  } finally {
    // Disconnect from Redis
    await client.quit();
  }
}