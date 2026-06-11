import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/lib/theme";
import { Text } from "./Text";

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Button({ children, onPress, variant = "primary", style, disabled = false, accessibilityLabel }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
    >
      <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg
  },
  primary: {
    backgroundColor: colors.gold
  },
  secondary: {
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.16)",
    backgroundColor: "rgba(245,239,227,0.04)"
  },
  primaryText: {
    color: "#050505",
    fontWeight: "700"
  },
  secondaryText: {
    color: colors.cream,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.42
  }
});
