import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { calculateSliderValue, calculatePercent } from "./SliderControl.utils";

interface SliderControlProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  leftLabel?: string;
  rightLabel?: string;
  valueFormatter?: (value: number) => string;
  onChange: (value: number) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  valueFormatter,
  onChange,
}) => {
  const trackWidth = useRef(1);
  const [isSliding, setSliding] = useState(false);

  const setWidth = useCallback((event: LayoutChangeEvent) => {
    trackWidth.current = event.nativeEvent.layout.width;
  }, []);

  const handlePosition = useCallback(
    (positionX: number) => {
      const value = calculateSliderValue(positionX, trackWidth.current, min, max, step);
      onChange(value);
    },
    [max, min, onChange, step]
  );

  const { panHandlers } = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setSliding(true);
          handlePosition(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          handlePosition(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => setSliding(false),
        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: () => setSliding(false),
      }),
    [handlePosition]
  );

  const percent = calculatePercent(value, min, max);
  const formatted = valueFormatter ? valueFormatter(value) : value.toString();

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{formatted}</Text>
        </View>
      ) : null}
      <View style={styles.trackRow}>
        {leftLabel ? <Text style={styles.edgeLabel}>{leftLabel}</Text> : null}
        <View
          style={styles.trackWrapper}
          onLayout={setWidth}
          {...panHandlers}
        >
          <View style={styles.track} />
          <View style={[styles.trackFill, { width: `${percent}%` }]} />
          <View
            style={[
              styles.thumb,
              { left: `${percent}%` },
              isSliding && styles.thumbActive,
            ]}
          />
        </View>
        {rightLabel ? <Text style={styles.edgeLabel}>{rightLabel}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  value: {
    color: "#F4B55E",
    fontWeight: "600",
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  edgeLabel: {
    color: "#A0A0A0",
    fontSize: 12,
    width: 60,
  },
  trackWrapper: {
    flex: 1,
    height: 32,
  },
  track: {
    height: 6,
    backgroundColor: "#1F2A37",
    borderRadius: 999,
    overflow: "hidden",
    position: "absolute",
    top: 13,
    left: 0,
    right: 0,
  },
  trackFill: {
    position: "absolute",
    top: 13,
    left: 0,
    bottom: 13,
    backgroundColor: "#F4B55E",
    borderRadius: 999,
  },
  thumb: {
    position: "absolute",
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginLeft: -12,
    borderWidth: 2,
    borderColor: "#0D1117",
  },
  thumbActive: {
    backgroundColor: "#F4B55E",
  },
});
