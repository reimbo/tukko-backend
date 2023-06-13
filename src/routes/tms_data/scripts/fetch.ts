import * as mongoDB from "mongodb"
import { collections } from "../../../scripts/mongo";

export const getSensors = async (sensorName: string): Promise<mongoDB.Document | unknown | null> => {
  try {

const query = [
  { $match: { 'stations.sensorValues.measuredTime': {$gt: new Date(Date.now()-(1000*60*60*24))},'stations.sensorValues.name': sensorName } },
  { $unwind: '$stations' },
  { $unwind: '$stations.sensorValues' },
  { $match: { 'stations.sensorValues.name': sensorName } },
  { $project: {
    _id: 0,
    name: '$stations.sensorValues.name',
    unit: '$stations.sensorValues.unit',
    value: '$stations.sensorValues.value',
    stationId: '$stations.sensorValues.stationId',
    measuredTime: '$stations.sensorValues.measuredTime'
  }},
];

const result = await collections.tms?.aggregate(query).toArray();

console.log(result);
    return result
  } catch (error: unknown) {
    console.error(error)
    return error
  }
}