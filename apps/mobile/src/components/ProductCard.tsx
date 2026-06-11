import type { Product } from "@salora/types";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/lib/theme";
import { ProductVisual } from "./ProductVisual";
import { Text } from "./Text";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${product.name}`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <ProductVisual />
        <View style={styles.body}>
          <Text variant="eyebrow">{product.category}</Text>
          <Text variant="subtitle" style={styles.title}>{product.name}</Text>
          <Text variant="muted" style={styles.copy} numberOfLines={2}>{product.story ?? product.description}</Text>
          <View style={styles.row}>
            <Text variant="price">OMR {product.price.toFixed(3)}</Text>
            {product.pairing ? <Text variant="muted">Best with {product.pairing}</Text> : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
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
    flex: 1
  },
  title: {
    marginTop: 5,
    fontSize: 19
  },
  copy: {
    marginTop: 5
  },
  row: {
    marginTop: spacing.sm,
    gap: 4
  },
  pressed: {
    opacity: 0.84
  }
});
