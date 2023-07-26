import * as mongoDB from "mongodb";
// Access environment variables
require('dotenv').config();

const conn_string = process.env.DB_CONN_STRING
if (!conn_string) {
  console.error("DB_CONN_STRING environment variable is not defined");
  process.exit(1);
}
const client: mongoDB.MongoClient = new mongoDB.MongoClient(conn_string);

export const collections: { tms?: mongoDB.Collection } = {};

export async function connect(): Promise<void> {
  try {
    console.log(process.env.DB_CONN_STRING,process.env.DB_NAME,process.env.colelction_name)
    await client.connect();
    const db: mongoDB.Db = client.db(process.env.DB_NAME || 'tukko');
    const tmsCollection: mongoDB.Collection = db.collection(process.env.COLLECTION_NAME || 'tms');
    collections.tms = tmsCollection;
    tmsCollection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    console.log(`[MongoDB] - Successfully connected to database: ${db.databaseName} and collection: ${tmsCollection.collectionName}`);

  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}
// disconnect from the database when necessary
export function disconnect(): void {
  client.close();
}
