import { DrsClient,   DescribeSourceServersCommand, GetReplicationConfigurationCommand, ServiceQuotaExceededException, ResourceNotFoundException, UninitializedAccountException, InitializeServiceCommand, DescribeReplicationConfigurationTemplatesCommand, ReplicationConfigurationTemplate } from "@aws-sdk/client-drs";
import { DescribeInstancesCommand, DescribeInstanceTypesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client, Filter, GetInstanceTypesFromInstanceRequirementsCommand, InstanceRequirements, InstanceRequirementsRequest } from "@aws-sdk/client-ec2";
import { CreateInstanceProfileCommand, CreateServiceLinkedRoleCommand, GetInstanceProfileCommand, IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import { DescribeKeyCommand, KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import express, { Request, Response } from "express";

export const drsHandler = express.Router();

export interface DrsInitializationParams {
  // Required parameters
  replicationServerInstanceType: string; // e.g., "t3.small"
  stagingAreaSubnetId: string;
  stagingAreaSecurityGroupIds: string[];

  // Optional parameters with defaults
  defaultLargeStagingDiskType?: "GP2" | "GP3" | "IO1" | "IO2";
  pitEnabled?: boolean;
  ebsEncryption?: {
    kmsKeyId?: string;
    encrypted: boolean;
  };
  tags?: {
    key: string;
    value: string;
  }[];
}

// Add validation function
function validateInitializationParams(params: any): params is DrsInitializationParams {
  if (!params) return false;

  const required = ["replicationServerInstanceType", "stagingAreaSubnetId", "stagingAreaSecurityGroupIds"];

  for (const field of required) {
    if (!params[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (params.stagingAreaSecurityGroupIds && !Array.isArray(params.stagingAreaSecurityGroupIds)) {
    throw new Error("stagingAreaSecurityGroupIds must be an array");
  }

  if (params.defaultLargeStagingDiskType && !["GP2", "GP3", "IO1", "IO2"].includes(params.defaultLargeStagingDiskType)) {
    throw new Error("Invalid defaultLargeStagingDiskType");
  }

  return true;
}

async function getVpcIdFromSubnet(subnetId: string | undefined): Promise<string | null> {
    const ec2Client = new EC2Client({});

    if (subnetId == undefined) return null;

    try {
        const command = new DescribeSubnetsCommand({
            SubnetIds: [subnetId]
        });

        const response = await ec2Client.send(command);
        const subnet = response.Subnets?.[0];
        
        return subnet?.VpcId || null;

    } catch (error) {
        console.error(`Error getting VPC ID for subnet ${subnetId}:`, error);
        throw error;
    } finally {
        ec2Client.destroy();
    }
}

drsHandler.get("/default-settings", async (req: Request, res: Response) => {
    const drsClient = new DrsClient({});
  
    try {
      const command = new DescribeReplicationConfigurationTemplatesCommand({});
      const response = await drsClient.send(command);
      var template: ReplicationConfigurationTemplate | undefined = response.items?.at(0)  ;

      const defaultSettings = {
        subnetId: template?.stagingAreaSubnetId || null,
        securityGroupIds: template?.replicationServersSecurityGroupsIDs || [],
        largeStagingDiskType: template?.defaultLargeStagingDiskType || null,
        pitEnabled: template?.pitPolicy?.at(0)?.enabled || false,
        ebsEncryption: {
          enabled: template?.ebsEncryption || false,
          kmsKeyId: template?.ebsEncryptionKeyArn || null
        },
        replicationServerInstanceType: template?.replicationServerInstanceType || null,
        vpcId: await getVpcIdFromSubnet( template?.stagingAreaSubnetId )
      };

       

  
      res.json(defaultSettings);
  
    } catch (error) {
      console.error("Error fetching DRS default settings:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch DRS default settings",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      drsClient.destroy();
    }
  });

drsHandler.get("/status", async (req: Request, res: Response) => {
  const drsClient = new DrsClient({});

  try {
    // Try to get source servers - this will fail if DRS isn't initialized
    const sourceServersCommand = new DescribeSourceServersCommand({});
    const sourceServers = await drsClient.send(sourceServersCommand);

    const response = {
      isEnabled: true,
      sourceServers: {
        count: sourceServers.items?.length || 0,
        servers: sourceServers.items?.map((server) => ({
          sourceServerID: server.sourceServerID,
          arn: server.arn,
          dataReplicationInfo: server.dataReplicationInfo,
          sourceProperties: server.sourceProperties,
          recoveryInstanceId: server.recoveryInstanceId,
          //launchConfiguration: server.launchConfiguration,
          tags: server.tags,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    if (error instanceof UninitializedAccountException) {
      // DRS is not initialized in this account
      res.json({
        isEnabled: false,
        message: "AWS Elastic Disaster Recovery is not initialized in this account",
      });
    } else if (error instanceof ResourceNotFoundException) {
      // DRS is not initialized in this account
      res.json({
        isEnabled: false,
        message: "AWS Elastic Disaster Recovery is not initialized in this account",
      });
    } else if (error instanceof ServiceQuotaExceededException) {
      res.status(400).json({
        error: "Service quota exceeded",
        message: "You have reached the maximum number of source servers",
      });
    } else {
      console.error("Error checking DRS status:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to check DRS status",
      });
    }
  } finally {
    drsClient.destroy();
  }
});

// Optional: Add endpoint to get details for a specific source server
drsHandler.get("/source-server/:serverId", async (req: Request, res: Response) => {
  const drsClient = new DrsClient({});

  try {
    const sourceServersCommand = new DescribeSourceServersCommand({
      filters: {
        sourceServerIDs: [req.params.serverId],
      },
    });

    const sourceServers = await drsClient.send(sourceServersCommand);
    // Get replication configuration
    const replicationConfigCommand = new GetReplicationConfigurationCommand({ sourceServerID: req.params.serverId });
    const replicationConfig = await drsClient.send(replicationConfigCommand);

    if (!sourceServers.items || sourceServers.items.length === 0) {
      res.status(404).json({
        error: "Not Found",
        message: "Source server not found",
      });
      return;
    }
    const response = {
      isEnabled: true,
      sourceServers: {
        count: sourceServers.items?.length || 0,
        servers: sourceServers.items?.map((server) => ({
          sourceServerID: server.sourceServerID,
          arn: server.arn,
          dataReplicationInfo: server.dataReplicationInfo,
          sourceProperties: server.sourceProperties,
          recoveryInstanceId: server.recoveryInstanceId,
          //launchConfiguration: server.launchConfiguration,
          tags: server.tags,
        })),
      },
      replicationConfiguration: {
        replicationServerInstanceType: replicationConfig.replicationServerInstanceType,
        replicationServersSecurityGroupsIDs: replicationConfig.replicationServersSecurityGroupsIDs,
        defaultLargeStagingDiskType: replicationConfig.defaultLargeStagingDiskType,
        //ebs: replicationConfig.ebs,
        //replicationConfiguration: replicationConfig.replicationConfiguration
      },
    };
    res.json(sourceServers.items[0]);
  } catch (error) {
    console.error("Error fetching source server details:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch source server details",
    });
  } finally {
    drsClient.destroy();
  }
});

drsHandler.post("/initialize", async (req: Request, res: Response) => {
  const drsClient = new DrsClient({});

  try {
    // Validate input parameters
    try {
      validateInitializationParams(req.body);
    } catch (validationError) {
      res.status(400).json({
        error: "Validation Error",
        message: validationError instanceof Error ? validationError.message : "Invalid parameters",
      });
      throw validationError;
    }

    const initParams: DrsInitializationParams = req.body;

    // Check if DRS is already initialized
    try {
      const sourceServersCommand = new DescribeSourceServersCommand({});
      await drsClient.send(sourceServersCommand);

      res.status(409).json({
        message: "AWS Elastic Disaster Recovery is already initialized in this account",
      });
    } catch (error) {
      if (!(error instanceof UninitializedAccountException) && !(error instanceof ResourceNotFoundException)) {
        res.status(409).json({
          message: "AWS Elastic Disaster Recovery encountered an",
        });
        throw error;
      }
    }

    // Initialize DRS service with provided parameters
    const initializeCommand = new InitializeServiceCommand({
      replicationServerInstanceType: initParams.replicationServerInstanceType,
      defaultReplicationServerSecurityGroupsIDs: initParams.stagingAreaSecurityGroupIds,
      defaultReplicationSubnetID: initParams.stagingAreaSubnetId,
      defaultLargeStagingDiskType: initParams.defaultLargeStagingDiskType || "GP3",
      pitPolicy: initParams.pitEnabled
        ? {
            enabled: true,
          }
        : undefined,
      ebsEncryption: initParams.ebsEncryption,
      tags: initParams.tags?.map((tag) => ({
        Key: tag.key,
        Value: tag.value,
      })),
    });
    console.log(initializeCommand);
    await drsClient.send(initializeCommand);

    res.status(201).json({
      message: "AWS Elastic Disaster Recovery has been successfully initialized",
      status: "INITIALIZED",
      configuration: {
        replicationServerInstanceType: initParams.replicationServerInstanceType,
        stagingAreaSubnetId: initParams.stagingAreaSubnetId,
        stagingAreaSecurityGroupIds: initParams.stagingAreaSecurityGroupIds,
        defaultLargeStagingDiskType: initParams.defaultLargeStagingDiskType || "GP3",
        pitEnabled: initParams.pitEnabled || false,
        ebsEncryption: initParams.ebsEncryption,
        tags: initParams.tags,
      },
    });
  } catch (error) {
    console.error("Error initializing DRS:", error);

    if (error instanceof ServiceQuotaExceededException) {
      res.status(400).json({
        error: "Service quota exceeded",
        message: "Cannot initialize DRS due to service quota limitations",
      });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to initialize AWS Elastic Disaster Recovery",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } finally {
    drsClient.destroy();
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to initialize AWS Elastic Disaster Recovery",
    });
  }
});



