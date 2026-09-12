const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

/**
 * Start the HTTP server after initializing database connections
 */
const startServer = async () => {
  try {
    // Attempt database connection
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();

    // Start Express listener
    const server = app.listen(config.port, () => {
      console.log(`[Server] Running in [${config.nodeEnv}] mode on http://localhost:${config.port}`);
      console.log(`[Server] Health Check available at http://localhost:${config.port}/api/health`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Process] Unhandled Rejection:', err);
      // Gracefully close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('[Process] Uncaught Exception:', err);
      process.exit(1);
    });

    // Handle graceful shutdown signals
    const shutdown = () => {
      console.log('\n[Process] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
