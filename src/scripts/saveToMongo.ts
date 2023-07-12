
import * as mongoDB from "mongodb"
import { collections} from "../scripts/mongo";
import { lastFetchTime, time_To_Insert_New_Data,completedInsert, setLastFetchTime, count, resetCount } from "./checkFetchTime";
import {  StationData } from "models/tms_data_model";


export const isMongoEmpty = async () => {
    const collectionCount = await collections.tms?.countDocuments({});
    return collectionCount === 0;
}

const storeFetch = async (data: StationData): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
    try {
        if (time_To_Insert_New_Data) {
          if (count >= 6) {
            console.log(`******More than 1 hour has passed since last Insert - Enabled Insert!\n******`);
            resetCount();
          }
          if (await isMongoEmpty()){
            console.log(`******MongoDB is empty - Enabled Insert!\n******`);
          }
          
          const result = await collections.tms?.insertOne(data);
          console.log(`******Inserted ${data.stations.length} into Mongo\n******`);
          completedInsert();
    
          if (!result) {
            throw new Error('Failed to insert data into MongoDB');
          }
      } else {
          if (lastFetchTime) {
            const latestObj = await collections.tms?.find({}).sort({ dataUpdatedTime: -1 }).limit(1).toArray();
            
            if (latestObj) {
                try {
                  // if(shouldUpdate){
                    // console.log("******Latest Object\n******", latestObj[0].stations[0])
                    const result = await collections.tms?.updateOne(
                    { _id: latestObj[0]._id }, // Specify the document to update using its _id
                    { $set: data  } 
                    );
                    console.log(`******Updated ${data.stations.length} stations into Mongo ${data.dataUpdatedTime}\n******`);
                    
                    if (!result) {
                        throw new Error('Failed to update data into MongoDB');
                      }
                  // }
                    
                }
                catch (error: unknown) {
                    console.error(error)
                    return error
                }
                finally {
                    // Update the lastFetchTime in localStorage with the current time
                    setLastFetchTime(new Date(data.dataUpdatedTime));
                }
          }
        }
      }

  
      } catch (error: unknown) {
        console.error(error)
      return error
    }
  }
  // Handler function to add data to MongoDB
  export function addToMongoDB(data: StationData) {
      storeFetch(data);
    
  }
  
  export async function runAggregation(searchString: string) {
    // console.log("******runAggregation\n******", stations.id)
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
        $or: [
          { 'stations.sensorValues.name': { $in: searchSensorList, $regex: searchString } },
          { 'stations.id': parseInt(searchString) }
        ]
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
                  id: '$$station.id',
                  tmsNumber: '$$station.tmsNumber',
                  coordinates: '$$station.coordinates',
                  name: '$$station.name',
                  dataUpdatedTime: '$$station.dataUpdatedTime',
                  sensorValues: {
                    $filter: {
                      input: '$$station.sensorValues',
                      as: 'sensor',
                      cond: {
                        $or: [
                          { $eq: ['$$sensor.name', searchString] },
                          { $eq: ['$$station.id', parseInt(searchString)] }
                        ]
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
            // 'stations.sensorValues.value': -1,
            'stations.dataUpdatedTime': 1
            // 'stations.sensorValues.stationId': 1
          }
        }
      ];
      
      const result = await collections.tms?.aggregate(aggregationPipeline).toArray();
      if(!result) {
        throw new Error('Failed to aggregate data from MongoDB');
      }
      // const filteredResult = result.map((station: any) => `Station: ${station.stations.sensorValues.stationId} - Record: ${station.stations.sensorValues.value} ${station.stations.sensorValues.unit} - measuredTime: ${station.stations.sensorValues.measuredTime}`);
      // console.log(filteredResult);
      return result;
    } catch (error: unknown) {
      console.error(error)
    }
  }