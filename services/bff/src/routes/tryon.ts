import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { TryOnRequest, TryOnResponse } from "../types/tryon";

const router = Router();

router.post(
  "/try-on",
  async (req: Request, res: Response, next: NextFunction) => {
    const payload: TryOnRequest = {
      selfie: req.body.selfie,
      color: req.body.color,
      intensity: Number(req.body.intensity || 50),
      request_id: req["requestId"],
    };

    try {
      const mlResponse = await axios.post<TryOnResponse>(
        process.env.ML_API_URL ?? "http://localhost:8000/try-on",
        payload,
        {
          headers: {
            "x-request-id": payload.request_id,
          },
          timeout: 25000,
        }
      );
      res.json(mlResponse.data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
