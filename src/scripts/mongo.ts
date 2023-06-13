import * as mongoDB from "mongodb";
import { Station, StationData } from "../models/tms_data_model";
import { fetch } from "../scripts/fetch";

export const collections: { tms?: mongoDB.Collection } = {};

const ObjectId = require('mongodb').ObjectId;

const insertDataIntoMongoDB = async (data: StationData) => {
  try {
    if (collections.tms) {
      const plainData = JSON.parse(JSON.stringify(data));
      plainData._id = new ObjectId(); // Generate a unique ObjectId
      // const result = await collections.tms.insertMany([plainData]);
      // console.log(`${result.insertedCount} documents inserted into MongoDB`);
      console.log("We are not inserting any data for now!!!\n********")
    } else {
      console.error("MongoDB collection not available");
    }
  } catch (error) {
    console.error("Error inserting data into MongoDB:", error);
    throw error;
  }
};

const fetchAndInsertData = async () => {
  try {
    console.log("Fetching data...");
    const data : StationData = await fetch("https://tie.digitraffic.fi/api/tms/v1/stations/data") as StationData;
    console.log("Data fetched successfully");
    // console.log("Data:", data);
    console.log("Inserting data into MongoDB...");
    // await insertDataIntoMongoDB(data);
    console.log("Data inserted into MongoDB");
  } catch (error) {
    console.error("Error fetching and inserting data:", error);
  }
};

export async function connect(): Promise<void> {
  try {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://admin:admin@localhost:2717");
    await client.connect();
    const db: mongoDB.Db = client.db(process.env.DB_NAME || 'travis');
    const tmsCollection: mongoDB.Collection = db.collection(process.env.COLLECTION_NAME || 'tms');

    collections.tms = tmsCollection;
    await fetchAndInsertData();
    console.log(`Successfully connected to database: ${db.databaseName} and collection: ${tmsCollection.collectionName}`);
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}
