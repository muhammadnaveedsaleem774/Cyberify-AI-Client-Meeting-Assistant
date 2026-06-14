import { createApp } from './app';
import { config } from './config';
import { connectDB } from './db';

async function main() {
  try {
    // Connect to DB (if DATABASE_URL provided)
    await connectDB();
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`Server listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default createApp;
