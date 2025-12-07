import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for Cloud SQL via proxy
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'smart_travel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log(`Database connected: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.error('Make sure Cloud SQL Proxy is running!');
  });

export default pool;
