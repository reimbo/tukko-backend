import * as mongoDB from "mongodb"

export const collections: { tms?: mongoDB.Collection } = {}

export async function connect(): Promise<void> {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING || "mongodb://localhost:27017");
  await client.connect();
  const db: mongoDB.Db = client.db(process.env.DB_NAME || 'travis');
  const tmsCollection: mongoDB.Collection = db.collection(process.env.GAMES_COLLECTION_NAME || 'tms');
  
  collections.tms = tmsCollection;
      
  console.log(`Successfully connected to database: ${db.databaseName} and collection: ${tmsCollection.collectionName}`);
}
