import { Router } from "express";
import { indexController } from "../controllers/indexController";
import locationsRouter from "./locationsRouter";
const indexRouter: Router = Router();

indexRouter.get("/", indexController.welcome);
indexRouter.use("/locations", locationsRouter);

export default indexRouter;
