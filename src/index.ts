// import express, { Express } from 'express';
// import { tmsRouter } from './routes/tms_data';
// import { connect } from './scripts/mongo';
// import { fetch } from "./scripts/fetch";
// import { addToMongoDB, runAggregation } from "./scripts/saveToMongo";

// import { StationData } from './models/tms_data_model';
// import { checkFetchTime } from './scripts/checkFetchTime';
// import dotenv from 'dotenv';
// dotenv.config();

// const app: Express = express();
// app.use(express.json());
// const port: number = parseInt(process.env.PORT as string);
// export const currentUpdateTime = new Date();
// const searchString = "KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2"; // for testing purposes

// connect()
//   .then(async (): Promise<void> => {
//     app.use("/tms", tmsRouter);

//     app.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//     Only fetch if data is not up-to-date or at least 5 minutes have passed since the last fetch
//     if (checkFetchTime()) {
//       const data: StationData = await fetch(process.env.TMS_STATIONS_DATA_URL || "https://tie.digitraffic.fi/api/tms/v1/stations/data") as StationData;
//       // ... addToRedis function here
//       addToMongoDB(data)
//     }
//     // await runAggregation(searchString)

//   })
//   .catch((error: Error): void => {
//     console.error("Database connection failed", error);
//     process.exit();
//   });


// ---------------------------------------- REDIS SERVER ----------------------------------------
// Dependencies
require('dotenv').config();
import express from 'express';
const swaggerUi = require('swagger-ui-express');
import { swaggerSpec } from './scripts/swagger';
import { loadData, loadSensorData } from './scripts/redis/loadData';
import { stations } from './routes/redis/stations';
import { sensors } from './routes/redis/sensors';
import { scheduleScript } from './scripts/schedule';

// Set up the server
export const app = express();
// Default port for backend is 3001
export const port = (process.env.PORT || 3001) as number;
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Use the routes
app.use('/stations', stations);
app.use('/sensors', sensors);
// Set up the Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Schedule data loading processes for Redis database with time rate defined in milliseconds
scheduleScript(loadData, 0, 60000 * 60 /* rate=60min */);
scheduleScript(loadSensorData, 60000 * 3 /* startDelay=3min */, 60000 /* rate=1min */);
// -----------------------------------------------------------------------------------------------