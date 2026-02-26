import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../.env' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? './guests.db',
  },
});
