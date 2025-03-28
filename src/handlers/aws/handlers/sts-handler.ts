import { DescribeSourceServersCommand, DrsClient } from "@aws-sdk/client-drs";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import { CreateInstanceProfileCommand, CreateServiceLinkedRoleCommand, GetInstanceProfileCommand, IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import { DescribeKeyCommand, KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import express, { Request, Response } from "express";


export const stsHandler = express.Router();


stsHandler.get("/validate-permissions", async (req: Request, res: Response) => {
    const stsClient = new STSClient({});
  
    try {
      // First, get the caller's identity to determine if it's an IAM Identity Center user
      const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
      const userArn = callerIdentity.Arn;
  
      if (!userArn) {
        throw new Error("Could not determine caller identity");
      }
  
      // Check if this is an IAM Identity Center user (ARN will contain 'assumed-role/AWSReservedSSO')
      const isIdentityCenterUser = userArn.includes("assumed-role/AWSReservedSSO");
      console.log(isIdentityCenterUser);
  
      if (isIdentityCenterUser) {
        // For Identity Center users, we'll test actual API calls instead of using the policy simulator
        const results = await testApiPermissions();
        console.log(results);
        if (results.missingPermissions.length > 0) {
          res.json({
            hasAllPermissions: false,
            missingPermissions: results.missingPermissions,
            message: "Missing required permissions for DRS initialization",
            isIdentityCenterUser: true,
          });
        } else {
          res.json({
            hasAllPermissions: true,
            message: "All required permissions are present",
            isIdentityCenterUser: true,
          });
        }
      } else {
        const iamClient = new IAMClient({});
        const stsClient = new STSClient({});
        try {
          // First, get the caller's identity
          const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
          const arnPrincipal = callerIdentity.Arn;
          console.log(arnPrincipal);
          if (!arnPrincipal) {
            throw new Error("Could not determine caller identity");
          }
  
          // Define the required permissions for DRS initialization
          const requiredActions = [
            "drs:InitializeService",
            "iam:CreateRole",
            "iam:PutRolePolicy",
            "iam:AttachRolePolicy",
            "iam:GetRole",
            "iam:PassRole",
            "ec2:DescribeSubnets",
            "ec2:DescribeSecurityGroups",
            "ec2:CreateSecurityGroup",
            "ec2:AuthorizeSecurityGroupIngress",
            "ec2:RevokeSecurityGroupIngress",
            "ec2:AuthorizeSecurityGroupEgress",
            "ec2:RevokeSecurityGroupEgress",
            "ec2:CreateTags",
            "ec2:DescribeInstances",
            "ec2:RunInstances",
            "ec2:StartInstances",
            "ec2:StopInstances",
            "ec2:TerminateInstances",
            "ec2:DescribeInstanceStatus",
            "ec2:CreateVolume",
            "ec2:DeleteVolume",
            "ec2:DescribeVolumes",
            "ec2:AttachVolume",
            "ec2:DetachVolume",
            "ec2:CreateSnapshot",
            "ec2:DeleteSnapshot",
            "ec2:DescribeSnapshots",
          ];
  
          // Simulate policy to check permissions
          const command = new SimulatePrincipalPolicyCommand({
            PolicySourceArn: arnPrincipal,
            ActionNames: requiredActions,
            ResourceArns: ["*"], // You might want to be more specific based on your needs
          });
  
          const response = await iamClient.send(command);
  
          // Process evaluation results
          const missingPermissions = response.EvaluationResults?.filter((result) => result.EvalDecision !== "allowed").map((result) => result.EvalActionName) || [];
  
          if (missingPermissions.length > 0) {
            res.json({
              hasAllPermissions: false,
              missingPermissions,
              message: "Missing required permissions for DRS initialization",
            });
          } else {
            res.json({
              hasAllPermissions: true,
              message: "All required permissions are present",
            });
          }
        } catch (error) {
          console.error("Error validating permissions:", error);
          res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to validate permissions",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          iamClient.destroy();
          stsClient.destroy();
        }
      }
    } catch (error) {
      console.error("Error validating permissions:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to validate permissions",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      stsClient.destroy();
    }
  });
  
  // Helper function to test API permissions
  async function testApiPermissions() {
    const missingPermissions: string[] = [];
  
    // Test IAM Service Linked Role permissions
    const iamClient = new IAMClient({});
    try {
      // Test creating a service-linked role
      // Using a non-existent service to ensure it fails with permissions error rather than actually creating
      await iamClient.send(
        new CreateServiceLinkedRoleCommand({
          AWSServiceName: "test.amazonaws.com",
          Description: "Test service-linked role",
        })
      );
    } catch (error: any) {
      if (error.name === "AccessDeniedException") {
        missingPermissions.push("iam:CreateServiceLinkedRole");
      }
      // Ignore other errors as we expect the service name to be invalid
    }
  
    // Test Instance Profile permissions
    try {
      // Try to get a non-existent instance profile
      await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: "test-profile-that-does-not-exist",
        })
      );
    } catch (error: any) {
      if (error.name === "AccessDeniedException") {
        missingPermissions.push("iam:GetInstanceProfile");
      }
      // Ignore NoSuchEntity errors as we expect the profile not to exist
    }
  
    try {
      // Try to create an instance profile (will fail due to permissions or name conflict)
      await iamClient.send(
        new CreateInstanceProfileCommand({
          InstanceProfileName: "test-profile-permissions-check",
          Path: "/",
        })
      );
    } catch (error: any) {
      if (error.name === "AccessDeniedException") {
        missingPermissions.push("iam:CreateInstanceProfile");
      }
      // Ignore other errors
    }
  
    // Test DRS permissions
    const drsClient = new DrsClient({});
    try {
      await drsClient.send(new DescribeSourceServersCommand({}));
    } catch (error: any) {
      if (error.name === "AccessDeniedException") {
        missingPermissions.push("drs:DescribeSourceServers");
      }
    } finally {
      drsClient.destroy();
    }
  
    // Test EC2 permissions
    const ec2Client = new EC2Client({});
    try {
      await ec2Client.send(new DescribeInstancesCommand({}));
    } catch (error: any) {
      if (error.name === "AccessDeniedException") {
        missingPermissions.push("ec2:DescribeInstances");
      }
    } finally {
      ec2Client.destroy();
    }
  
    // Add more permission tests as needed...
    console.log(missingPermissions);
    return {
      missingPermissions,
    };
  }