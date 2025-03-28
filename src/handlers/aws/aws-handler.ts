import express from "express";
import { kmsHandler } from "./handlers/kms-handler";
import { ec2Handler } from "./handlers/ec2-handler";
import { drsHandler } from "./handlers/drs-handler";
import { stsHandler } from "./handlers/sts-handler";
import { credentialHandler } from "./handlers/credentials-handler";
 

export const awsHandler = express.Router();

awsHandler.use('/kms', kmsHandler);
awsHandler.use('/ec2', ec2Handler);
awsHandler.use('/drs', drsHandler);
awsHandler.use('/sts', stsHandler);
awsHandler.use('/credentials', credentialHandler);