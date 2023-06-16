import express, { Express } from 'express';
import { tmsRouter } from './routes/tms_data'; 
import { connect} from './scripts/mongo';
import { fetch, runAggregation } from "./scripts/fetch";

const app: Express = express();
app.use(express.json());
const port: number = parseInt(process.env.PORT as string);

const searchString = "KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2";

connect()
  .then(async (): Promise<void> => {
    app.use("/tms", tmsRouter);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // await runAggregation(searchString)

  })
  .catch((error: Error): void => {
    console.error("Database connection failed", error);
    process.exit();
  });
fetch("https://tie.digitraffic.fi/api/tms/v1/stations/data")
