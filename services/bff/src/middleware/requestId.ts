import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incoming = req.headers["x-request-id"];
  const requestId =
    (Array.isArray(incoming) ? incoming[0] : incoming) || uuidv4();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
