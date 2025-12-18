import { act } from "react-test-renderer";
import { useSelfieStore } from "../src/store/selfieStore";

describe("useSelfieStore", () => {
  afterEach(() => {
    const { clear } = useSelfieStore.getState();
    clear();
  });

  it("saves selfie data and clears errors", () => {
    const { setSelfie, setError } = useSelfieStore.getState();
    act(() => {
      setError("error");
      setSelfie({ uri: "file://selfie.jpg" });
    });
    const state = useSelfieStore.getState();
    expect(state.selfie?.uri).toBe("file://selfie.jpg");
    expect(state.error).toBeUndefined();
  });

  it("marks processing state", () => {
    const { setProcessing } = useSelfieStore.getState();
    act(() => {
      setProcessing(true);
    });
    expect(useSelfieStore.getState().isProcessing).toBe(true);
  });
});
