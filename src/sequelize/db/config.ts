// db/config.ts
import { Sequelize } from 'sequelize';

/**
 * Database configuration using Sequelize ORM
 * Configurable through environment variables for different environments
 * Falls back to default values if environment variables are not set
 */
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'quickdr',
  username: process.env.DB_USER || 'quickdr',
  password: process.env.DB_PASSWORD || 'quickdr',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql', // or mysql, sqlite, etc.
  logging: false // set to true for SQL query logging
});

export default sequelize;
