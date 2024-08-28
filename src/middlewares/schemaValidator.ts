import { RequestHandler } from "express";
import schemas from "../util/schema.validator";

const supportedMethods = ["post", "put", "patch", "delete"];

const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: false,
};

const schemaValidator = (path: string): RequestHandler => {
  const schema = schemas[path];

  if (!schema) {
    throw new Error(`Schema not found for path: ${path}`);
  }

  return (req, res, next) => {
    const method = req.method.toLowerCase();

    if (!supportedMethods.includes(method)) {
      return next();
    }

    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const errors = error.details.map((item) => ({
        success: false,
        message: item.message,
      }));

      // Send back the first error
      return res.status(422).json(errors[0]);
    }

    // validation successful
    req.body = value;
    return next();
  };
};

export default schemaValidator;
