import { ObjectId } from "mongodb";


export interface Sensor {
  id:  number,
  stationId: number,
  name: string,
  shortName: string,  
  timeWindowStart?:  string,
  timeWindowEnd?:  string,
  measuredTime: string,
  unit: string,  
  sensorValueDescriptionFi?: string,
  sensorValueDescriptionEn?: string,
  value: number
}

export interface Station {
  id: number,
  tmsNumber: number,
  dataUpdatedTime: string,
  name: string,
  coordinates: number[],
  sensorValues: Sensor[]
}

export interface StationData {
  dataUpdatedTime: string,
  stations: Station[]
}
