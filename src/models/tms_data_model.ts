import { ObjectId } from "mongodb";

export interface Sensor {
  id?: ObjectId,
  stationId?: ObjectId,
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
  dataUpdatedTime: Date
  sensorValues: Sensor[]
}

export interface StationData {
  id?: ObjectId,
  dataUpdatedTime: Date,
  stations: Station[]
}
