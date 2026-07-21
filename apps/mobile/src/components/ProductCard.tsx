import type { Product } from "@salora/types";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/lib/theme";
import { ProductVisual } from "./ProductVisual";
import { Text } from "./Text";
import { SaloraIcon } from "./SaloraIcon";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showDescription?: boolean;
  primaryColor?: string;
  surfaceColor?: string;
  borderRadius?: number;
}

export function ProductCard({ product, compact = false, showDescription = true, primaryColor, surfaceColor, borderRadius }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`عرض ${product.name}`} style={({ pressed }) => [styles.card, compact && styles.compact, surfaceColor ? { backgroundColor: surfaceColor } : null, borderRadius !== undefined ? { borderRadius } : null, pressed && styles.pressed]}>
        <ProductVisual size={compact ? 78 : 108} imageUrl={product.visual} alt={product.name} />
        <View style={styles.body}>
          <Text variant="eyebrow">{product.category}</Text>
          <Text variant="subtitle" style={styles.title}>{product.name}</Text>
          {showDescription ? <Text variant="muted" style={styles.copy} numberOfLines={2}>{product.story ?? product.description}</Text> : null}
          <View style={styles.row}>
            <Text variant="price" style={primaryColor ? { color: primaryColor } : undefined}>{product.price.toFixed(3)} ر.ع</Text>
            {product.pairing ? <Text variant="muted">يناسب معه {product.pairing}</Text> : null}
          </View>
          <View style={styles.action}><Text style={styles.actionText}>عرض وتخصيص</Text><SaloraIcon name="back" size={16} color={primaryColor ?? colors.gold} /></View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row-reverse",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(245,239,227,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.09)",
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3
  },
  body: {
    flex: 1,
    alignItems: "flex-end"
  },
  title: {
    marginTop: 5,
    fontSize: 19
  },
  copy: {
    marginTop: 5,
    textAlign: "right"
  },
  row: {
    marginTop: spacing.sm,
    gap: 4,
    alignItems: "flex-end"
  },
  action: {
    marginTop: spacing.sm,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  actionText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.84
  },
  compact: {
    padding: spacing.sm,
    gap: spacing.sm
  }
});
