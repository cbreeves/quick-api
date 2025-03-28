// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { loginRouter } from "./handlers/login";
import { dnsHandler } from "./handlers/dns-handler";
import { secretHandler } from "./handlers/secret-handler";
import { vpcHandler } from "./handlers/vpc-handler";
import { drsHandler } from "./handlers/aws/handlers/drs-handler";
import { initializeDatabase } from "./sequelize/db/init";
import inventoryHandler from "./handlers/inventory/inventory-handler";
import { awsHandler } from "./handlers/aws/aws-handler";
const cors = require("cors");

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/security", loginRouter);
app.use("/dns", dnsHandler);
app.use('/secret', secretHandler);
app.use('/vpc', vpcHandler);
app.use('/api/aws', awsHandler);
app.use('/api/inventory', inventoryHandler);


initializeDatabase().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

