// Documentation for Redis OM https://www.npmjs.com/package/redis-om/v/0.4.0-beta.3?activeTab=readme
import { createClient } from 'redis';

// Create client for connections to Redis
const client = createClient({
    url: (process.env.REDIS_OM_URL || 'redis://localhost:6379') as string,
    password: process.env.REDIS_OM_PASSW as string
});

client.on('error', (err: any) => console.log('Redis Client Error', err));
export default client;