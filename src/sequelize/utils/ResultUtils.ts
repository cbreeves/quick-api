// utils/ResultUtils.ts
import { Result } from '../models/Result';

/**
 * Utility class for Result model operations
 * Provides CRUD operations for Result records
 */
export class ResultUtils {
  /**
   * Creates or updates a Result record
   * @param resultData - Partial Result object containing update data
   * @returns Promise resolving to the upserted Result
   */
  static async upsert(resultData: Partial<Result>) {
    return await Result.upsert(resultData);
  }

  /**
   * Retrieves all Results
   * @returns Promise resolving to array of all Results
   */
  static async findAll() {
    return await Result.findAll();
  }

  /**
   * Finds a specific Result by name
   * @param name - Name of the Result to find
   * @returns Promise resolving to the found Result or null
   */
  static async findByName(name: string) {
    return await Result.findOne({
      where: { name }
    });
  }

  /**
   * Soft deletes a Result by name
   * @param name - Name of the Result to delete
   * @returns Promise resolving to number of deleted records
   */
  static async delete(name: string) {
    return await Result.destroy({
      where: { name }
    });
  }
}