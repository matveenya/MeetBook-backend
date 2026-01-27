export class AppError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  }
  
  export const catchAsync = (fn: Function) => {
    return (req: any, res: any, next: any) => {
      fn(req, res, next).catch(next);
    };
  };