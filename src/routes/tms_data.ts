import express, { Request, Response } from "express";
import { fetchMongo } from "../scripts/fetch";  
import { FeedbackForm } from "../scripts/feedbackForm";
import { runAggregation } from "../scripts/saveToMongo";

export const tmsRouter = express.Router();

tmsRouter.use(express.json());

tmsRouter.get("/stations", async (_req: Request, res: Response): Promise<void> => {
  const response = await fetchMongo("https://tie.digitraffic.fi/api/tms/v1/stations/data")
  res.status(200).json(response)
})

tmsRouter.post("/feedback", async (_req: Request, res: Response): Promise<Response> => {
  const response = await FeedbackForm(_req.body)
  return res.status(200).json(response)
})

tmsRouter.get("/station/:id", async (_req: Request, res: Response): Promise<void> => {
  const response = await runAggregation(_req.params.id)
  res.status(200).json(response)
})
