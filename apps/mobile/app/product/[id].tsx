import { getProductById, products } from "@salora/data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { ProductVisual } from "@/components/ProductVisual";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { useCartStore } from "@/store/cart";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const product = getProductById(id ?? "") ?? products.find((item) => item.id === "iced-matcha-vanilla");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  if (!product) {
    return (
      <Screen>
        <Text variant="title">Product unavailable</Text>
        <Text variant="muted" style={styles.description}>This item is missing from the local Phase 1 menu data.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <ProductVisual size={220} />
      </View>
      <Text variant="eyebrow" style={styles.category}>{product.category}</Text>
      <Text variant="title">{product.name}</Text>
      <Text variant="muted" style={styles.description}>{product.story ?? product.description}</Text>
      <View style={styles.tags}>
        {product.tags.map((tag) => <View key={tag} style={styles.tag}><Text variant="muted">{tag}</Text></View>)}
      </View>
      <View style={styles.quantityRow}>
        <Text variant="price">OMR {product.price.toFixed(3)}</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.step}><Text>-</Text></Pressable>
          <Text>{quantity}</Text>
          <Pressable onPress={() => setQuantity(quantity + 1)} style={styles.step}><Text>+</Text></Pressable>
        </View>
      </View>
      {product.pairing ? (
        <View style={styles.pairing}>
          <Text variant="eyebrow">Pairing suggestion</Text>
          <Text variant="subtitle" style={styles.pairingTitle}>{product.pairing}</Text>
        </View>
      ) : null}
      <Button
        onPress={() => {
          addItem(product, quantity);
          router.push("/cart");
        }}
      >
        Add to cart
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)"
  },
  category: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  description: {
    marginTop: spacing.md
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  tag: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.055)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  quantityRow: {
    marginVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.055)",
    padding: spacing.sm
  },
  step: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  pairing: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: "rgba(201,164,92,0.09)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.16)"
  },
  pairingTitle: {
    marginTop: spacing.sm
  }
});
