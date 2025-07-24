import express from 'express';
import db from '../../../modules/db';
import { usersTable } from '../../../../db/schema';
const router = express.Router();

router.post('/create', (req, res) => {
  const { name, slugName, phoneNumber, ownerEmail } = req.body;
  if (!name || !slugName || !phoneNumber || !ownerEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  /*
    db.insert(usersTable).values({
    })
  */
});

/*
router.get('/get', (req, res) => {
});
*/

export default router;
