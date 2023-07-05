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
import { loadData, loadSensorData } from './scripts/redis/loadStations';
import { loadRoadworkData } from './scripts/redis/loadRoadworks';
import { stations } from './routes/redis/stations';
import { sensors } from './routes/redis/sensors';
import { roadworks } from './routes/redis/roadworks';
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
app.use('/roadworks', roadworks);
// Set up the Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Schedule data loading processes for Redis database with time rate defined in milliseconds
scheduleScript(loadData, 0, 60000 * 60 /* rate=60min */);
scheduleScript(loadSensorData, 60000 /* startDelay=1min */, 60000 /* rate=1min */);
scheduleScript(loadRoadworkData, 0, 60000 /* rate=1min */);
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
