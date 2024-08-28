import { verifyTransporter,sendMail } from "../config/email.config";
import { Readable } from "nodemailer/lib/xoauth2";
import PDFDocument from 'pdfkit';


interface EmailOptions {
    email: string;
    name: string;
    code: string;
    url?: string;
  }


  interface ForgotPasswordOptions {
    email: string;
    name: string;
    code: string;
  }


  interface ReceiptOptions {
    email: string;
    name: string;
    productName: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    date: string;
}

export class EmailService {



  private async generateReceiptPdf({
      productName,
      subtotal,
      tax,
      total,
      paymentMethod,
      date
  }: {
      productName: string;
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: string;
      date: string;
  }): Promise<Buffer> {
      return new Promise((resolve, reject) => {
          const doc = new PDFDocument();
          const buffers: Buffer[] = [];
  
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
              resolve(Buffer.concat(buffers));
          });
  
          const margin = 50;
          const lineHeight = 20;
          const centerText = (text: string) => doc.text(text, { align: 'center' });
  
          doc
              .fontSize(16)
              .text('Receipt', { align: 'center' })
              .moveDown(1)
              .fontSize(12)
              .text('========================', { align: 'center' })
              .moveDown(1)
              .text(`Product Name: ${productName}`, { continued: true })
              .text(` ${productName}`, { align: 'left' })
             
              .text(`Subtotal: $${subtotal}`, { continued: true })
              .text(` $${subtotal}`, { align: 'left' })
            
              .text(`Tax (10%): $${tax}`, { continued: true })
              .text(` $${tax}`, { align: 'left' })
              
              .text(`Total: $${total}`, { continued: true })
              .text(` $${total}`, { align: 'left' })
              .moveDown(1)
              .text('========================', { align: 'center' })
              .moveDown(1)
              .text(`Payment Method: ${paymentMethod}`, { continued: true })
              .text(` ${paymentMethod}`, { align: 'left' })
      
              .text(`Date: ${date}`, { continued: true })
              .text(` ${date}`, { align: 'left' })
              .end();
  
          doc.on('error', reject);
      });
  }
  


    async sendVerificationCode({email, name, code, url}: EmailOptions) {
        let verify: boolean;
        try {
          verify = await verifyTransporter();
        } catch (error: unknown) {
          console.log(error);
          return { error: true, errorMessage: (error as Error).message };
        }
      
        if (!verify) return { error: true, errorMessage: "Failed to verify transporter" };

        let mailOptions;
        try {
        
            mailOptions = {
              from: {
                name: "Check Out Buddy", // you should add this
                address: process.env.MAIL_USERNAME as string, // change this to the user name you want
              },
              to: email,
              subject: "Verification code",
              text: `Hello ${name}, your verification code is: ${code}`
            };
            await sendMail(mailOptions);
            return { error: false, errorMessage: "" };
          } catch (error) {
            return { error: true, errorMessage: (error as Error).message };
          }
    }

    async sendWelcomeEmail({ email, name }: EmailOptions) {
        try {
            let verify: boolean;
            try {
                verify = await verifyTransporter();
              } catch (error: unknown) {
                console.log(error);
                return { error: true, errorMessage: (error as Error).message };
              }
              if (!verify) return { error: true, errorMessage: "Failed to verify transporter" };

            const mailOptions = {
                from: {
                    name: "Check Out Buddy",
                    address: process.env.MAIL_USERNAME as string,
                },
                to: email,
                subject: "Welcome to Retail Store",
                //text: `Hello ${name},\n\nWelcome to Retail Store! We're excited to have you on board. Feel free to explore our store and discover amazing products.\n\nBest regards,\nThe Retail Store Team`,
                html: `<p>Hello ${name},</p><p>Welcome to Retail Store! We're excited to have you on board. Feel free to explore our store and discover amazing products.</p><p>Best regards,<br>The Check Out Buddy Team</p>`
            };

            await sendMail(mailOptions);
            return { error: false, errorMessage: "" };
        } catch (error) {
            console.error("Email sending error:", error);
            return { error: true, errorMessage: (error as Error).message };
        }
    }

    async sendForgotPasswordEmail({ email, name, code }: ForgotPasswordOptions) {
        let verify: boolean;
        try {
            verify = await verifyTransporter();
        } catch (error: unknown) {
            console.log(error);
            return { error: true, errorMessage: (error as Error).message };
        }

        if (!verify) return { error: true, errorMessage: "" };

        let mailOptions;
        try {

            mailOptions = {
                from: {
                    name: "Check Out Buddy",
                    address: process.env.MAIL_USERNAME as string,
                },
                to: email,
                subject: "Password Reset Request",
                text: `Hello ${name},\n\nYou requested to reset your password. Please copy the code to reset it:\n\n${code}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nCheck Out Buddy Team`
            };
            await sendMail(mailOptions);
            return { error: false, errorMessage: "" };
        } catch (error) {
            return { error: true, errorMessage: (error as Error).message };
        }
    }


    async sendReceipt({
      email,
      name,
      productName,
      subtotal,
      tax,
      total,
      paymentMethod,
      date
  }: ReceiptOptions) {
      let verify: boolean;
      try {
          verify = await verifyTransporter();
      } catch (error: unknown) {
          console.log(error);
          return { error: true, errorMessage: (error as Error).message };
      }

      if (!verify) return { error: true, errorMessage: "Failed to verify transporter" };

      const mailOptions = {
          from: {
              name: "Check Out Buddy",
              address: process.env.MAIL_USERNAME as string,
          },
          to: email,
          subject: "Your Purchase Receipt",
          html: `
              <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        p {
            margin: 10px 0;
            line-height: 1.5;
        }
        .section {
            padding: 10px 0;
           
        }
        .section hr {
            border: 1px solid #ddd;
            margin: 10px 0;
        }
        .highlight {
            font-weight: bold;
            color: #333;
            display: inline-block;
            width: 150px; /* Adjust the width to fit your design */
        }
        .value {
            margin-left: 20px; /* Adjust the spacing between label and value */
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Receipt</h1>
        <p>Hello ${name},</p>
        <p>Thank you for your purchase on ${date}. Here is your receipt:</p>

        <hr>
        <div class="section">
            <p><span class="highlight">Product Name:</span><span class="value">${productName}</span></p>
            <p><span class="highlight">Subtotal:</span><span class="value">$${subtotal}</span></p>
            <p><span class="highlight">Tax (10%):</span><span class="value">$${tax}</span></p>
            <p><span class="highlight">Total:</span><span class="value">$${total}</span></p>
        </div>
        <hr>

        <div class="section">
            <p><span class="highlight">Payment Method:</span><span class="value">${paymentMethod}</span></p>
            <p><span class="highlight">Date:</span><span class="value">${date}</span></p>
        </div>
    </div>
</body>
</html>

          `,
      };

      try {
          await sendMail(mailOptions);
          return { error: false, errorMessage: "" };
      } catch (error) {
          return { error: true, errorMessage: (error as Error).message };
      }
  }


  async sendReceiptAttachment({
    email,
    name,
    productName,
    subtotal,
    tax,
    total,
    paymentMethod,
    date
  }: ReceiptOptions) {
 
    let verify: boolean;
    try {
        verify = await verifyTransporter();
    } catch (error: unknown) {
        console.log(error);
        return { error: true, errorMessage: (error as Error).message };
    }

    if (!verify) return { error: true, errorMessage: "Failed to verify transporter" };

    try {
       // Generate PDF receipt
       const pdfStream = await this.generateReceiptPdf({
        productName,
        subtotal,
        tax,
        total,
        paymentMethod,
        date
    });
     // Send email with PDF attachment
     const mailOptions = {
      from: {
          name: "Check Out Buddy",
          address: process.env.MAIL_USERNAME as string,
      },
      to: email,
      subject: "Your Purchase Receipt",
      text: `Hello ${name},\n\nPlease find your receipt attached.\n\nBest regards,\nThe Check Out Buddy Team`,
      attachments: [
          {
              filename: 'receipt.pdf',
              content: pdfStream,
              contentType: 'application/pdf'
          }
      ]
  };
  await sendMail(mailOptions);
  return { error: false, errorMessage: "" };
    } catch (error) {
      console.log(error);
      return { error: true, errorMessage: (error as Error).message };
    }
     

     

     
  }
}