import express, { Request, Response } from "express";
import { fetch } from "../scripts/fetch";  
import { FeedbackForm } from "../scripts/feedbackForm";

export const tmsRouter = express.Router();

tmsRouter.use(express.json());

tmsRouter.get("/stations", async (_req: Request, res: Response): Promise<void> => {
  const response = await fetch("https://tie.digitraffic.fi/api/tms/v1/stations/data")
  // console.log(response.dataUpdatedTime)
  res.status(200).json(response)
})

tmsRouter.post("/feedback", async (_req: Request, res: Response): Promise<Response> => {
  const response = await FeedbackForm(_req.body)
  return res.status(200).json(response)
})
