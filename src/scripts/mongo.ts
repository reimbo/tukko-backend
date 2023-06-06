import * as mongoDB from "mongodb"

export const collections: { tms?: mongoDB.Collection } = {}


export async function connect(): Promise<void> {
  console.log("In connect()");
  
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING || "mongodb://localhost:27017")
  await client.connect()
  console.log("Past client.connect()");
  
  const db: mongoDB.Db = client.db(process.env.DB_NAME || 'travis')
  const collection: mongoDB.Collection = db.collection(process.env.COLLECTION_NAME || 'tms')
  console.log(`Connected to collection ${collection.collectionName} in db ${db.databaseName}`)
}
