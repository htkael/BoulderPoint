import { Router } from "express";
import {
  getLocations,
  getNearbyLocations,
  getLocationClusters,
} from "../controllers/locationsController";
const locationsRouter = Router();

locationsRouter.get("/", getLocations);
locationsRouter.get("/nearby", getNearbyLocations);
locationsRouter.get("/clusters", getLocationClusters);

export default locationsRouter;
