
import * as mongoDB from "mongodb"
import { collections} from "../scripts/mongo";
import { lastFetchTime, time_To_Insert_New_Data,completedInsert, setLastFetchTime } from "./checkFetchTime";
import {  StationData } from "models/tms_data_model";

const storeFetch = async (data: StationData): Promise<mongoDB.InsertOneResult<mongoDB.Document> | unknown>  => {
    const collectionCount = await collections.tms?.countDocuments({});
    const isCollectionEmpty = collectionCount === 0;  
  
    try {
      
      if (time_To_Insert_New_Data || isCollectionEmpty) {
        const result = await collections.tms?.insertOne(data);
        console.log("******Inserted into Mongo\n******");
        completedInsert();
  
        if (!result) {
          throw new Error('Failed to insert data into MongoDB');
        }
      } else {
          if (lastFetchTime) {
            const latestObj = await collections.tms?.find({}).sort({ dataUpdatedTime: -1 }).limit(1).toArray();
            
            if (latestObj) {
                try {
                    // console.log("******Latest Object\n******", latestObj[0].stations[0])
                    const result = await collections.tms?.updateOne(
                    { _id: latestObj[0]._id }, // Specify the document to update using its _id
                    { $set: data  } 
                    );
                    console.log(`******Updated Mongo ${data.dataUpdatedTime}\n******`);
                    
                    if (!result) {
                        throw new Error('Failed to update data into MongoDB');
                      }
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
      // return await getStore();
  
      } catch (error: unknown) {
        console.error(error)
      return error
    }
  }
  
  const getStore = async (): Promise<mongoDB.Document | undefined> => {
    try {
      const stationDoc = await collections.tms?.find({}).sort({ dataUpdatedTime: -1 }).limit(1).toArray();
      return stationDoc ? stationDoc : undefined;
    } catch (error: unknown) {
      console.error(error);
      return undefined;
    }
  };
  // Handler function to add data to MongoDB
  export function addToMongoDB(data: StationData) {
      // const currentUpdateTime = new Date(data.dataUpdatedTime).getTime();
      storeFetch(data);
    
  }
  
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
      const filteredResult = result.map((station: any) => `Station: ${station.stations.sensorValues.stationId} - Record: ${station.stations.sensorValues.value} ${station.stations.sensorValues.unit} - measuredTime: ${station.stations.sensorValues.measuredTime}`);
      console.log(filteredResult);
    } catch (error: unknown) {
      console.error(error)
    }
  }