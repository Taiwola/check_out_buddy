import "dotenv/config";
import express from 'express';
import cors from "cors";
import helmet from "helmet";
import mongoose from 'mongoose';
import * as path from "path";
import { AuthRouter } from "./routes/auth.route";
import { scannedRouter } from "./routes/scanned.Route";
import { PaymentRouter } from "./routes/payment.routes";
import { OrderRouter } from "./routes/order.routes";
import { UserRouter } from "./routes/user.route";
import { ReceiptRouter } from "./routes/reciept.routes";

const app = express();
const port = process.env.PORT || 3000;
// declare global namespace
  declare global {
    namespace Express {
      interface Request {
        user?: {
          id?: string 
          email?: string
          role?: string
        };
      }
    }
  }

try {
    mongoose.set("strictQuery", true);
    mongoose.connect(process.env.MONGODB_URL as string);
    console.log("Connected to db");
  } catch (error) {
    console.log(error);
    throw new Error("Error Connecting To db");
  }

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
    origin: '*'
}));


app.use('/api/auth', AuthRouter);
app.use('/api/scanned/', scannedRouter);
app.use('/api/payments', PaymentRouter);
app.use('/api/orders', OrderRouter);
app.use('/api/users', UserRouter);
app.use('/api/receipt', ReceiptRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})