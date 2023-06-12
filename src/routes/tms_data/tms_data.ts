import express, { Express, Request, Response } from "express";
import { fetch } from "../../scripts/fetch";  
import { getSensors } from "./scripts/fetch";

export const tmsRouter: Express = express();
tmsRouter.use(express.json());

tmsRouter.get("/stations", async (_req: Request, res: Response): Promise<void> => {
  const response: String | unknown = await fetch("https://tie.digitraffic.fi/api/tms/v1/stations")
  res.status(200).json(response)
})

tmsRouter.get("/stations/data", async (_req: Request, res: Response): Promise<void> => {
  const response: String | unknown = await fetch("https://tie.digitraffic.fi/api/tms/v1/stations/data")
  res.status(200).json(response)
})

tmsRouter.get("/stations/data/:sensor", async (req: Request, res: Response): Promise<void> => {
  const response: String | unknown = await getSensors(req.params.sensor)
  res.status(200).json(response)
})

