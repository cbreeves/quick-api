import { DescribeKeyCommand, KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import express, { Request, Response } from "express";


export const kmsHandler = express.Router();


kmsHandler.get("/keys", async (req: Request, res: Response) => {
    const kmsClient = new KMSClient({});
  
    try {
      const keys: { keyId: string; keyArn: string; name: string }[] = [];
      let nextMarker: string | undefined;
  
      // Handle pagination by continuing to make requests while there are more keys
      do {
        const listCommand = new ListKeysCommand({
          Marker: nextMarker,
          Limit: 100, // Fetch 100 keys per request
        });
  
        const listResponse = await kmsClient.send(listCommand);
  
        // For each key, get its description to find the name
        if (listResponse.Keys) {
          for (const key of listResponse.Keys) {
            if (key.KeyId) {
              const describeCommand = new DescribeKeyCommand({
                KeyId: key.KeyId,
              });
  
              try {
                const keyDetails = await kmsClient.send(describeCommand);
                const keyName = keyDetails.KeyMetadata?.Description || "";
  
                keys.push({
                  keyId: key.KeyId,
                  keyArn: key.KeyArn || "",
                  name: keyName,
                });
              } catch (describeError) {
                console.warn(`Could not describe key ${key.KeyId}:`, describeError);
                // Still add the key to the list, but with empty name
                keys.push({
                  keyId: key.KeyId,
                  keyArn: key.KeyArn || "",
                  name: "",
                });
              }
            }
          }
        }
  
        nextMarker = listResponse.NextMarker;
      } while (nextMarker);
  
      res.json(keys);
    } catch (error) {
      console.error("Error fetching KMS keys:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch KMS keys",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      kmsClient.destroy();
    }
  });

  