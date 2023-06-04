import express, { Express, Request, Response } from "express";
import { grab } from "../scripts/fetch";  

export const tmsRouter: Express = express();
tmsRouter.use(express.json());

tmsRouter.get("/", async (_req: Request, res: Response) => {
  const response: String = await grab("https://tie.digitraffic.fi/api/tms/v1/stations/data")
  res.status(200).json(response)
})
