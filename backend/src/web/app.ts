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
import enterprise from "./api/enterprise";
import files from "./api/files";
import orders from "./api/orders";

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    console.error(err);
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  })
});

app.use("/api/orders", orders);
app.use("/api/auth", auth);
app.use("/api/enterprise", enterprise);
app.use("/api/files", files);
app.get("/", (_, res) => res.send("howdy"));

export default function startServer() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server is running on port ${port}`));
};