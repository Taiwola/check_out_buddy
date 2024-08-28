import { Router, Request, Response } from "express";
import { AuthController } from "../controller/auth.controller";
import schemaValidator from "../middlewares/schemaValidator";

const router = Router();
const authController = new AuthController();

router.post(
  "/login",
  schemaValidator("/login"),
  async (req: Request, res: Response) => await authController.login(req, res)
);

router.post(
  "/register",
  schemaValidator("/register"),
  async (req: Request, res: Response) => await authController.register(req, res)
);

router.post(
  "/verify_reset_code",
  schemaValidator("/verify_reset_code"),
  async (req: Request, res: Response) =>
    await authController.verifyResetCode(req, res)
);

router.post(
  "/verify_email_code",
  schemaValidator("/verify_email_code"),
  async (req: Request, res: Response) =>
    await authController.verifyCode(req, res)
);

router.patch(
  "/reset_password",
  schemaValidator("/reset_password"),
  async (req: Request, res: Response) =>
    await authController.resetPassword(req, res)
);

router.patch(
  "/forgot_password",
  schemaValidator("/forgot_password"),
  async (req: Request, res: Response) =>
    await authController.forgotPassword(req, res)
);

router.patch(
  "/resend_password_code",
  schemaValidator("/resend_password_code"),
  async (req: Request, res: Response) =>
    await authController.resendResetPasswordCode(req, res)
);

router.patch(
  "/resend_verification_code",
  schemaValidator("/resend_verification_code"),
  async (req: Request, res: Response) =>
    await authController.resendVerificationCode(req, res)
);

export { router as AuthRouter };
