// utils/VariablesUtils.ts
import { Variables } from '../models/Variables';
import { Group } from '../models/Group';

/**
 * Utility class for Variables model operations
 * Provides methods for managing group variables
 */
export class VariablesUtils {
  /**
   * Creates or updates a Variable record
   * @param groupId - ID of the group this variable belongs to
   * @param name - Name of the variable
   * @param value - Value of the variable
   * @returns Promise resolving to the upserted Variable
   */
  static async upsert(groupId: number, name: string, value: string) {
    return await Variables.upsert({
      group_id: groupId,
      name,
      value
    });
  }

  /**
   * Finds all variables for a specific group
   * @param groupId - ID of the group to find variables for
   * @returns Promise resolving to array of Variables
   */
  static async findByGroup(groupId: number) {
    return await Variables.findAll({
      where: { group_id: groupId }
    });
  }

  /**
   * Finds a specific variable by group and name
   * @param groupId - ID of the group
   * @param name - Name of the variable to find
   * @returns Promise resolving to the found Variable or null
   */
  static async findByGroupAndName(groupId: number, name: string) {
    return await Variables.findOne({
      where: {
        group_id: groupId,
        name
      }
    });
  }

  /**
   * Deletes a variable by group and name
   * @param groupId - ID of the group
   * @param name - Name of the variable to delete
   * @returns Promise resolving to number of deleted records
   */
  static async delete(groupId: number, name: string) {
    return await Variables.destroy({
      where: {
        group_id: groupId,
        name
      }
    });
  }

  /**
   * Deletes all variables for a group
   * @param groupId - ID of the group
   * @returns Promise resolving to number of deleted records
   */
  static async deleteAllByGroup(groupId: number) {
    return await Variables.destroy({
      where: {
        group_id: groupId
      }
    });
  }
}