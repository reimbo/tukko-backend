import { ObjectId } from "mongodb";

export interface Sensor {
  id?: ObjectId,
  stationId?: ObjectId,
  name: string,
  shortName: string,
  timeWindowStart: string,
  timeWindowEnd: string,
  measuredTime: string,
  unit: string,
  value: number
}

export interface Station {
  id?: ObjectId,
  tmsNumber: number,
  dataUpdatedTime: string,
  sensorValues: Sensor[]
}

export interface StationData {
  id?: ObjectId,
  dataUpdatedTime: string,
  stations: Station[]
}
