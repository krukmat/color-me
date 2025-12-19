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
import { buildTryOnPayload } from "../utils/request";
import { performTryOn } from "../services/tryOnService";

const MAX_FILE_MB = 5;

const formatBytesToMB = (bytes?: number) => {
  if (!bytes) return 0;
  return bytes / (1024 * 1024);
};

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
      if (!result) return;
      if (formatBytesToMB(result.fileSize) > MAX_FILE_MB) {
        setError("Tu selfie excede el tamaño permitido.");
        Alert.alert(
          "Archivo demasiado grande",
          "Por favor selecciona una selfie más liviana (<5MB)."
        );
        return;
      }
      setSelfie(result);
      resetFlow();
      setStatus(undefined);
    },
    [setSelfie, setError, resetFlow]
  );

  const processSelection = useCallback(
    async (action: () => Promise<ReturnType<typeof pickFromLibrary>>) => {
      try {
        setProcessing(true);
        setStatus("Preparando selfie");
        const result = await action();
        handleSelfieResult(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No pudimos procesar tu selfie.";
        setError(message);
        Alert.alert("Error", message);
      } finally {
        setProcessing(false);
        setStatus(undefined);
      }
    },
    [handleSelfieResult, setError, setProcessing]
  );

  const onPick = useCallback(() => {
    processSelection(pickFromLibrary);
  }, [processSelection]);

  const onCapture = useCallback(() => {
    processSelection(captureFromCamera);
  }, [processSelection]);

  const onApplyColor = useCallback(async () => {
    if (!selfie) {
      Alert.alert("Selecciona una selfie", "Necesitamos una selfie para aplicar el color.");
      return;
    }
    if (!selfie.base64) {
      Alert.alert("Selfie inválida", "Necesitamos acceso al base64 para enviar la selfie.");
      return;
    }
    try {
      markLoading();
      const payload = buildTryOnPayload({
        selfie,
        color: selectedColor.name,
        intensity,
        requestId,
      });
      // TASK: MOBILE-001 — Call real HTTP API (performTryOn replaces mock)
      const response = await performTryOn(payload);
      markSuccess(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos procesar tu color. Reintenta.";
      markError({ code: "TRY_ON_ERROR", message, requestId });
      Alert.alert("No pudimos procesar tu color", message);
    } finally {
      regenerateRequestId();
    }
  }, [
    intensity,
    markError,
    markLoading,
    markSuccess,
    regenerateRequestId,
    requestId,
    selectedColor.name,
    selfie,
  ]);

  const tryOnMessage = useMemo(() => {
    if (tryOnStatus === "loading") {
      return `Procesando tono ${selectedColor.name}...`;
    }
    if (tryOnStatus === "error") {
      return tryOnError?.message ?? "No pudimos procesar tu color.";
    }
    if (tryOnStatus === "success" && result?.processingMs) {
      return `Listo en ${result.processingMs} ms · ID ${result.requestId}`;
    }
    return undefined;
  }, [result, selectedColor.name, tryOnError, tryOnStatus]);

  const applyDisabled = !selfie || tryOnStatus === "loading";

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
              valueFormatter={(value) => {
                const after = Math.round(value * 100);
                return `${after}% aplicado`;
              }}
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
