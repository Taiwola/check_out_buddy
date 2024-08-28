import { Router, Request, Response } from "express";
import { PaymentController } from "../controller/payment.controller";

const router = Router();
const paymentController = new PaymentController();

router.post(
  "/intents",
  async (req: Request, res: Response) =>
    await paymentController.createPaymentIntent(req, res)
);

export { router as PaymentRouter };
