const axios = require('axios').default;
import * as mongoDB from "mongodb"
import { collections } from "../scripts/mongo";
import { StationData, Station, Sensor } from "models/tms_data_model";
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
    return data
  } catch (error) {
    console.log(error);
    throw error
  }
}

const storeFetch = async (data: any): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
  try {
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
        dataUpdatedTime: station.dataUpdatedTime,
        sensorValues: sensorValues
      }
    })
    
    const result = await collections.tms?.insertOne({
      dataUpdatedTime: data.dataUpdatedTime,
      stations: stations,
    });

    if (!result) {
      throw new Error('Failed to insert data into MongoDB');
      }

    return await getStore();

    } catch (error: unknown) {
      console.error(error)
    return error
  }
}

const getStore = async (): Promise<mongoDB.Document | unknown >=> {
  try {
    const stationDoc = (await collections.tms?.findOne({})) as mongoDB.Document
    console.log(typeof(stationDoc))
    return stationDoc
  } catch (error: unknown) {
    console.error(error)
    return error
  }
}
