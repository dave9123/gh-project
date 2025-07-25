import ai from "./api/ai";
import auth from "./api/auth";
import business from "./api/business";
import files from "./api/files";
import orders from "./api/orders";
import admin from "./api/admin";
import public_api from "./api/public";

import express from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.get("/ping", (_, res) => res.status(200).send("Pong!"));

app.use("/public", public_api);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) return next();
  if (req.path.startsWith("/api/ai")) return next();
  if (req.path.startsWith("/api/files")) return next();

  console.log("Request received:", req.method, req.path, req.headers);
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      console.error("An error occured while verifying JWT", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log("User authenticated:", user);
    req.user = user;
    next();
  });
});

app.use("/api/admin", admin);
app.use("/api/ai", ai);
app.use("/api/orders", orders);
app.use("/api/auth", auth);
app.use("/api/business", business);
app.use("/api/files", files);

export default function startServer() {
  const port = process.env.PORT || 3000;

  app.listen(port, () => console.log(`Server is running on port ${port}`));
}
