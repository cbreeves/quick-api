// utils/GroupUtils.ts
import { Group } from '../models/Group';
import { Host } from '../models/Host';
import { Result } from '../models/Result';
import { Variables } from '../models/Variables';
import { VariablesUtils } from './VariableUtils';

/**
 * Utility class for Group model operations
 * Provides CRUD operations with relationship handling
 */
export class GroupUtils {
  /**
   * Creates or updates a Group record
   * @param groupData - Partial Group object containing update data
   * @returns Promise resolving to the upserted Group
   */
  static async upsert(groupData: Group) {
    return await Group.upsert(groupData);
  }

  /**
   * Retrieves all Groups with their associated Hosts and Results
   * @returns Promise resolving to array of Groups with nested relationships
   */
  static async findAll() {
    return await Group.findAll({
      include: [{
        model: Host,
        as: 'hosts',
        include: [{
          model: Result,
          as: 'results'
        }]
      }]
    });
  }


  /**
   * Soft deletes a Group by name
   * @param name - Name of the Group to delete
   * @returns Promise resolving to number of deleted records
   */
  static async delete(name: string) {
    return await Group.destroy({
      where: { name }
    });
  }

   /**
   * Finds a specific Group by name with all relationships including variables
   * @param name - Name of the Group to find
   * @returns Promise resolving to the found Group or null
   */
   static async findByName(name: string) {
    return await Group.findOne({
      where: { name },
      include: [
        {
          model: Host,
          as: 'hosts',
          include: [{
            model: Result,
            as: 'results'
          }]
        },
        {
          model: Variables,
          as: 'variables'
        }
      ]
    });
  }

  /**
   * Creates or updates a Group with its variables
   * @param groupData - Group data to upsert
   * @param variables - Array of variables to associate with the group
   */
  static async upsertWithVariables(
    groupData: Group,
    variables: Array<{ name: string; value: string }>
  ) {
    const [group, created] = await Group.upsert(groupData);

    // Update variables
    if (variables && variables.length > 0) {
      for (const variable of variables) {
        await VariablesUtils.upsert(group.id, variable.name, variable.value);
      }
    }

    return group;
  }
  
}