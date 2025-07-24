import express from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
const router = express.Router();

const db = drizzle();

router.post('/', (req, res) => {
});

router.get('/', (req, res) => {
});

export default router;