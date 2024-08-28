// schemas.ts

import Joi, { ObjectSchema } from "joi";

const schemas: { [key: string]: ObjectSchema<any> } = {
  "/login": Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),

    password: Joi.string().min(6).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
  }),

  "/register": Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),
    name: Joi.string().min(2).required().messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters long",
    }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
    confirmPassword: Joi.string().min(6).required().messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters long",
    }),
  }),
  "/verify_email_code": Joi.object({
    code: Joi.string().length(4).required().messages({
      "string.empty": "Verification code is required",
      "string.length": "Verification code must be exactly 4 characters long",
    }),
  }),
  "/forgot_password": Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),
  }),
  "/verify_reset_code": Joi.object({
    code: Joi.string().length(4).required().messages({
      "string.empty": "Reset code is required",
      "string.length": "Reset code must be exactly 4 characters long",
    }),
  }),
  "/reset_password": Joi.object({
    newPassword: Joi.string().min(6).required().messages({
      "string.empty": "New password is required",
      "string.min": "New password must be at least 6 characters long",
    }),
    code: Joi.string().length(4).required().messages({
      "string.empty": "Reset code is required",
      "string.length": "Reset code must be exactly 4 characters long",
    }),
  }),
  "/resend_verification_code": Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  }),

  "/resend_password_code": Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  }),
};

export default schemas;
