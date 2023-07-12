// Documentation for Redis OM https://www.npmjs.com/package/redis-om/v/0.4.0-beta.3?activeTab=readme
require("dotenv").config();
import { createClient } from "redis";
import { Repository } from "redis-om";
import { stationSchema, roadworkSchema } from "../../models/redis/tmsModels";

// Create client for connections to Redis
const client = createClient({
  url: (process.env.REDIS_OM_URL || "redis://localhost:6379") as string,
  password: process.env.REDIS_OM_PASSW as string,
});
client.on("error", (err: any) => console.log("Redis Client Error", err));

let stationRepository: Repository;
let roadworkRepository: Repository;
(async () => {
  // Connect to Redis
  await client.connect();
  // Create repositories
  stationRepository = new Repository(stationSchema, client);
  roadworkRepository = new Repository(roadworkSchema, client);
  // Create indices in the repositories for efficient searching
  await stationRepository.createIndex();
  await roadworkRepository.createIndex();
})();

export { client, stationRepository, roadworkRepository };
