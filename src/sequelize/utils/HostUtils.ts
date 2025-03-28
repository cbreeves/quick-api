// utils/HostUtils.ts
import { Host } from '../models/Host';
import { Result } from '../models/Result';

/**
 * Utility class for Host model operations
 * Provides CRUD operations with relationship handling
 */
export class HostUtils {
  /**
   * Creates or updates a Host record
   * @param hostData - Partial Host object containing update data
   * @returns Promise resolving to the upserted Host
   */
  static async upsert(hostData: Host) {
    return await Host.upsert(hostData);
  }

  /**
   * Retrieves all Hosts with their associated Results
   * @returns Promise resolving to array of Hosts with nested Results
   */
  static async findAll() {
    return await Host.findAll({
      include: [{
        model: Result,
        as: 'results'
      }]
    });
  }

  /**
   * Finds a specific Host by name with all Results
   * @param name - Name of the Host to find
   * @returns Promise resolving to the found Host or null
   */
  static async findByName(name: string) {
    return await Host.findOne({
      where: { name },
      include: [{
        model: Result,
        as: 'results'
      }]
    });
  }

  /**
   * Soft deletes a Host by name
   * @param name - Name of the Host to delete
   * @returns Promise resolving to number of deleted records
   */
  static async delete(name: string) {
    return await Host.destroy({
      where: { name }
    });
  }
}