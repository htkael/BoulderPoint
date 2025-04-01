import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import errorHandler from "./errors/errorHandler";
import indexRouter from "./api/routes/indexRouter";
dotenv.config();

const app: Express = express();

console.log("Server start");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL!,
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/api", indexRouter);

app.use(errorHandler);

const PORT: number | string = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Boulder Point listening on port ${PORT}`);
});
