interface ICustomError {
    data: {
      message: string;
    };
    status: number;
  }
  
  export class CustomError extends Error implements ICustomError {
    status: number;
    data: { message: string };
  
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.data = { message };
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }
  
  
  // Usage example
  const error = new CustomError("Something went wrong", 400);
  console.log(error.data.message); // "Something went wrong"
  console.log(error.status);       // 400
  