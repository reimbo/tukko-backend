const axios = require('axios').default;
import * as mongoDB from "mongodb"
import { collections} from "../scripts/mongo";
import {  StationData } from "models/tms_data_model";
import { AxiosResponse } from "axios";
import { ObjectId } from "mongodb";

const axiosConf = {
  headers: {
   clientName: "WIMMA-lab/IoTitude/Travis" 
  }
}
let fetchedCombinedData: StationData;
export const fetch = async (url: String): Promise<mongoDB.Document | unknown> => {
  try {
    const response: AxiosResponse = await axios.get(url, axiosConf)
    const response2: AxiosResponse = await axios.get("https://tie.digitraffic.fi/api/tms/v1/stations")  
    
    // Filter out station data with sensor values from response
    const stationDataFetched = response.data.stations.map( (station: any) => {
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
    // Filter out station names and coordinates from response2
    const stationsListFetched = response2.data.features.map((location: any) => {
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
      // mongoDB will generate an id automatically // id: new ObjectId, 
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
    
    fetchedCombinedData = combinedData;
    await storeFetch(fetchedCombinedData);
    
    await runAggregation("OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1")

    // Return the fetched data in combined form for use in redis and mongoDB...
    return combinedData;
  } catch (error) {
    console.log(error);
    throw error
  }
}

const storeFetch = async (data: StationData): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
  try {
    // const existingData = await getStore("23172") as mongoDB.Document | undefined;
    // console.log(existingData && existingData[0].dataUpdatedTime instanceof Date ? existingData[0].dataUpdatedTime.toDateString() : undefined);
    // console.log(existingData)
    // if (existingData && existingData.dataUpdatedTime instanceof Date) {
    //   const currentDate = new Date();

    //   if (
    //     existingData.dataUpdatedTime.getDate() === currentDate.getDate() &&
    //     existingData.dataUpdatedTime.getMonth() === currentDate.getMonth() &&
    //     existingData.dataUpdatedTime.getFullYear() === currentDate.getFullYear()
    //   ) {
    //     console.log('Data is already up to date. Skipping update.');
    //     return existingData;
    //   }
    // }
  

    // console.log(typeof(stations[0].dataUpdatedTime))
    // console.log(data.dataUpdatedTime)
    // console.log(stations.length)
   

    const result = await collections.tms?.updateOne(
      {
        dataUpdatedTime: { $lt: data.dataUpdatedTime },
        // 'stations.sensorValues.name': 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2'
      },
      [
        {
          $set: {
            data: data
          }
        },
        {
          $replaceRoot: {
            newRoot: '$data'
          }
        }
      ],
      {
        upsert: true
      }
    );


    
    
    if (!result) {
      throw new Error('Failed to insert data into MongoDB');
      }

    // return await getStore();

    } catch (error: unknown) {
      console.error(error)
    return error
  }
}

const getStore = async (
  stationId?: string,
  sensorId?: string,
  sensorName?: string,
  date?: Date
  ): Promise<mongoDB.Document | undefined> => {
  try {
    // const query: any = {};

    const criteria: any[] = [];

    if (stationId) {
      // console.log(stationId)
      criteria.push({ 'stations.id': stationId });
    }

    if (sensorId) {
      console.log(sensorId+"sensor***")
      criteria.push({ 'stations.sensorValues.id': sensorId });
    }

    if (sensorName) {
      criteria.push({ 'stations.sensorValues.name': sensorName });
    }

    if (date) {
      criteria.push({ 'stations.dataUpdatedTime': { $gte: date } });
    }
    
    const query: any = criteria.length > 0 ? { $and: criteria } : {};
    if (criteria.length > 0) {
      query.$and = criteria;
      // console.log(query)
    }

    const stationDoc = await collections.tms?.findOne(query);
    return stationDoc ? stationDoc : undefined;
  } catch (error: unknown) {
    console.error(error);
    return undefined;
  }
};


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