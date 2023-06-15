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

export const fetch = async (url: String): Promise<mongoDB.Document | unknown> => {
  try {
    const response: AxiosResponse = await axios.get(url, axiosConf)
    const response2: AxiosResponse = await axios.get("https://tie.digitraffic.fi/api/tms/v1/stations")  
    
    // Filter out station data with sensor values from response
    const stationDataFetched = response.data.stations.map( (station: any) => {
      return {
        stationId: station.tmsNumber,
        dataUpdatedTime: station.dataUpdatedTime,
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
      dataUpdatedTime: new Date(response.data.dataUpdatedTime),
      stations: stationDataFetched.map((station: any) => {
        const matchingStation = stationsListFetched.find((location: any) => location.properties.tmsNumber === station.stationId);
    
        return {
          id: ObjectId,
          tmsNumber: station.stationId,
          dataUpdatedTime: station.dataUpdatedTime,
          longitude: matchingStation.geometry.coordinates[1],
          latitude: matchingStation.geometry.coordinates[0],
          sensorValues: station.sensorValues
        };
      })
    };
    
     const data = await storeFetch(combinedData);
    
    await runAggregation("OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1")
    return data
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
    // const stations: Station[] = data.flatMap((stationData: StationData) =>
    //   stationData.stations.map((station: Station) => ({
    //     id: station.id,
    //     tmsNumber: station.tmsNumber,
    //     dataUpdatedTime: stationData.dataUpdatedTime,
    //     sensorValues: station.sensorValues.map((sensor: Sensor) => ({
    //       stationId: sensor.stationId,
    //       name: sensor.name,
    //       shortName: sensor.shortName,
    //       timeWindowStart: sensor.timeWindowStart,
    //       timeWindowEnd: sensor.timeWindowEnd,
    //       measuredTime: sensor.measuredTime,
    //       unit: sensor.unit,
    //       value: sensor.value
    //     }))
    //   }))
    // );

    // console.log(typeof(stations[0].dataUpdatedTime))
    // console.log(data.dataUpdatedTime)
    // console.log(stations.length)
    // const result = await collections.tms?.updateOne(
    //   { dataUpdatedTime: data.dataUpdatedTime },
    //   { $setOnInsert: { stations: stations } },
    //   { upsert: true }
    // );
    const result = await collections.tms?.updateOne(
      {},
      { $set: { stations: data }, $setOnInsert: { dataUpdatedTime: data.dataUpdatedTime } },
      { upsert: true }
    );
    if (!result) {
      throw new Error('Failed to insert data into MongoDB');
      }

    return await getStore();

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

//db.tms.find( { stations: { $elemMatch: { tmsNumber: 20002, 'sensorValues.stationId':20002 } }})
//  db.tms.find( { stations: { $elemMatch: { tmsNumber: 130, 'sensorValues.id':5158 } }})
// db.tms.find( { }, {stations: 0}) // will not show stations
// db.tms.find( { }, {'stations.sensorValues': 1}) // only show sensorValues
//// Assuming you have a collection called 'tms' and each document contains 'stations' array with 'sensorValues' objects

// To show only selected sensor objects with a specific sensorID from each sensorValues array:
// db.tms.aggregate([ { $match: { 'stations.sensorValues.name': 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2' } }, { $project: { stations: { $map: { input: '$stations', as: 'station', in: { sensorValues: { $filter: { input: '$$station.sensorValues', as: 'sensor', cond: { $eq: ['$$sensor.name', 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2'] } } } } } } } }])
// db.tms.aggregate([{ $match: { 'stations.sensorValues.name': 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2' } }, { $project: { stations: { $map: { input: '$stations', as: 'station', in: { sensorValues: { $filter: { input: '$$station.sensorValues', as: 'sensor', cond: { $eq: ['$$sensor.name', 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2'] } } } } } } } }, { $unwind: '$stations' }, { $unwind: '$stations.sensorValues' }, { $sort: { 'stations.sensorValues.value': -1 } }])

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
    console.log(result);
    const filteredResult = result.map((station: any) => `Station: ${station.stations.sensorValues.stationId} - Record: ${station.stations.sensorValues.value} ${station.stations.sensorValues.unit} - measuredTime: ${station.stations.sensorValues.measuredTime}`);
    console.log(filteredResult);
  } catch (error: unknown) {
    console.error(error)
  }
}