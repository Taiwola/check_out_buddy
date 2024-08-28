import { EmailService, UserService } from "../services";
import { Request, Response } from "express";


export class ReceiptController {
    private emailService: EmailService;
    private userService: UserService;

     // Constructor initializes the EmailService and UserService instances
    constructor() {
        this.emailService = new EmailService();
        this.userService = new UserService();
    }

   

    // Handler to send a receipt
    async sendReceipt(req: Request, res: Response): Promise<Response> {
        const {
            productName,
            subtotal,
            tax,
            total,
            paymentMethod,
            date
        } = req.body;

         // Check if the user is a guest and return a 403 error if so
        if (req.user && req.user.role === 'guest') {
            return res.status(403).json({data: {message: "User not loggged in"}, status:403})
        }

         // Retrieve the user's email from the request object
        const email = req.user?.email;

        const user = await this.userService.findOneUserEmail(email as string);
         // If the user is not found, return a 404 error
        if (!user) {
            return res.status(404).json({ status: 404, data:{message: "User not found"}})
        }

        const name = user.name;
       
        // Validate required fields
        if (!email || !name || !productName || subtotal === undefined || tax === undefined || total === undefined || !paymentMethod || !date) {
            return res.status(400).json({ error: true, errorMessage: "Missing required fields" });
        }

        try {
             // Send the receipt via email using the EmailService
            const result = await this.emailService.sendReceipt({
                email,
                name,
                productName,
                subtotal,
                tax,
                total,
                paymentMethod,
                date
            });

            return res.status(200).json({ success: true, message: "Receipt sent successfully" });
        } catch (error) {
               // Log the error and return a 500 error response
            console.error("Error sending receipt:", error);
            return res.status(500).json({ status: 500, data: {message: "Internal server error" }});
        }
    }

      // Handler to send a receipt with an attachment via email
    async sendReceiptAttachment(req: Request, res: Response): Promise<Response> {
        const {
            productName,
            subtotal,
            tax,
            total,
            paymentMethod,
            date
        } = req.body;

        // Check if the user is a guest and return a 403 error if so
        if (req.user && req.user.role === 'guest') {
            return res.status(403).json({data: {message: "User not loggged in"}, status:403})
        }

           // Retrieve the user's email from the request object
        const email = req.user?.email;
         // If the user is not found, return a 404 error
        const user = await this.userService.findOneUserEmail(email as string);
        if (!user) {
            return res.status(404).json({ status: 404, data:{message: "User not found"}})
        }

        const name = user.name;
        // Validate required fields
        if (!email || !name || !productName || subtotal === undefined || tax === undefined || total === undefined || !paymentMethod || !date) {
            return res.status(400).json({ error: true, errorMessage: "Missing required fields" });
        }

        try {
            // Send the receipt via email using the EmailService
            const result = await this.emailService.sendReceiptAttachment({
                email,
                name,
                productName,
                subtotal,
                tax,
                total,
                paymentMethod,
                date
            });

            return res.status(200).json({ success: true, message: "Receipt sent successfully" });
        } catch (error) {
             // Log the error and return a 500 error response
            console.error("Error sending receipt:", error);
            return res.status(500).json({ status: 500, data: {message: "Internal server error" }});
        }
    }
}
