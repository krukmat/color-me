import type { SelfieData } from "../types/selfie";
import type { TryOnPayload } from "../utils/request";

export interface TryOnResponse {
  imageUrl: string;
  processingMs: number;
  requestId: string;
  color: string;
}

export interface PerformTryOnArgs {
  payload: TryOnPayload;
  selfie: SelfieData;
}

const randomProcessingMs = () => 600 + Math.round(Math.random() * 400);

export const mockTryOnRequest = async ({
  payload,
  selfie,
}: PerformTryOnArgs): Promise<TryOnResponse> => {
  const processingMs = randomProcessingMs();
  const imageUrl = selfie.uri;

  await new Promise((resolve) => setTimeout(resolve, processingMs));

  return {
    imageUrl: imageUrl ?? "",
    processingMs,
    requestId: payload.request_id,
    color: payload.color,
  };
};
