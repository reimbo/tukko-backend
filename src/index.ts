import express, { Express } from 'express';
import { tmsRouter } from './routes/tms_data'; 
import { connect } from './scripts/mongo';

const app: Express = express();
app.use(express.json());
const port: number = parseInt(process.env.PORT as string) || 3001;

connect()
  .then((): void => {
    app.use("/tms", tmsRouter);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    
  })
  .catch((error: Error): void => {
    console.error("Database connection failed", error);
    process.exit();
  });

  
