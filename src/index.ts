import express, { Express, Request, Response } from 'express';
import { tmsRouter } from './routes/tms_data'; 

const app: Express = express()
app.use(express.json())
const port: Number = parseInt(process.env.PORT as string) || 3000

app.use("/tms", tmsRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
})
