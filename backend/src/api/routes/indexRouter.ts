import { Router } from "express";
import {indexController} from '../controllers/indexController'
const indexRouter: Router = Router()

indexRouter.get('/', indexController.welcome)

export default indexRouter