import { Group } from "../sequelize/models/Group";
import { Host } from "../sequelize/models/Host";
import { Variables } from "../sequelize/models/Variables";
import * as fs from "fs/promises";
import { AnsibleInventory, InventoryGroup, InventoryHost } from "./types";

/**
 * Manages an Ansible inventory in JSON format, providing methods to manipulate
 * groups and hosts within the inventory.
 */
export class InventoryManager {
  private inventoryPath: string = "ansible/inventory";
  private inventory: AnsibleInventory;

  /**
   * Creates a new InventoryManager instance
   * @param inventoryPath - Path to the inventory JSON file
   */
  constructor(inventoryPath: string) {
    this.inventoryPath = inventoryPath;
    this.inventory = { groups: [] };
  }



  /**
   * Syncs the database state to the inventory JSON file
   * Reads all groups, hosts, and variables from the database
   * and writes them to the inventory file in the expected format
   * @returns Promise that resolves when sync is complete
   */
  async writeInventory(): Promise<void> {
    try {
      // Fetch all groups with their relationships (excluding results)
      const dbGroups = await Group.findAll({
        include: [
          {
            model: Host,
            as: 'hosts'
          },
          {
            model: Variables,
            as: 'variables'
          }
        ]
      });

      // Transform database models to inventory format
      this.inventory.groups = await Promise.all(dbGroups.map(async (dbGroup) => {
        // Convert variables array to vars object
        const vars: { [key: string]: string } = {};
        dbGroup.variables?.forEach((variable) => {
          vars[variable.name] = variable.value;
        });

        // Convert hosts (without results)
        const hosts: InventoryHost[] = dbGroup.hosts?.map((dbHost) => ({name: dbHost.fqdn as string}) ) || [];

        // Create group object
        const group: InventoryGroup = {
          name: dbGroup.name,
          hosts: hosts,
          vars: vars
        };

        return group;
      }));

      // Write to file
      await this.saveInventory();
      
      console.log(`Successfully synced database to ${this.inventoryPath}`);
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw error;
    }
  }


  /**
   * Saves the current inventory state to the JSON file
   */
  async saveInventory(): Promise<void> {
    console.log('Saving', this.inventory);
    await fs.writeFile(this.inventoryPath, JSON.stringify(this.inventory, null, 2), "utf8");
  }

}
