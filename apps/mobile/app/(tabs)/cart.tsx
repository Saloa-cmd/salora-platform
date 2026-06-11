import { calculateSubtotal, formatOmr } from "@salora/data";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { ProductVisual } from "@/components/ProductVisual";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { useCartStore } from "@/store/cart";

export default function CartScreen() {
  const { items, removeItem, setQuantity } = useCartStore();
  const subtotal = calculateSubtotal(items);

  return (
    <Screen>
      <Text variant="eyebrow">Cart</Text>
      <Text variant="title" style={styles.title}>Your SALORA order</Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="subtitle">Your cart is calm.</Text>
          <Text variant="muted" style={styles.emptyCopy}>Add a matcha, coffee, or dessert to prepare a WhatsApp-ready order.</Text>
          <Link href="/menu" asChild><Button>Browse menu</Button></Link>
        </View>
      ) : (
        <>
          {items.map((item) => (
            <View key={item.product.id} style={styles.item}>
              <ProductVisual size={74} />
              <View style={styles.itemBody}>
                <Text variant="subtitle" style={styles.itemTitle}>{item.product.name}</Text>
                <Text variant="price">OMR {(item.product.price * item.quantity).toFixed(3)}</Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => setQuantity(item.product.id, item.quantity - 1)} style={styles.smallButton}><Text>-</Text></Pressable>
                  <Text>{item.quantity}</Text>
                  <Pressable onPress={() => setQuantity(item.product.id, item.quantity + 1)} style={styles.smallButton}><Text>+</Text></Pressable>
                  <Pressable onPress={() => removeItem(item.product.id)}><Text variant="muted">Remove</Text></Pressable>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.total}>
            <Text variant="subtitle">Subtotal</Text>
            <Text variant="price">{formatOmr(subtotal)}</Text>
          </View>
          <Link href="/checkout" asChild><Button>Checkout</Button></Link>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  empty: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface
  },
  emptyCopy: {
    marginBottom: spacing.md
  },
  item: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(245,239,227,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.09)",
    marginBottom: spacing.md
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 18 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm
  },
  smallButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.06)"
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.lg
  }
});
