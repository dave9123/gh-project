import express from 'express';
import db from '../../../modules/db';
import { usersTable } from '../../../../db/schema';
import { describe } from 'node:test';
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


  res.send({
    generatedId: "",
    name: "",
    description: "",
    currencyType: "USD", // or "IDR"
    basePrice: 0,
  })
});

/*
router.get('/get', (req, res) => {
});
*/

export default router;
