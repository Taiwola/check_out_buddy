import Stripe from "stripe";

export class StripeService {
    private stripe: Stripe;

    constructor() {
        // Initialize the Stripe client with the secret key and API version
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: '2024-06-20' // Specify the Stripe API version
        });
    }

    // Create a Payment Intent to handle a payment
    async createIntent(amount: number, currency: string) {
        // Create a new Payment Intent with the specified amount and currency
        const intents = await this.stripe.paymentIntents.create({
            amount: amount, // Amount to be charged in the smallest currency unit (e.g., cents for USD)
            currency: currency, // Currency of the payment (e.g., 'usd')
            automatic_payment_methods: {
                enabled: true // Enable automatic payment methods to support various payment methods
            }
        });

        // Return the created Payment Intent object
        return intents;
    }
}
