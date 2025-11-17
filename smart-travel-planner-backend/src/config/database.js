/**
 * Database Configuration
 *
 * This file sets up the MySQL connection pool for connecting to Cloud SQL.
 *
 * Connection Pool: Instead of creating a new connection for each request,
 * we create a pool of reusable connections. This is much faster and more efficient.
 *
 * Environment Variables: We load DB credentials from .env file using dotenv.
 * This keeps sensitive information out of the code.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create connection pool
// When you connect through Cloud SQL Proxy, use 127.0.0.1 (localhost)
// The proxy handles the secure connection to your Cloud SQL instance
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'smart_travel_db',
  waitForConnections: true,
  connectionLimit: 10,      // Maximum 10 connections in pool
  queueLimit: 0,            // Unlimited queueing
  enableKeepAlive: true,    // Keep connections alive
  keepAliveInitialDelay: 0
});

// Test the connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connection successful!');
    console.log(`   Connected to: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    connection.release(); // Return connection to pool
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure Cloud SQL Proxy is running!');
  });

export default pool;
