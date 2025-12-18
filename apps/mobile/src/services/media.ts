import {
  Asset,
  launchCamera,
  launchImageLibrary,
  ImageLibraryOptions,
  CameraOptions,
} from "react-native-image-picker";
import type { SelfieData } from "../types/selfie";

const basePickerOptions: ImageLibraryOptions = {
  mediaType: "photo",
  includeBase64: true,
  quality: 0.8,
  selectionLimit: 1,
};

const baseCameraOptions: CameraOptions = {
  mediaType: "photo",
  includeBase64: true,
  saveToPhotos: false,
  quality: 0.8,
};

const normalizeAsset = (asset?: Asset): SelfieData | undefined => {
  if (!asset?.uri) return undefined;
  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    fileSize: asset.fileSize ?? undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    mimeType: asset.type ?? undefined,
  };
};

export const pickFromLibrary = async (): Promise<SelfieData | undefined> => {
  const result = await launchImageLibrary(basePickerOptions);
  if (result.didCancel) return undefined;
  if (result.errorMessage) {
    throw new Error(result.errorMessage);
  }
  return normalizeAsset(result.assets?.[0]);
};

export const captureFromCamera = async (): Promise<SelfieData | undefined> => {
  const result = await launchCamera(baseCameraOptions);
  if (result.didCancel) return undefined;
  if (result.errorMessage) {
    throw new Error(result.errorMessage);
  }
  return normalizeAsset(result.assets?.[0]);
};
