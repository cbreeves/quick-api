import { 
    EC2Client, 
    DescribeVpcsCommand, 
    DescribeSubnetsCommand,
    Vpc,
    Subnet
} from "@aws-sdk/client-ec2";
import express, { Request, Response } from "express";
export const vpcHandler = express.Router();


interface VpcWithSubnets {
    vpcId: string;
    isDefault: boolean;
    cidrBlock: string;
    state: string;
    tags?: { Key?: string; Value?: string; }[];
    subnets: {
        subnetId: string;
        cidrBlock: string;
        availabilityZone: string;
        state: string;
        availableIpAddressCount: number;
        tags?: { Key?: string; Value?: string; }[];
    }[];
}

vpcHandler.get("/", async (req: Request, res: Response): Promise<any> => {

    const ec2Client = new EC2Client({});
    
    try {
        // Get all VPCs
        const vpcCommand = new DescribeVpcsCommand({});
        const vpcResponse = await ec2Client.send(vpcCommand);
        
        if (!vpcResponse.Vpcs) {
            return [];
        }

        // Get all subnets
        const subnetCommand = new DescribeSubnetsCommand({});
        const subnetResponse = await ec2Client.send(subnetCommand);
        
        // Create a map of VPC ID to subnets for easier lookup
        const subnetsByVpc = new Map<string, Subnet[]>();
        subnetResponse.Subnets?.forEach(subnet => {
            if (subnet.VpcId) {
                if (!subnetsByVpc.has(subnet.VpcId)) {
                    subnetsByVpc.set(subnet.VpcId, []);
                }
                subnetsByVpc.get(subnet.VpcId)?.push(subnet);
            }
        });

        // Combine VPCs with their subnets
        const result: VpcWithSubnets[] = vpcResponse.Vpcs.map(vpc => ({
            vpcId: vpc.VpcId || '',
            isDefault: vpc.IsDefault || false,
            cidrBlock: vpc.CidrBlock || '',
            state: vpc.State || '',
            tags: vpc.Tags,
            subnets: (subnetsByVpc.get(vpc.VpcId || '') || []).map(subnet => ({
                subnetId: subnet.SubnetId || '',
                cidrBlock: subnet.CidrBlock || '',
                availabilityZone: subnet.AvailabilityZone || '',
                state: subnet.State || '',
                availableIpAddressCount: subnet.AvailableIpAddressCount || 0,
                tags: subnet.Tags
            }))
        }));

        return result;

    } catch (error) {
        console.error('Error fetching VPCs and subnets:', error);
        throw error;
    } finally {
        ec2Client.destroy();
    }
});

