

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Import routes and listeners
import configRoutes from './routes/configRoutes.js';
import binlogListener from './binlog/listener.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.emit('connected', { 
    message: 'Connected to SQL Dashboard backend',
    clientId: socket.id
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Initialize database connection when server starts
const initializeDatabase = async () => {
  try {
    const configPath = join(__dirname, '../db/config.json');
    if (existsSync(configPath)) {
      console.log('🚀 Starting database monitoring...');
      await binlogListener.start(io, {});
    } else {
      console.log('ℹ️  No database configuration found');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
  }
};

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log('🚀 SQL Dashboard Backend Server Started!');
  console.log('📍 Port:', PORT);
  console.log('🌐 URL: http://localhost:' + PORT);
  console.log('📊 Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🔌 WebSocket: ws://localhost:' + PORT);
  console.log('─'.repeat(50));
  
  // Initialize the database connection
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  binlogListener.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { app, io, server };