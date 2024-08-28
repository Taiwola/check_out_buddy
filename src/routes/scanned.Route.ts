import { Router, Request, Response } from "express";
import { ScannedController } from "../controller/scanned.controller";
import { authentication } from "../middlewares/authentication";

const router = Router();
const scannedController = new ScannedController();

router.get(
  "/",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.getAllScanned(req, res)
);

router.get(
  "/nearbystores",
  async (req: Request, res: Response) =>
    await scannedController.findNearByStores(req, res)
);

// Route to get scanned history by userId
router.get(
  "/users/:userId",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.getScannedByUserId(req, res)
);

// Route to get a single scanned entry by its ID
router.get(
  "/:id",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.getScannedById(req, res)
);

router.post(
  "/",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.scanBarCode(req, res)
);

router.post(
  "/barcode/:barcode",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.getScannedByBarcode(req, res)
);

// Route to delete a scanned history entry by its ID
router.delete(
  "/:id",
  authentication,
  async (req: Request, res: Response) =>
    await scannedController.deleteScannedById(req, res)
);

export { router as scannedRouter };
