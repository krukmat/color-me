import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { PaletteColor } from "../utils/palette";

interface Props {
  palette: PaletteColor[];
  selected: PaletteColor;
  onSelect: (color: PaletteColor) => void;
}

const PALETTE_ITEM_SIZE = 48;

export const ColorPalette: React.FC<Props> = ({
  palette,
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elige un tono</Text>
      <FlatList
        data={palette}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = item.name === selected.name;
          return (
            <TouchableOpacity
              style={[
                styles.colorWrapper,
                isSelected && styles.selectedWrapper,
              ]}
              onPress={() => onSelect(item)}
              accessibilityLabel={`Color ${item.name}`}
            >
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: item.hex },
                  isSelected && styles.selectedCircle,
                ]}
              />
            </TouchableOpacity>
          );
        }}
      />
      <Text style={styles.colorName}>{selected.name}</Text>
      <Text style={styles.description}>{selected.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  colorWrapper: {
    width: PALETTE_ITEM_SIZE,
    height: PALETTE_ITEM_SIZE,
    borderRadius: PALETTE_ITEM_SIZE / 2,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedWrapper: {
    borderColor: "#F4B55E",
  },
  colorCircle: {
    width: PALETTE_ITEM_SIZE - 12,
    height: PALETTE_ITEM_SIZE - 12,
    borderRadius: (PALETTE_ITEM_SIZE - 12) / 2,
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorName: {
    color: "#fff",
    fontWeight: "600",
  },
  description: {
    color: "#A0A0A0",
  },
});
