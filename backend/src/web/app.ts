import express from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import auth from "./api/auth";
import business from "./api/business";
import files from "./api/files";
import orders from "./api/orders";

const app = express();

//set cors
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
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production")
    res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.path.startsWith("/api/auth/oauth")) return next();
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      console.error("An error occured while verifying JWT", err);
      return res.sendStatus(500).json({ error: "Internal Server Error" });
    }
    req.user = user;
    next();
  });
});

app.use("/api/orders", orders);
app.use("/api/auth", auth);
app.use("/api/business", business);
app.use("/api/files", files);
app.use("/api/ai", require("./api/ai").default);
app.get("/ping", (_, res) => res.status(200).send("Pong!"));

export default function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server is running on port ${port}`));
}
