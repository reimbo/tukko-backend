import { ObjectId } from "mongodb";

export interface Features{
  id: string,
  geometry: {
    coordinates: number[]
  },
  properties: {
    id: number,
    tmsNumber: number,
    name: string,
    dataUpdatedTime: Date
  }
}

export interface Sensor {
  id?:  ObjectId,
  stationId: ObjectId,
  name: string,
  shortName: string,
  timeWindowStart: Date,
  timeWindowEnd: Date,
  measuredTime: Date,
  unit: string,
  value: number
}

export interface Station {
  id?: ObjectId,
  tmsNumber: number,
  dataUpdatedTime: Date,
  longitude: number,
  latitude: number,
  sensorValues: Sensor[]
}

export interface StationData {
  id?: ObjectId,
  dataUpdatedTime: Date,
  stations: Station[]
}
