import { DescribeInstanceTypesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client, Filter } from "@aws-sdk/client-ec2";
import { DescribeKeyCommand, KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import express, { Request, Response } from "express";


export const ec2Handler = express.Router();


ec2Handler.get("/instance-types/:family", async (req: Request, res: Response) => {
    const ec2Client = new EC2Client({});
  
    try {
      // Define minimum requirements for DRS
      // These are base requirements - adjust as needed
      const filter: Filter = {
        Name: "instance-type",
        Values: [req.params.family + ".*"],
      };
  
      var command = new DescribeInstanceTypesCommand({
        Filters: [filter],
        MaxResults: 100,
      });
  
      var response = await ec2Client.send(command);
      console.log(JSON.stringify(command));
      console.log(JSON.stringify(response));
      // Transform the response into a more useful format
      var instanceTypes = response.InstanceTypes?.map((instance) => ({
        instanceType: instance.InstanceType,
      }));
  
      while (response.NextToken) {
        command = new DescribeInstanceTypesCommand({
          Filters: [filter],
          MaxResults: 100,
          NextToken: response.NextToken,
        });
  
        response = await ec2Client.send(command);
        var insanceTypeTemp = response.InstanceTypes?.map((instance) => ({
          instanceType: instance.InstanceType,
        }));
        insanceTypeTemp?.forEach((element) => {
          instanceTypes?.push(element);
        });
  
        console.log(JSON.stringify(command));
        console.log(JSON.stringify(response));
      }
  
      res.json({
        count: instanceTypes?.length || 0,
        instanceTypes: instanceTypes,
      });
    } catch (error) {
      console.error("Error fetching instance types:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch valid instance types",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      ec2Client.destroy();
    }
  });
  
  interface InstanceFamily {
    family: string;
    description: string;
    useCase: string;
    generation: number;
  }
  
  ec2Handler.get("/instance-families", async (req: Request, res: Response) => {
    const ec2Client = new EC2Client({});
  
    try {
      // Define the core instance families suitable for DRS
      const validFamilies: InstanceFamily[] = [
        {
          family: "t3",
          description: "Burstable general purpose",
          useCase: "Development and small production workloads",
          generation: 3,
        },
        {
          family: "t3a",
          description: "AMD-based burstable general purpose",
          useCase: "Development and small production workloads",
          generation: 3,
        },
        {
          family: "m5",
          description: "General purpose",
          useCase: "Medium-sized workloads with balanced compute/memory needs",
          generation: 5,
        },
        {
          family: "m5a",
          description: "AMD-based general purpose",
          useCase: "Medium-sized workloads with balanced compute/memory needs",
          generation: 5,
        },
        {
          family: "m6i",
          description: "Latest generation general purpose Intel",
          useCase: "Medium to large workloads requiring balanced resources",
          generation: 6,
        },
        {
          family: "m6a",
          description: "Latest generation general purpose AMD",
          useCase: "Medium to large workloads requiring balanced resources",
          generation: 6,
        },
        {
          family: "c5",
          description: "Compute optimized",
          useCase: "High-performance computing and CPU-intensive workloads",
          generation: 5,
        },
        {
          family: "c6i",
          description: "Latest generation compute optimized Intel",
          useCase: "High-performance computing and CPU-intensive workloads",
          generation: 6,
        },
        {
          family: "r5",
          description: "Memory optimized",
          useCase: "Memory-intensive workloads and databases",
          generation: 5,
        },
        {
          family: "r6i",
          description: "Latest generation memory optimized Intel",
          useCase: "Memory-intensive workloads and databases",
          generation: 6,
        },
      ];
  
      res.json({
        instanceFamilies: validFamilies,
        recommendedTypes: [
          { instanceType: "t3.small" }, // Good for small workloads
          { instanceType: "m5.large" }, // General purpose
          { instanceType: "r5.large" }, // Memory optimized
          { instanceType: "c5.large" }, // Compute optimized
        ],
        notes: ["Instance family availability varies by region", "Newer generations generally offer better price-performance ratio", "Consider workload requirements when selecting family", "T3 family offers burstable performance suitable for variable workloads", "M5/M6 families provide balanced resources for general use", "C5/C6 families are optimized for compute-intensive workloads", "R5/R6 families are optimized for memory-intensive workloads"],
      });
    } catch (error) {
      console.error("Error fetching instance families:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch valid instance families",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      ec2Client.destroy();
    }
  });
  
  ec2Handler.get("/vpcs", async (req: Request, res: Response) => {
    const ec2Client = new EC2Client({});
  
    try {
      // Get all VPCs
      const describeVpcsCommand = new DescribeVpcsCommand({});
      const vpcsResponse = await ec2Client.send(describeVpcsCommand);
  
      // Get all subnets
      const describeSubnetsCommand = new DescribeSubnetsCommand({});
      const subnetsResponse = await ec2Client.send(describeSubnetsCommand);
  
      // Create a map of VPC IDs to their subnets
      const vpcSubnets = new Map();
  
      // Initialize each VPC with an empty subnets array
      vpcsResponse.Vpcs?.forEach((vpc) => {
        const vpcName = vpc.Tags?.find((tag) => tag.Key === "Name")?.Value || "";
        vpcSubnets.set(vpc.VpcId, {
          name: vpcName,
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock,
          subnets: [],
        });
      });
  
      // Add subnets to their respective VPCs
      subnetsResponse.Subnets?.forEach((subnet) => {
        if (subnet.VpcId && vpcSubnets.has(subnet.VpcId)) {
          const subnetName = subnet.Tags?.find((tag) => tag.Key === "Name")?.Value || "";
          const vpcData = vpcSubnets.get(subnet.VpcId);
          vpcData.subnets.push({
            name: subnetName,
            subnetId: subnet.SubnetId,
            cidrBlock: subnet.CidrBlock,
          });
        }
      });
  
      // Convert map to array for response
      const response = Array.from(vpcSubnets.values());
  
      res.json({
        count: response.length,
        vpcs: response,
      });
    } catch (error) {
      console.error("Error fetching VPCs and subnets:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch VPCs and subnets",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      ec2Client.destroy();
    }
  });
  
  ec2Handler.get("/:vpcId/security-groups", async (req: Request, res: Response) => {
    const ec2Client = new EC2Client({});
    const vpcId = req.params.vpcId;
  
    try {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [vpcId],
          },
        ],
      });
  
      const response = await ec2Client.send(command);
  
      // Transform the response to include only name and ID
      const securityGroups =
        response.SecurityGroups?.map((sg) => ({
          name: sg.GroupName,
          id: sg.GroupId,
        })) || [];
  
      res.json(securityGroups);
    } catch (error) {
      console.error("Error fetching security groups:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch security groups",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      ec2Client.destroy();
    }
  });