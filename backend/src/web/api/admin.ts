import express from "express";
import db from "../../modules/db";
const router = express.Router();

router.get("/orders", (req, res) => {

});

router.put("/order/:id", (req, res) => {
  try {
    const { id } = req.params;

    res.send(req.user);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
