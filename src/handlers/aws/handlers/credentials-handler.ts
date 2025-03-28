import express, { Express, Request, Response } from "express";
import { LoginRequest } from "../../schemas/LoginRequest";
import { LoginResponse } from "../../schemas/LoginResponse";
import { SecurityService } from "../../../services/securityservice";
import { GetCallerIdentityCommand, STSClient, STSServiceException } from "@aws-sdk/client-sts";
import { promisify } from "util";
import { exec } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const credentialHandler = express.Router();

export interface AWSCredentials {
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  ssoToken: string;
}

interface AWSConfigSection {
  [key: string]: string;
}

interface AWSConfigMap {
  [sectionName: string]: AWSConfigSection;
}

  const execAsync = promisify(exec);

  async function validateCredntials(req: Request, resp: Response) {
    const request: LoginRequest = req.body as LoginRequest;
    const creds: AWSCredentials = req.body;
    try {
      // Create STS client with provided credentials
      const stsClient = new STSClient({
        credentials: {
          accessKeyId: creds.accessKeyID,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.ssoToken, // Optional, include if provided
        },
        region: creds.region, // Or any valid AWS region
      });

      // Attempt to get caller identity
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);

      // If we get here, credentials are valid
      resp.status(200).json({
        valid: true,
        accountId: response.Account,
        arn: response.Arn,
      });
    } catch (error: any) {
      // If credentials are invalid, AWS SDK will throw an error
      resp.status(401).json({
        valid: false,
        message: error.message,
      });
    }
  }

  async function saveCredentials(req: Request, resp: Response) {
    const creds: AWSCredentials = req.body;

    try {
      console.log("saveCredentials " + req);
      // Configure default profile
      await execAsync(`aws configure set aws_access_key_id "${creds.accessKeyID}"`);
      await execAsync(`aws configure set aws_secret_access_key "${creds.secretAccessKey}"`);
      await execAsync(`aws configure set region "${creds.region}"`);

      // If SSO token is provided, set it
      if (creds.ssoToken) {
        await execAsync(`aws configure set aws_session_token "${creds.ssoToken}"`);
      }

      resp.status(200).json({
        success: true,
        message: "AWS CLI credentials configured successfully",
      });
    } catch (error: any) {
      console.error("Error configuring AWS CLI:", error);
      resp.status(500).json({
        success: false,
        message: "Failed to configure AWS CLI credentials",
        error: error.message,
      });
    }
  }

  async function readAWSConfigs(req: Request, resp: Response): Promise<{ credentials: AWSConfigMap; config: AWSConfigMap }> {
    const homeDir = os.homedir();
    const credentialsPath = path.join(homeDir, ".aws", "credentials");
    const configPath = path.join(homeDir, ".aws", "config");
    const parseConfigFile = (content: string): AWSConfigMap => {
      const configMap: AWSConfigMap = {};
      let currentSection = "";
      content.split("\n").forEach((line) => {
        const cleanLine = line.split("#")[0].trim();
        if (!cleanLine) return;
        const sectionMatch = cleanLine.match(/^\[(.*)\]$/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].trim();
          configMap[currentSection] = {};
          return;
        }
        if (currentSection && cleanLine.includes("=")) {
          const [key, ...valueParts] = cleanLine.split("=");
          const value = valueParts.join("=").trim();
          configMap[currentSection][key.trim()] = value;
        }
      });
      return configMap;
    };

    try {
      const credentials = fs.existsSync(credentialsPath) ? parseConfigFile(fs.readFileSync(credentialsPath, "utf-8")) : {};
      const config = fs.existsSync(configPath) ? parseConfigFile(fs.readFileSync(configPath, "utf-8")) : {};
      return { credentials, config };
    } catch (error) {
      console.error("Error reading AWS configuration files:", error);
      throw error;
    }
  }

  async function processCredentials(req: Request, resp: Response) {
    if (req.query.action == "validate") {
      validateCredntials(req, resp);
    } else if (req.query.action === "save") {
      saveCredentials(req, resp);
    }
  }

  credentialHandler.post("/", async (req: Request, resp: Response) => { processCredentials(req, resp) });
  credentialHandler.get("/", async (req: Request, resp: Response) => { readAWSConfigs(req, resp) });
