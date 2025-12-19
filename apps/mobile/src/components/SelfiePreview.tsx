import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import type { SelfieData } from "../types/selfie";
import type { PaletteColor } from "../utils/palette";

interface Props {
  selfie?: SelfieData;
  selectedColor: PaletteColor;
  intensity: number;
  beforeAfterPosition: number;
  processingMs?: number;
  imageUrl?: string; // MOBILE-002: Processed image from try-on API
}

const overlayOpacity = (intensity: number, blend: number): number => {
  return Math.min(intensity / 100, 1) * Math.min(blend, 1) * 0.8;
};

export const SelfiePreview: React.FC<Props> = ({
  selfie,
  selectedColor,
  intensity,
  beforeAfterPosition,
  processingMs,
  imageUrl,
}) => {
  if (!selfie?.uri) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Aún no seleccionaste una selfie.</Text>
        <Text style={styles.placeholderSubtext}>
          Usa buena iluminación y fondo neutro para mejores resultados.
        </Text>
      </View>
    );
  }

  const percentAfter = Math.round(beforeAfterPosition * 100);
  const percentBefore = 100 - percentAfter;

  return (
    <View>
      <ImageBackground
        source={{ uri: selfie.uri }}
        resizeMode="cover"
        style={styles.image}
        imageStyle={styles.imageBorder}
        accessibilityLabel="Selfie seleccionada"
      >
        {/* MOBILE-002: Show processed image if available, controlled by beforeAfterPosition slider */}
        {imageUrl && (
          <ImageBackground
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={[styles.image, { opacity: beforeAfterPosition }]}
            imageStyle={styles.imageBorder}
            accessibilityLabel="Resultado aplicado"
          />
        )}
        {/* Fallback: Color tint if no processed image (before API response) */}
        {!imageUrl && (
          <View
            style={[
              styles.overlay,
              {
                backgroundColor: selectedColor.hex,
                opacity: overlayOpacity(intensity, beforeAfterPosition)
              },
            ]}
          />
        )}
      </ImageBackground>
      <View style={styles.previewMeta}>
        <Text style={styles.colorName}>{selectedColor.name}</Text>
        <Text style={styles.colorDetails}>
          Antes {percentBefore}% · Después {percentAfter}%
        </Text>
        {processingMs ? (
          <Text style={styles.processing}>{`Procesado en ${processingMs} ms`}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  placeholderText: {
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  placeholderSubtext: {
    marginTop: 8,
    color: "#888",
    textAlign: "center",
    fontSize: 12,
  },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  imageBorder: {
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  previewMeta: {
    marginTop: 8,
  },
  colorName: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  colorDetails: {
    color: "#A0A0A0",
    marginTop: 2,
  },
  processing: {
    color: "#6DD3FB",
    marginTop: 2,
    fontSize: 12,
  },
});
