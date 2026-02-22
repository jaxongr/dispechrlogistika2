import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'dispatchr',
  password: process.env.POSTGRES_PASSWORD || 'dispatchr_secret',
  name: process.env.POSTGRES_DB || 'dispatchr_logistics',
}));
