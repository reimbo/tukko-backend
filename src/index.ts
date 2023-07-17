import { tmsRouter } from "./routes/tms_data";
import { connect } from "./scripts/mongo";
import { mongoFetch} from "./scripts/saveToMongo";
import cors from "cors";

// ---------------------------------------- REDIS SERVER ----------------------------------------
// Dependencies
require("dotenv").config();
import express from "express";
import compression from "compression";
const swaggerUi = require("swagger-ui-express");
import { swaggerSpec } from "./scripts/swagger";
import { loadStations } from "./scripts/redis/loadStations";
import { loadSensors } from "./scripts/redis/loadSensors";
import { loadRoadworks } from "./scripts/redis/loadRoadworks";
import { stations } from "./routes/redis/stations";
import { sensors } from "./routes/redis/sensors";
import { roadworks } from "./routes/redis/roadworks";
import { scheduleScript } from "./scripts/schedule";

// Set up the server
export const app = express();
// Default port for backend is 3001
export const port = (process.env.PORT || 3001) as number;

// Add cors
app.use(cors());
// Add compression
app.use(compression());

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Use the routes
app.use("/stations", stations);
app.use("/sensors", sensors);
app.use("/roadworks", roadworks);
// Set up the Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Schedule data loading processes for Redis database with a rate in milliseconds
scheduleScript(loadStations, 0, 60000 /* rate=1min */);
scheduleScript(loadSensors, 0, 60000 /* rate=1min */);
scheduleScript(loadRoadworks, 0, 60000 /* rate=1min */);
// -----------------------------------------------------------------------------------------------

// ---------------------------------------- MONGO SERVER ----------------------------------------
// Connect to MongoDB and fetch data every hour for historical data analytics
connect().then(async (): Promise<void> => {
  app.use("/tms", tmsRouter);
  await mongoFetch()
  const hourlyInterval = setInterval(mongoFetch, 3600000 /* rate=1h */)
});
