import { tmsRouter } from './routes/tms_data';
import { connect } from './scripts/mongo';
import { fetch } from "./scripts/fetch";
import { addToMongoDB, runAggregation } from "./scripts/saveToMongo";
import { StationData } from './models/tms_data_model';
import { checkFetchTime } from './scripts/checkFetchTime';

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

// Schedule data loading processes for Redis database with time intervals defined in milliseconds
scheduleScript(loadRoadData, 0, 60000 * 60 * 12 /* =12h */);
scheduleScript(loadData, 60000 * 5 /* =5min */, 60000 /* =1min */);
// -----------------------------------------------------------------------------------------------

// ---------------------------------------- MONGO SERVER ----------------------------------------
const searchString = "KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2"; // a sample search term for testing mongoDB aggregation
connect()
  .then(async (): Promise<void> => {
    app.use("/tms", tmsRouter);
    // Only fetch if data is not up-to-date or at least 5 minutes have passed since the last fetch
    if (checkFetchTime()) {
      const data: StationData = await fetch(process.env.TMS_STATIONS_DATA_URL || "https://tie.digitraffic.fi/api/tms/v1/stations/data") as StationData;
      addToMongoDB(data)
    }
    // await runAggregation(searchString) // run aggregation and return the search results

  })
