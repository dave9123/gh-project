import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'sqlite',
    driver: 'd1-http',
    /*dbCredentials: {
        host: process.env.DATABASE_HOST!,
        user: process.env.DATABASE_USER!,
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        password: process.env.DATABASE_PASSWORD!,
        database: process.env.DATABASE_NAME!,
        ssl: "prefer"
    }*/
    dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,
    }
});