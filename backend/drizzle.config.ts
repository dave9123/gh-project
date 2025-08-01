import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    /*dbCredentials: {
        host: process.env.DATABASE_HOST!,
        user: process.env.DATABASE_USER!,
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        password: process.env.DATABASE_PASSWORD!,
        database: process.env.DATABASE_NAME!,
        ssl: "prefer"
    }*/
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }
});