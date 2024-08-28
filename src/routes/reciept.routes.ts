import {Request, Response, Router} from "express";
import {ReceiptController} from "../controller/receipt.controller";
import { authentication } from "../middlewares/authentication";

const router = Router();
const receiptController = new ReceiptController();

router.post('/', authentication,async (req: Request, res: Response) => await receiptController.sendReceipt(req, res))
router.post('/attachment', authentication, async(req:Request, res: Response) => await receiptController.sendReceiptAttachment(req, res));

export {router as ReceiptRouter};