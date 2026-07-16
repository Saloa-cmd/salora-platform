import type { Product, ProductChoice, ProductModifierGroup, SelectedModifier } from "@salora/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { ProductVisual } from "@/components/ProductVisual";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { saloraFetch } from "@/services/apiClient";
import { useCartStore } from "@/store/cart";

type ProductsResponse = {
  data?: Product[];
  runtime?: ProductRuntime;
  error?: string;
};

type ProductRuntime = {
  source?: string;
  stale?: boolean;
  mode?: string;
  databaseHealth?: string;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, ProductChoice>>({});
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      try {
        const response = await saloraFetch("/api/products");
        const payload = (await response.json()) as ProductsResponse;
        const products = Array.isArray(payload.data) ? payload.data : [];
        const found = products.find((item) => item.id === id);

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setProduct(null);
          setError(payload.error ?? "Product API is unavailable.");
          return;
        }

        if (!found) {
          setProduct(null);
          setError("هذا المنتج غير متاح حاليًا.");
          return;
        }

        setProduct(found);
      } catch {
        if (mounted) {
          setProduct(null);
          setError("تعذر الاتصال بالمينيو. حاول مرة أخرى بعد قليل.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.statePanel}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="muted">نحضّر تفاصيل اختيارك…</Text>
        </View>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Text variant="title">المنتج غير متاح</Text>
        <Text variant="muted" style={styles.description}>{error ?? "هذا المنتج غير موجود في المينيو الحالي."}</Text>
      </Screen>
    );
  }

  const groups: ProductModifierGroup[] = [
    ...(product.variants?.length ? [{ id: "variant", name: "الحجم / النوع", required: true, options: product.variants }] : []),
    ...(product.modifierGroups ?? []),
    ...(product.addons?.length ? [{ id: "addons", name: "الإضافات", required: false, options: product.addons }] : [])
  ];
  const modifiers: SelectedModifier[] = Object.entries(selections).map(([groupId, option]) => {
    const group = groups.find((item) => item.id === groupId);
    return { groupId, groupName: group?.name ?? groupId, optionId: option.id, optionName: option.name, priceDelta: option.priceDelta };
  });
  const requiredComplete = groups.filter((group) => group.required).every((group) => selections[group.id]);
  const unitPrice = Number((product.price + modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0)).toFixed(3));

  return (
    <Screen>
      <View style={styles.hero}>
        <ProductVisual size={220} imageUrl={product.visual} alt={product.name} />
      </View>
      <Text variant="eyebrow" style={styles.category}>{product.category}</Text>
      <Text variant="title">{product.name}</Text>
      <Text variant="muted" style={styles.description}>{product.story ?? product.description}</Text>
      <View style={styles.tags}>
        {product.tags.map((tag) => <View key={tag} style={styles.tag}><Text variant="muted">{tag}</Text></View>)}
      </View>
      {groups.map((group) => (
        <View key={group.id} style={styles.optionGroup}>
          <Text variant="eyebrow" style={styles.optionTitle}>{group.name}{group.required ? " *" : ""}</Text>
          <View style={styles.options}>
            {group.options.map((option) => {
              const active = selections[group.id]?.id === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelections((current) => ({ ...current, [group.id]: option }))}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text>{option.name}</Text>
                  {option.priceDelta ? <Text variant="muted">+{option.priceDelta.toFixed(3)}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <View style={styles.quantityRow}>
        <Text variant="price">{unitPrice.toFixed(3)} ر.ع</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.step}><Text>-</Text></Pressable>
          <Text>{quantity}</Text>
          <Pressable onPress={() => setQuantity(quantity + 1)} style={styles.step}><Text>+</Text></Pressable>
        </View>
      </View>
      {product.pairing ? (
        <View style={styles.pairing}>
          <Text variant="eyebrow">اقتراح سالورا</Text>
          <Text variant="subtitle" style={styles.pairingTitle}>{product.pairing}</Text>
        </View>
      ) : null}
      <Button
        disabled={!requiredComplete}
        onPress={() => {
          addItem(product, quantity, modifiers, unitPrice);
          router.push("/cart");
        }}
      >
        {requiredComplete ? "أضف إلى الطلب" : "اختر الخيارات المطلوبة"}
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
  optionGroup: { marginTop: spacing.lg },
  optionTitle: { marginBottom: spacing.sm, textAlign: "right" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: {
    minWidth: 104,
    gap: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.11)",
    backgroundColor: "rgba(245,239,227,0.045)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  optionActive: { borderColor: colors.gold, backgroundColor: "rgba(201,164,92,0.14)" },
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
  },
  statePanel: {
    gap: spacing.sm,
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(245,239,227,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.09)"
  }
});
