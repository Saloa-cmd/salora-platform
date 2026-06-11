import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/lib/theme";

interface ProductVisualProps {
  size?: number;
}

export function ProductVisual({ size = 92 }: ProductVisualProps) {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View style={styles.cup} />
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.08)",
    alignItems: "center",
    justifyContent: "center"
  },
  cup: {
    width: "38%",
    height: "58%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.matcha,
    borderWidth: 7,
    borderColor: "rgba(245,239,227,0.72)"
  },
  shadow: {
    position: "absolute",
    bottom: 15,
    width: "46%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.36)"
  }
});
