import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 AeroDesk ERP API running on http://localhost:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`=========================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Graceful shutdown initiated...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server] Fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();
