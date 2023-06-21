const axios = require('axios').default;
import * as mongoDB from "mongodb"
import { collections} from "../scripts/mongo";
import {  StationData } from "models/tms_data_model";
import { AxiosResponse } from "axios";
import { lastFetchTime } from "./checkFetchTime";
import {useState} from 'react';
require('dotenv').config();

const axiosConf = {
  headers: {
   clientName: "WIMMA-lab/IoTitude/Travis" 
  }
}


export const fetch = async (url: String): Promise<mongoDB.Document | unknown> => {
  
  try {
    const tmsData_response: AxiosResponse = await axios.get(url, axiosConf)
    const tmsStation_response: AxiosResponse = await axios.get((process.env.TMS_STATION_LIST_URL || "https://tie.digitraffic.fi/api/tms/v1/stations"), axiosConf)  
    
    // Filter out station data with sensor values from tmsData_response
    const stationDataFetched = tmsData_response.data.stations.map( (station: any) => {
      return {
        stationId: station.id,
        dataUpdatedTime: station.dataUpdatedTime,
        tmsNumber : station.tmsNumber,
        sensorValues: station.sensorValues.map( (sensor: any) => {
          return {
            stationId: sensor.stationId,
            name: sensor.name,
            shortName: sensor.shortName,
            timeWindowStart: sensor.timeWindowStart,
            timeWindowEnd: sensor.timeWindowEnd,
            measuredTime: sensor.measuredTime,
            unit: sensor.unit,
            value: sensor.value
          }
        })
      }
    })
    // Filter out station names and coordinates from tmsStation_response
    const stationsListFetched = tmsStation_response.data.features.map((location: any) => {
      return {
        id: location.id,
        geometry: {
          coordinates: location.geometry.coordinates
        },
        properties: {
          id: location.properties.id,
          tmsNumber: location.properties.tmsNumber,
          name: location.properties.name,
          dataUpdatedTime: location.properties.dataUpdatedTime
        }
      }
    });
    
    // Combine the required data from both responses into one object
    const combinedData: StationData = {
      dataUpdatedTime: new Date(Date.now()).toISOString(),
      stations: stationDataFetched.map((station: any) => {
        const matchingStation = stationsListFetched.find((location: any) => location.id === station.stationId);
    
        return {
          id: matchingStation.id,
          tmsNumber: station.tmsNumber,
          dataUpdatedTime: station.dataUpdatedTime,
          name: matchingStation.properties.name,
          coordinates: [matchingStation.geometry.coordinates[1],matchingStation.geometry.coordinates[0]],
          sensorValues: station.sensorValues
        };
      })
    };
    
    // Return the fetched data in combined form for use in redis and mongoDB...
    return combinedData;
  
  } catch (error) {
    console.log(error);
    throw error
  }
  
}

    // await runAggregation("OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1")
const storeFetch = async (data: StationData): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
  const collectionCount = await collections.tms?.countDocuments({});
  const isCollectionEmpty = collectionCount === 0;
  // const lastFetchTime = localStorage.getItem('lastFetchTime');
  

  // const nextUpdateTime = (await collections.tms?.findOne({}, { projection: { dataUpdatedTime: 1 } }))?.dataUpdatedTime;
  try {
    let time_To_Insert_New_Data = false;
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    if ( (currentHour === 9 && currentMinute===0) || isCollectionEmpty) {
      time_To_Insert_New_Data = true;
    }
    else{
      time_To_Insert_New_Data = false;
    }
    
    if (time_To_Insert_New_Data || isCollectionEmpty) {
      const result = await collections.tms?.insertOne(data);
      console.log("******Inserted into Mongo\n******");
      if (!result) {
        throw new Error('Failed to insert data into MongoDB');
      }
    } else {
      if (lastFetchTime) {
        const result = await collections.tms?.findOneAndUpdate(
          {
            dataUpdatedTime: { $lt: new Date(lastFetchTime)},
          },
          {
            $set: {
              data: data
            }
          },
          {
            sort: { dataUpdatedTime: -1 }, // Sort in descending order based on dataUpdatedTime
            // upsert: true
          }
        );
        console.log("******Updated Mongo\n******");
        if (!result) {
          throw new Error('Failed to update data into MongoDB');
        }
      }
    }
    // return await getStore();

    } catch (error: unknown) {
      console.error(error)
    return error
  }
}

const getStore = async (): Promise<mongoDB.Document | undefined> => {
  try {
    const stationDoc = await collections.tms?.findOne({});
    return stationDoc ? stationDoc : undefined;
  } catch (error: unknown) {
    console.error(error);
    return undefined;
  }
};
export function addToMongoDB(data: StationData) {
    // const currentUpdateTime = new Date(data.dataUpdatedTime).getTime();
    storeFetch(data);
  
}

export async function runAggregation(searchString: string) {

  try {
    const searchSensorList = [
      'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1',
      'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2',
      'KESKINOPEUS_60MIN_KIINTEA_SUUNTA2',
      'KESKINOPEUS_60MIN_KIINTEA_SUUNTA1',
      'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2',
      'OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1',
      'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1',
      'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2',
      'KESKINOPEUS_60MIN_KIINTEA_SUUNTA1',
      'KESKINOPEUS_60MIN_KIINTEA_SUUNTA2',
      'KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1',
      'KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2',
      'OHITUKSET_5MIN_LIUKUVA_SUUNTA1',
      'OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1',
      'OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2',
      'OHITUKSET_5MIN_KIINTEA_SUUNTA2',
      'OHITUKSET_60MIN_KIINTEA_SUUNTA1',
      'OHITUKSET_60MIN_KIINTEA_SUUNTA2'
    ];
    
    const query = {
      'stations.sensorValues.name': {
        $in: searchSensorList,
        $regex: searchString,
      },
    };
    const aggregationPipeline = [
      {
        $match: {
          ...query
        }
      },
      {
        $project: {
          stations: {
            $map: {
              input: '$stations',
              as: 'station',
              in: {
                sensorValues: {
                  $filter: {
                    input: '$$station.sensorValues',
                    as: 'sensor',
                    cond: {
                      $eq: ['$$sensor.name', searchString]
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $unwind: '$stations'
      },
      {
        $unwind: '$stations.sensorValues'
      },
      {
        $sort: {
          'stations.sensorValues.value': -1,
          'stations.sensorValues.stationId': 1
        }
      }
    ];

    const result = await collections.tms?.aggregate(aggregationPipeline).toArray();
    if(!result) {
      throw new Error('Failed to aggregate data from MongoDB');
    }
    const filteredResult = result.map((station: any) => `Station: ${station.stations.sensorValues.stationId} - Record: ${station.stations.sensorValues.value} ${station.stations.sensorValues.unit} - measuredTime: ${station.stations.sensorValues.measuredTime}`);
    console.log(filteredResult);
  } catch (error: unknown) {
    console.error(error)
  }
}