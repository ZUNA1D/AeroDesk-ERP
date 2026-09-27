import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Serverless] Database connection error:', error);
    return res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
}
