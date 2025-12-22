import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelfieStore } from "../store/selfieStore";
import { captureFromCamera, pickFromLibrary } from "../services/media";
import { SelfiePreview } from "../components/SelfiePreview";
import { ColorPalette } from "../components/ColorPalette";
import { SliderControl } from "../components/SliderControl";
import { PALETTE } from "../utils/palette";
import { useTryOnState } from "../state/useTryOnState";
import { openWhatsAppBooking } from "../utils/cta";
import {
  formatBytesToMB,
  validateSelfieResult,
  validateSelfieForApply,
  buildTryOnRequest,
  formatErrorMessage,
  buildSharePayload,
  calculateBeforeAfterPercentage,
  isApplyButtonDisabled,
  isShareButtonDisabled,
  showFileTooLargeAlert,
  showInvalidSelfieAlert,
  showErrorAlert,
  executeTryOn,
  executeShare,
} from "./CaptureScreen.utils";
import {
  handleSelfieResultCallback,
  processSelectionCallback,
  onApplyColorCallback,
  onShareCallback,
  generateTryOnMessage,
} from "./CaptureScreen.callbacks";
// MOBILE-003: Extracted callbacks to pure functions for better testability
// MOBILE-004: Use extracted callback logic for improved coverage

export const CaptureScreen: React.FC = () => {
  const { selfie, setSelfie, setProcessing, setError, isProcessing } =
    useSelfieStore();
  const [status, setStatus] = useState<string>();
  const {
    selectedColor,
    intensity,
    beforeAfterPosition,
    status: tryOnStatus,
    requestId,
    result,
    error: tryOnError,
    selectColor,
    setIntensity,
    setBeforeAfterPosition,
    markLoading,
    markSuccess,
    markError,
    resetFlow,
    regenerateRequestId,
  } = useTryOnState();

  const handleSelfieResult = useCallback(
    (result?: Awaited<ReturnType<typeof pickFromLibrary>>) => {
      // MOBILE-004: Use extracted callback function for testing
      handleSelfieResultCallback(result, setSelfie, setError, resetFlow, setStatus);
    },
    [setSelfie, setError, resetFlow]
  );

  const processSelection = useCallback(
    async (action: () => Promise<ReturnType<typeof pickFromLibrary>>) => {
      // MOBILE-004: Use extracted callback function for testing
      await processSelectionCallback(
        action,
        handleSelfieResult,
        setProcessing,
        setStatus,
        setError
      );
    },
    [handleSelfieResult, setError, setProcessing]
  );

  const onPick = useCallback(() => {
    processSelection(pickFromLibrary);
  }, [processSelection]);

  const onCapture = useCallback(() => {
    processSelection(captureFromCamera);
  }, [processSelection]);

  const onShare = useCallback(async () => {
    // MOBILE-004: Use extracted callback function for testing
    await onShareCallback(result, selectedColor, intensity, buildSharePayload, executeShare);
  }, [result, selectedColor, intensity]);

  const onApplyColor = useCallback(async () => {
    // MOBILE-004: Use extracted callback function for testing
    await onApplyColorCallback(
      selfie,
      selectedColor,
      intensity,
      requestId,
      validateSelfieForApply,
      buildTryOnRequest,
      executeTryOn,
      markLoading,
      markSuccess,
      markError,
      regenerateRequestId
    );
  }, [
    intensity,
    markError,
    markLoading,
    markSuccess,
    regenerateRequestId,
    requestId,
    selectedColor,
    selfie,
  ]);

  const tryOnMessage = useMemo(() => {
    // MOBILE-004: Use extracted message generation function for testing
    return generateTryOnMessage(tryOnStatus, result, selectedColor, tryOnError);
  }, [result, selectedColor, tryOnError, tryOnStatus]);

  // MOBILE-003: Use isApplyButtonDisabled from utils for coverage
  const applyDisabled = isApplyButtonDisabled(selfie, tryOnStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Hair color try-on</Text>
          <SelfiePreview
            selfie={selfie}
            selectedColor={selectedColor}
            intensity={intensity}
            beforeAfterPosition={beforeAfterPosition}
            processingMs={result?.processingMs}
            imageUrl={result?.imageUrl}
          />

          {isProcessing ? (
            <View style={styles.statusRow}>
              <ActivityIndicator />
              <Text style={styles.statusText}>{status ?? "Procesando..."}</Text>
            </View>
          ) : (
            <Text style={styles.helper}>
              Usa una selfie bien iluminada para mejores resultados.
            </Text>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondary]}
              onPress={onPick}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Elegir foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primary]}
              onPress={onCapture}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Abrir cámara</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ColorPalette
              palette={PALETTE}
              selected={selectedColor}
              onSelect={selectColor}
            />
          </View>

          <View style={styles.section}>
            <SliderControl
              label="Intensidad"
              min={0}
              max={100}
              step={5}
              value={intensity}
              onChange={setIntensity}
              leftLabel="Sutil"
              rightLabel="Intenso"
              valueFormatter={(value) => `${value}%`}
            />
          </View>

          <View style={styles.section}>
            <SliderControl
              label="Comparar antes/después"
              min={0}
              max={1}
              step={0.05}
              value={beforeAfterPosition}
              onChange={setBeforeAfterPosition}
              leftLabel="Antes"
              rightLabel="Después"
              // MOBILE-003: Use calculateBeforeAfterPercentage from utils for coverage
              valueFormatter={calculateBeforeAfterPercentage}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.applyButton,
              applyDisabled && styles.disabled,
            ]}
            onPress={onApplyColor}
            disabled={applyDisabled}
          >
            <Text style={[styles.buttonText, styles.applyText]}>
              Aplicar color
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.bookingButton]}
            onPress={openWhatsAppBooking}
          >
            <Text style={[styles.buttonText, styles.bookingText]}>
              📅 Reserva tu cita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // MOBILE-003: Use isShareButtonDisabled from utils for coverage
            style={[
              styles.button,
              styles.shareButton,
              isShareButtonDisabled(result) && styles.disabled,
            ]}
            onPress={onShare}
            disabled={isShareButtonDisabled(result)}
          >
            <Text style={[styles.buttonText, styles.shareText]}>
              📤 Compartir resultado
            </Text>
          </TouchableOpacity>

          {tryOnMessage ? (
            <View style={styles.tryOnStatus}>
              <Text
                style={[
                  styles.tryOnText,
                  tryOnStatus === "error" && styles.tryOnError,
                ]}
              >
                {tryOnMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.requestRow}>
            <Text style={styles.requestLabel}>request_id</Text>
            <Text style={styles.requestValue}>{requestId}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D1117",
  },
  scrollContent: {
    paddingBottom: 48,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 24,
    backgroundColor: "#0D1117",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  helper: {
    color: "#A0A0A0",
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusText: {
    color: "#fff",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: {
    backgroundColor: "#F4B55E",
  },
  secondary: {
    backgroundColor: "#1F2A37",
  },
  buttonText: {
    color: "#0D1117",
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  applyButton: {
    backgroundColor: "#F4B55E",
  },
  applyText: {
    color: "#0D1117",
  },
  bookingButton: {
    backgroundColor: "#25D366",
  },
  bookingText: {
    color: "#fff",
  },
  shareButton: {
    backgroundColor: "#0A66C2",
  },
  shareText: {
    color: "#fff",
  },
  disabled: {
    opacity: 0.4,
  },
  tryOnStatus: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#1F2A37",
  },
  tryOnText: {
    color: "#6DD3FB",
  },
  tryOnError: {
    color: "#FF9B9B",
  },
  requestRow: {
    marginTop: 8,
  },
  requestLabel: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  requestValue: {
    color: "#fff",
    fontFamily: "Menlo",
    fontSize: 12,
  },
});
