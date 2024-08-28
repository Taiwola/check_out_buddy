import mongoose, { Document, Schema } from "mongoose";

type Order = {
  id: string;
  userId: string;
  items: {
    id: string
    name: string;
    image: string;
    price: string;
    barcode: string;
    quantity: number;
  }[];
  totalAmount: number;
  currency: string;
  paymentIntentId: string;
  paymentMethod: string,
  paymentStatus: string;
};

export interface IOrder extends Document {
  userId: string;
  items: {
    name: string;
    image: string;
    price: string;
    barcode: string;
    quantity: number;
    _id: string
  }[];
  totalAmount: number;
  currency: string;
  paymentIntentId: string;
  paymentMethod: string;
  paymentStatus: string; // e.g., 'pending', 'paid', 'failed'
  createdAt: Date,
  updatedAt: Date
}

const OrderSchema: Schema = new Schema({
  userId: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      image: { type: String, required: true },
      price: { type: String, required: true },
      barcode: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentIntentId: { type: String, required: true },
  payementMethod: {type: String, required: false, default: "card"},
  paymentStatus: { type: String, default: "pending" },
}, {
  timestamps: true
});

const Order = mongoose.model<IOrder>("Order", OrderSchema);


export default Order;
