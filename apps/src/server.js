import express from "express"
import dotenv from "dotenv"
dotenv.config();
// import { sign } from "./routes/auth.routes";

const app = express();

const PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
// app.use("/api", signup);

app.listen(PORT, () => {
    console.log("Server is listening at Port", PORT);
})