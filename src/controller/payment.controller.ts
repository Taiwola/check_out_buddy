import { StripeService } from "../services";
import { Request, Response } from "express";

export class PaymentController {
  private stripeService: StripeService;
  constructor() {
     // Constructor initializes the StripeService instance
    this.stripeService = new StripeService();
  }

  // Handles the creation of a payment intent with Stripe
  async createPaymentIntent(req: Request, res: Response) {
    const { amount, currency } = req.body;

     // Validate that both amount and currency are provided in the request
    if (!amount || !currency) {
      return res.status(400).json({
        data: {
          message: "Amount and currency are required.",
        },
        status: 400,
      });
    }

    try {
        // Create a payment intent using the StripeService
      const paymentIntent = await this.stripeService.createIntent(
        parseInt(amount),  // Convert amount to integer
        currency
      );

       // Respond with the client_secret from the payment intent on success
      res.status(200).json({
        message: "Request was sucessfull",
        data: paymentIntent.client_secret, // client_secret is required to confirm the payment on the client side
        sucess: true,
      });

    } catch (error) {
       // Log the error for debugging purposes
      console.error("Error in creating payment intent: ", error);
      
      // Return a 500 response if an error occurs while creating the payment intent
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }
}
