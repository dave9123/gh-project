import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle({
    connection: {
        user: process.env.DATABASE_USER!,
        host: process.env.DATABASE_HOST!,
        database: process.env.DATABASE_NAME!,
        password: process.env.DATABASE_PASSWORD!,
        port: parseInt(process.env.DATABASE_PORT || "5432", 10),
        ssl: process.env.DATABASE_SSL === "true"
            ? process.env.DATABASE_REJECT_UNAUTHORIZED === "true"
                ? { rejectUnauthorized: true }
                : { rejectUnauthorized: false }
            : false,
    },
});

export default db;