// db/init.ts
import sequelize from './config';
import { Group } from '../models/Group';
import { Host } from '../models/Host';
import { Result } from '../models/Result';

/**
 * Initializes database connection and synchronizes models
 * Should be called before starting the application
 * @throws Error if database connection fails
 */
export async function initializeDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}