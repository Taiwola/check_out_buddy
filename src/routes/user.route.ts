import {Router, Request, Response} from "express";
import {UserController} from "../controller/user.controller";
import { authentication } from "../middlewares/authentication";

const router = Router();
const userController = new UserController();

router.get('/', authentication,async (req: Request, res: Response) => await userController.getAllUsers(req, res));
router.get('/:id', authentication,async (req: Request, res: Response) => await userController.getOneUser(req, res));

router.patch('/:id', authentication,async (req: Request, res: Response) => await userController.updateUser(req, res));
router.delete('/:id', authentication,async (req: Request, res: Response) => await userController.deleteUser(req, res));

export {router as UserRouter};