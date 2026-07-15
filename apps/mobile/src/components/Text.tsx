import type { PropsWithChildren } from "react";
import { StyleSheet, Text as RNText, type StyleProp, type TextStyle } from "react-native";
import { colors } from "@/lib/theme";

interface TextProps extends PropsWithChildren {
  variant?: "eyebrow" | "title" | "subtitle" | "body" | "muted" | "price";
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function Text({ children, variant = "body", style, numberOfLines }: TextProps) {
  return <RNText numberOfLines={numberOfLines} style={[styles[variant], style]}>{children}</RNText>;
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.goldSoft,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  title: {
    color: colors.cream,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.cream,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700"
  },
  body: {
    color: colors.cream,
    fontSize: 15,
    lineHeight: 22
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  price: {
    color: colors.goldSoft,
    fontSize: 14,
    fontWeight: "700"
  }
});
