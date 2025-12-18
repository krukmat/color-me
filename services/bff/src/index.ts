import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import tryonRouter from "./routes/tryon";
import { requestIdMiddleware } from "./middleware/requestId";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(",") ?? "*" }));
app.use(express.json({ limit: "6mb" }));
app.use(requestIdMiddleware);

app.use("/api", tryonRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req["requestId"] ?? "unknown";
  console.error(`[${requestId}]`, err.message);
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Hubo un problema procesando tu solicitud.",
    request_id: requestId,
  });
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`BFF listening on port ${port}`);
});
