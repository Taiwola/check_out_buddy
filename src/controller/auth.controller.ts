import { EmailService, UserService } from "../services";
import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UserDoc } from "../model/user.model";
import { Decoded } from "../types";
import { CustomError } from "../common/customError";

export class AuthController {
  private userService: UserService;
  private emailService: EmailService;

  constructor() {
    // Initialize the UserService and EmailService instances
    this.userService = new UserService();
    this.emailService = new EmailService();
  }

    // Transform user data to exclude sensitive information and include token details
  private transformUserData(
    userDoc: UserDoc,
    token?: string,
    refreshTokenFromUser?: string
  ) {
    const {
      password,
      _id,
      __v,
      verification_code,
      verification_code_expires,
      refreshToken,
      resetPasswordCode,
      resetPasswordCodeExpiresIn,
      role,
      googleUserId,
      ...rest
    } = userDoc.toObject();
    return {
      user: { id: _id, image: userDoc.image || "", ...rest },
      token,
      refreshToken: refreshTokenFromUser,
    };
  }

   // Generate a random verification code and set an expiration time of 1 hour
  private async generateCode() {
    // create a code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    // Set verification code expiry time to 1 hour from now
    const codeExpires = new Date(Date.now() + 3600000);
    return {
      code,
      codeExpires,
    };
  }

   // Generate a JWT token for a user with a 5-hour expiration
  private async generateToken(user: UserDoc): Promise<string> {
    return jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "5h" }
    );
  }

   // Generate a refresh token with a 7-day expiration
  private async generateRefreshToken(email: string): Promise<string> {
    return jwt.sign({ email: email }, process.env.JWT_REFRESH_TOKEN as string, {
      expiresIn: "7d",
    });
  }

  // Validate the refresh token
  private async validateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN as string);
      return true;
    } catch (error) {
      return false;
    }
  }

    // Decode a JWT token to retrieve the user details
  private async decodeToken(token: string) {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as Decoded;
    return decoded;
  }

    // Handle resending verification or reset password codes
  private async resendCode(
    email: string,
    purpose: "verification" | "forgetPassword"
  ) {
    const user = await this.userService.findOneUserEmail(email);

    if (!user) {
      return {
        status: 400,
        response: { message: "User does not exist", success: false },
      };
    }

    const { code, codeExpires } = await this.generateCode();

    try {
      if (purpose === "verification") {
        const { error, errorMessage } =
          await this.emailService.sendVerificationCode({
            email,
            name: user.name,
            code,
          });
        if (error) {
          console.log("Error sending email");
          console.log(errorMessage);
        }
      } else {
        const { error, errorMessage } =
          await this.emailService.sendForgotPasswordEmail({
            email,
            name: user.name,
            code,
          });
        if (error) {
          console.log("Error sending email");
          console.log(errorMessage);
        }
      }

      // Update the user in the database
      const updateFields =
        purpose === "verification"
          ? { verification_code: code, verification_code_expires: codeExpires }
          : {
              resetPasswordCode: code,
              resetPasswordCodeExpiresIn: codeExpires,
            };

      await this.userService.updateUser(user._id as string, updateFields);

      return { status: 200, message: "Request was successful", success: true };
    } catch (error) {
      console.error("Error in updating the code", error);

      return { status: 500, message: "internal server errror", success: false };
    }
  }

    // Handle user login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

        // Find user by email
      const user = await this.userService.findOneUserEmail(email);

      if (!user)
        return res
          .status(404)
          .json({ data: { message: "Invalid Credentials" }, status: 404 });

      // Validate the password
      const isPasswordValid = await bcrypt.compare(
        password as string,
        user.password
      );

      if (!isPasswordValid)
        return res.status(404).json({
          data: { message: "Invalid Credentials" },
          status: 404,
        });

      // generate token and refresh token for the logged in user
      const token = await this.generateToken(user);
      let refreshToken = user.refreshToken;
      // verify the refresh token
      const verifyResfreshToken = await this.validateRefreshToken(refreshToken);

      if (!verifyResfreshToken) {
        refreshToken = await this.generateRefreshToken(user.email);
        // update the user
        await this.userService.updateUser(user._id as string, {
          refreshToken: refreshToken,
        });
      }

      // Transform the user data for the response
      const userData = this.transformUserData(user, token, refreshToken);

      return res.status(200).json({
        message: "Login was successfull",
        data: userData,
        success: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Handle user registration
  async register(req: Request, res: Response) {
    try {
      const { email, name, password } = req.body;

      // Check if the email is already registered
      const user = await this.userService.findOneUserEmail(email);
      if (user)
        return res
          .status(400)
          .json({ data: { message: "Email already exist" }, status: 400 });

      const hashPwd = await bcrypt.hash(password, 10);

      // create a verification code
      const verificationCode = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      // Set verification code expiry time to 1 hour from now
      const verificationCodeExpires = new Date(Date.now() + 3600000);
      // send the verification code to the user email
      const { error, errorMessage } =
        await this.emailService.sendVerificationCode({
          email,
          name,
          code: verificationCode,
        });

      if (error) {
        console.log("error sending email");
        console.log(errorMessage);
      }

      // create refresh token
      const refreshToken = await this.generateRefreshToken(email);

      // add the user to the db
      const options: Partial<UserDoc> = {
        name: name,
        email: (email as string).toLowerCase(),
        password: hashPwd,
        verification_code: verificationCode,
        verification_code_expires: verificationCodeExpires,
        refreshToken: refreshToken,
      };
      const userCreated = await this.userService.createUser(options);

      // Generate token
      const token = await this.generateToken(userCreated);

      return res.status(201).json({
        message:
          "Registration was successful. Please check your email for the verification code.",
        data: this.transformUserData(userCreated, token),
        success: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

   // Handle code verification (e.g., for email verification)
  async verifyCode(req: Request, res: Response) {
    try {
      const { code } = req.body;

       // Find the user using the verification code
      const user = await this.userService.findUserUsingCode(code);
      if (!user) {
        return res
          .status(404)
          .json({ data: { message: "User not found" }, status: 404 });
      }
      // Check if the code is valid and not expired
      const isCodeValid = user.verification_code === code;
      const isExpired = new Date() > user.verification_code_expires;

      if (!isCodeValid) {
        return res.status(400).json({
          data: { message: "Invalid verification code" },
          status: 400,
        });
      }

      if (isExpired) {
        return res.status(400).json({
          data: { message: "Verification code has expired" },
          status: 400,
        });
      }

      // Mark the user's email as verified or perform other actions
      const options: Partial<UserDoc> = {
        verified: true,
      };

       // Update the user's verification status
      await this.userService.updateUser(user._id as string, options);

      return res
        .status(200)
        .json({ message: "Verification successful", success: true });
    } catch (error) {
      console.error("Verification error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Handles the forgot password request by generating a reset code and sending it to the user's email.
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

     // Look up the user by email
    const user = await this.userService.findOneUserEmail(email);

     // If the user doesn't exist, return a 404 response
    if (!user)
      return res
        .status(404)
        .json({ message: "Email does not exist", success: false });

    const name = user.name;
     // Generate a reset code and expiration time
    const { code, codeExpires } = await this.generateCode();

    // Send the reset code to the user's email
    const { error, errorMessage } =
      await this.emailService.sendForgotPasswordEmail({ email, name, code });

      // Log an error if the email fails to send
    if (error) {
      console.log("error sending email");
      console.log(errorMessage);
    }

    // Prepare the updated user data with the reset code and expiration time
    const options: Partial<UserDoc> = {
      resetPasswordCode: code,
      resetPasswordCodeExpiresIn: codeExpires,
    };
    try {
       // Update the user with the reset code and expiration time
      await this.userService.updateUser(user._id as string, options);

      // Return a success response
      return res.status(200).json({
        message: "Request was successfull, check your email for more details",
        success: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Verifies the reset code provided by the user
  async verifyResetCode(req: Request, res: Response) {
    try {
      const { code } = req.body;

       // Look up the user by the reset code
      const user = await this.userService.findResetCode(code);
       // If the user with the code doesn't exist, return a 404 response
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", success: false });
      }
       // Check if the provided code matches the one stored in the user's record
      const isCodeValid = user.resetPasswordCode === code;

       // Check if the code has expired
      const isExpired = new Date() > user.resetPasswordCodeExpiresIn;

       // If the code is invalid, return a 400 response
      if (!isCodeValid) {
        return res
          .status(400)
          .json({ data: { message: "Invalid reset code" }, status: 400 });
      }

       // If the code has expired, return a 400 response
      if (isExpired) {
        return res
          .status(400)
          .json({ data: { message: "Reset code has expired" }, status: 400 });
      }

       // If the code is valid and not expired, return a success response
      return res
        .status(200)
        .json({ message: "Verification successful", success: true });
    } catch (error) {
      console.error("Verification error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Resets the user's password after verifying the reset code
  async resetPassword(req: Request, res: Response) {
    const { newPassword, code } = req.body;

    const user = await this.userService.findResetCode(code as string);
    
    // If the user doesn't exist, return a 404 response
    if (!user)
      return res.status(404).json({
        data: { message: "Could not reset password, try again" },
        status: 404,
      });

    try {
       // Hash the new password
      const hashPwd = await bcrypt.hash(newPassword, 10);

       // Prepare the updated user data with the new password
      const options: Partial<UserDoc> = {
        password: hashPwd,
      };

       // Update the user's password in the database
      await this.userService.updateUser(user._id as string, options);

      return res
        .status(200)
        .json({ message: "Request was successfull", success: true });
    } catch (error) {
       // Handle any errors that occur during the password reset process
      console.error("Reset password error:", error);
      return res
        .status(500)
        .json({ data: { message: "Internal server error" }, status: 500 });
    }
  }

  // Resends the verification code to the user's email
  async resendVerificationCode(req: Request, res: Response) {
    const { email } = req.body;
     // Resend the verification code for the given email
    const { status, message, success } = await this.resendCode(
      email,
      "verification"
    );
     // If the operation was not successful, return an error response
    if (!success) {
      return res.status(status).json({
        message,
        data: {},
        status: status,
      });
    }
     // If successful, return a success response
    return res.status(status).json({ message: message, success: success });
  }

  // Resends the reset password code to the user's email
  async resendResetPasswordCode(req: Request, res: Response) {
    const { email } = req.body;
     // Resend the reset password code for the given email
    const { status, success, message } = await this.resendCode(
      email,
      "forgetPassword"
    );
     // If the operation was not successful, return an error response
    if (!success) {
      return res.status(status).json({
        data: {
          message: message,
        },
        status: status,
      });
    }
    // If successful, return a success response
    return res.status(status).json({ message: message, success: success });
  }
}
