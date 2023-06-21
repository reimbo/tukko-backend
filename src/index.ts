import express, { Express } from 'express';
import { tmsRouter } from './routes/tms_data'; 
import { connect} from './scripts/mongo';
import { fetch } from "./scripts/fetch";
import { addToMongoDB, runAggregation } from "./scripts/saveToMongo";

import { StationData } from './models/tms_data_model';
import { checkFetchTime } from './scripts/checkFetchTime';
require('dotenv').config();

const app: Express = express();
app.use(express.json());
const port: number = parseInt(process.env.PORT as string);
export const currentUpdateTime = new Date(); 
const searchString = "KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2"; // for testing purposes

connect()
  .then(async (): Promise<void> => {
    app.use("/tms", tmsRouter);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Only fetch if data is not up-to-date or at least 5 minutes have passed since the last fetch
    if(checkFetchTime()){
      const data:StationData = await fetch(process.env.TMS_STATIONS_DATA_URL || "https://tie.digitraffic.fi/api/tms/v1/stations/data") as StationData;
      // ... addToRedis function here
      addToMongoDB(data)
    }
    // await runAggregation(searchString)

  })
  .catch((error: Error): void => {
    console.error("Database connection failed", error);
    process.exit();
  });
  
