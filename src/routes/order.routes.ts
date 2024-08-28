import {Router, Request, Response} from "express";
import {OrderController} from "../controller/order.controller"
import { authentication } from "../middlewares/authentication";

const router = Router();
const orderController = new OrderController();

router.get('/', authentication, async (req: Request, res: Response) => await orderController.getAllOrders(req, res));

router.get('/:orderId', authentication, async (req: Request, res: Response) => await orderController.getOneOrder(req, res));

router.post('/', authentication, async (req: Request, res: Response) => await orderController.createOrder(req, res));

router.delete('/:orderId', authentication, async (req: Request, res: Response) => await orderController.deleteOrders(req, res));

export {router as OrderRouter};