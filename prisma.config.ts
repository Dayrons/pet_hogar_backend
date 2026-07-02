import { defineConfig } from '@prisma/config';

try {
  process.loadEnvFile('.env');
} catch {
  // .env file not found or cannot be loaded
}

export default defineConfig({
  schema: 'prisma/schema/',
});
