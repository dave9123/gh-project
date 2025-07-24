import express from "express";

import auth from "./api/auth";
import enterprise from "./api/enterprise";
import files from "./api/files";
import orders from "./api/orders";

const app = express();

app.use(express.json());

app.use("/api/orders", orders);
app.use("/api/auth", auth);
app.use("/api/enterprise", enterprise);
app.use("/api/files", files);
app.get("/", (_, res) => res.send("howdy"));

export default function startServer() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server is running on port ${port}`));
};