import mongoose from 'mongoose';
import { config } from './config';

export async function connectDB(url?: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const connectUrl = url || config.databaseUrl;
  return mongoose.connect(connectUrl).then((m) => {
    if (process.env.NODE_ENV !== 'test') console.log('MongoDB connected');
    return m;
  });
}
