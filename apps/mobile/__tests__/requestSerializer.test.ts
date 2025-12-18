import { buildTryOnPayload, createRequestId, snapIntensity } from "../src/utils/request";

const MOCK_SELFIE = {
  uri: "file://selfie.jpg",
  base64: "dGVzdA==",
};

describe("request serializer", () => {
  it("normalizes intensity to step increments", () => {
    const payload = buildTryOnPayload({
      selfie: MOCK_SELFIE,
      color: "Sunlit Amber",
      intensity: 63,
      requestId: "req-1",
    });
    expect(payload.intensity).toBe(65);
  });

  it("creates payloads with generated request ids", () => {
    const payload = buildTryOnPayload({
      selfie: MOCK_SELFIE,
      color: "Midnight Espresso",
    });
    expect(payload.request_id).toMatch(/^req-/);
  });

  it("throws if selfie lacks base64", () => {
    expect(() =>
      buildTryOnPayload({
        selfie: { uri: "file://image.jpg" },
        color: "Forest Veil",
      })
    ).toThrow("La selfie debe incluir datos base64");
  });

  it("snaps intensity helper independently", () => {
    expect(snapIntensity(3)).toBe(5);
    expect(snapIntensity(101)).toBe(100);
    expect(snapIntensity(undefined)).toBe(50);
  });

  it("generates uniqueish request ids", () => {
    const idA = createRequestId();
    const idB = createRequestId();
    expect(idA).not.toBe(idB);
  });
});
