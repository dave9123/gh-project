import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

/*const db = drizzle({
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
});*/

export const db = drizzle({ client: neon(process.env.DATABASE_URL!) });

export default db;