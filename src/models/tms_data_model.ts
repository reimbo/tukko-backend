import { ObjectId } from "mongodb";


export interface Sensor {
  id?:  number,
  stationId?: number,
  name: string,
  shortName: string,  
  timeWindowStart?: Date | string,
  timeWindowEnd?: Date | string,
  measuredTime: Date | string,
  unit: string,  
  sensorValueDescriptionFi?: string,
  sensorValueDescriptionEn?: string,
  value: number
}

export interface Station {
  id?: number,
  tmsNumber: number,
  dataUpdatedTime: Date | string,
  name: string,
  coordinates: number[],
  sensorValues: Sensor[]
}

export interface StationData {
  id?: ObjectId,
  dataUpdatedTime: Date | string,
  stations: Station[]
}
