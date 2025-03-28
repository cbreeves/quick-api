import express, { Request, Response } from "express";
import { SecretsManagerUtil } from "../util/secrets";

export const secretHandler = express.Router();
const secretsManager = new SecretsManagerUtil();

// GET /secrets - List all secrets
secretHandler.get("/", async (req: Request, res: Response) => {
  try {
    const secrets = await secretsManager.getAllSecrets();
    res.status(200).json(secrets);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve secrets list" });
  }
  return;
});

// GET /secrets/:secretName - Retrieve a specific secret
secretHandler.get("/:secretName", async (req: Request, res: Response): Promise<any> => {
  try {
    const secret = await secretsManager.getSecret(req.params.secretName);
    if (!secret) {
      return res.status(404).json({ error: "Secret not found" });
    }
    res.status(200).json(secret);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve secret" });
  }
  return;
});

// POST /secrets - Create/Save a new secret
secretHandler.post("/:secretName", async (req: Request, res: Response): Promise<any> => {
  try {
    const secretName = req.params.secretName;
    const secretValue  = req.body;
    if (!secretName || !secretValue) {
      return res.status(400).json({ error: "Secret name and value are required" });
    }
    console.log(secretName, secretValue);
    await secretsManager.storeSecret(secretName, secretValue);
    res.status(201).json({ message: "Secret created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save secret" });
  }
  return;
});

secretHandler.delete("/:secretName", async (req: Request, res: Response): Promise<any> => {
  try {
    const secretName = req.params.secretName;
    if (!secretName) {
      return res.status(400).json({ error: "Secret name is required" });
    }

    await secretsManager.deleteSecret(secretName);
    res.status(200).json({ message: "Secret deleted successfully" });
  } catch (error) {
    console.error("Error deleting secret:", error);
    res.status(500).json({ error: "Failed to delete secret" });
  }
  return;
});



// Add this to your main Express app
// app.use('/api/v1', router);
