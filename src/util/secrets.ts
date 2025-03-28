import { SecretsManagerClient, GetSecretValueCommand, CreateSecretCommand, UpdateSecretCommand, ListSecretsCommand, GetSecretValueCommandOutput, DeleteSecretCommand } from "@aws-sdk/client-secrets-manager";

export class SecretsManagerUtil {
  private client: SecretsManagerClient;

  constructor() {
    this.client = new SecretsManagerClient({});
  }

  /**
   * Retrieves a secret from AWS Secrets Manager by name
   * @param secretName The name of the secret to retrieve
   * @returns The secret payload
   */
  async getSecret(secretName: string): Promise<any> {
    try {
      this.client = new SecretsManagerClient({});

      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);

      if (response.SecretString) {
        return JSON.parse(response.SecretString);
      }

      throw new Error("Secret value is empty or in binary format");
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Stores a secret in AWS Secrets Manager
   * @param secretName The name of the secret
   * @param payload The secret payload to store
   */
  async storeSecret(secretName: string, payload: any): Promise<void> {
    try {
      this.client = new SecretsManagerClient({});

      const stringifiedPayload = JSON.stringify(payload);

      try {
        // Try to update existing secret first
        const updateCommand = new UpdateSecretCommand({
          SecretId: secretName,
          SecretString: stringifiedPayload,
        });
        await this.client.send(updateCommand);
      } catch (error: any) {
        // If secret doesn't exist, create it
        if (error.name === "ResourceNotFoundException") {
          const createCommand = new CreateSecretCommand({
            Name: secretName,
            SecretString: stringifiedPayload,
          });
          await this.client.send(createCommand);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error storing secret ${secretName}:`, error);
      throw error;
    }
  }

  async deleteSecret(secretName: string): Promise<void> {
    try {
      const command = new DeleteSecretCommand({
        SecretId: secretName,
        // Optional: Specify recovery window in days (7-30, default is 30)
        // RecoveryWindowInDays: 7,
        // Optional: Force delete without recovery window
        // ForceDeleteWithoutRecovery: true
      });

      await this.client.send(command);
    } catch (error) {
      console.error(`Error deleting secret ${secretName}:`, error);
      throw error;
    }
  }
  
  /**
   * Retrieves all secrets from AWS Secrets Manager
   * @returns A map of secret names to their payloads
   */
  async getAllSecrets(): Promise<any[]> {
    try {
      const secrets: any[] = [];
      let nextToken: string | undefined;
      this.client = new SecretsManagerClient({});

      do {
        const listCommand = new ListSecretsCommand({
          NextToken: nextToken,
        });
        const listResponse = await this.client.send(listCommand);

        if (listResponse.SecretList) {
          for (const secret of listResponse.SecretList) {
            if (secret.Name) {
              const valueCommand = new GetSecretValueCommand({
                SecretId: secret.Name,
              });
              const valueResponse = await this.client.send(valueCommand);

              if (valueResponse.SecretString) {
                secrets.push({name: secret.Name, value: JSON.parse(valueResponse.SecretString)});
              }
            }
          }
        }

        nextToken = listResponse.NextToken;
      } while (nextToken);

      return secrets;
    } catch (error) {
      console.error("Error retrieving all secrets:", error);
      throw error;
    }
  }
}
