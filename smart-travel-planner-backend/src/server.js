/**
 * Main Server Entry Point
 *
 * This file sets up the Express server and configures middleware.
 *
 * Middleware: Functions that process requests before they reach your routes.
 * - express.json(): Parses JSON request bodies
 * - cors(): Allows frontend (port 5173) to call backend (port 3000)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Enable CORS - allows frontend to make requests from different origin
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Log all incoming requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint - useful for testing if server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Travel Planner API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - if no route matches
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// ==================== ERROR HANDLING ====================

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('\n🚀 Smart Travel Planner Backend Server');
  console.log(`   Server running at: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log('\n📡 Waiting for requests...\n');
});
