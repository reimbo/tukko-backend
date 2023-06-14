const axios = require('axios').default;
import * as mongoDB from "mongodb"
import { collections} from "../scripts/mongo";
import {  Station, Sensor } from "models/tms_data_model";
import { AxiosResponse } from "axios";

const axiosConf = {
  headers: {
   clientName: "WIMMA-lab/IoTitude/Travis" 
  }
}

export const fetch = async (url: String): Promise<mongoDB.Document | unknown> => {
  try {
    const response: AxiosResponse = await axios.get(url, axiosConf)
    const data = await storeFetch(response.data)
    await runAggregation()
    return data
  } catch (error) {
    console.log(error);
    throw error
  }
}

const storeFetch = async (data: any): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
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
    const stations: Station[] = data.stations.map((station: Station) => {
      const sensorValues: Sensor[] = station.sensorValues.map((sensor: Sensor) => ({
          id: sensor.id,
          stationId: sensor.stationId,
          name: sensor.name,
          shortName: sensor.shortName,
          timeWindowStart: sensor.timeWindowStart,
          timeWindowEnd: sensor.timeWindowEnd,
          measuredTime: sensor.measuredTime,
          unit: sensor.unit,
          value: sensor.value
        }))

      return {
        id: station.id,
        tmsNumber: station.tmsNumber,
        dataUpdatedTime: new Date(station.dataUpdatedTime),
        sensorValues: sensorValues
      }
    })
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
      { $set: { stations: stations }, $setOnInsert: { dataUpdatedTime: data.dataUpdatedTime } },
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
    return stationDoc ?? undefined;
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

export async function runAggregation() {

  try {

    const aggregationPipeline = [
      {
        $match: {
          'stations.sensorValues.name': 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2'
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
                      $eq: ['$$sensor.name', 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2']
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
          'stations.sensorValues.value': -1
        }
      }
    ];

    const result = await collections.tms?.aggregate(aggregationPipeline).toArray();
    if(!result) {
      throw new Error('Failed to aggregate data from MongoDB');
    }
    console.log(result[0].stations.sensorValues.value);
    const filteredResult = result.map((station: any) => station.stations.sensorValues.value);
    console.log(filteredResult);
  } catch (error: unknown) {
    console.error(error)
  }
}