import type { Product } from "@salora/types";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { saloraFetch } from "@/services/apiClient";

type ProductRuntime = {
  source?: string;
  stale?: boolean;
  mode?: string;
  databaseHealth?: string;
};

type ProductsResponse = {
  data?: Product[];
  runtime?: ProductRuntime;
  error?: string;
};

export default function MenuScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [runtime, setRuntime] = useState<ProductRuntime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const [active, setActive] = useState<string>("All");
  const filtered = useMemo(() => products.filter((product) => active === "All" || product.category === active), [active, products]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await saloraFetch("/api/products");
        const payload = (await response.json()) as Product[] | ProductsResponse;
        const data = Array.isArray(payload) ? payload : payload.data ?? [];

        if (!mounted) {
          return;
        }

        setRuntime(Array.isArray(payload) ? { source: "api", stale: false, mode: "live" } : payload.runtime ?? null);

        if (!response.ok) {
          setProducts([]);
          setError(Array.isArray(payload) ? "Product API is unavailable." : payload.error ?? "Product API is unavailable.");
          return;
        }

        setProducts(data);
      } catch {
        if (mounted) {
          setProducts([]);
          setRuntime({ source: "api", stale: true, mode: "error", databaseHealth: "unavailable" });
          setError("Product API could not be reached.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!categories.includes(active)) {
      setActive("All");
    }
  }, [active, categories]);

  return (
    <Screen>
      <Text variant="eyebrow">Menu</Text>
      <Text variant="title" style={styles.title}>Signature list</Text>
      <View style={styles.searchReady}>
        <Text variant="muted">
          Source: {runtime?.source ?? "loading"} | Mode: {runtime?.mode ?? "pending"} | Stale: {runtime?.stale ? "yes" : "no"}
        </Text>
      </View>
      <View style={styles.filters}>
        {categories.map((category) => (
          <Pressable key={category} onPress={() => setActive(category)} style={[styles.filter, active === category && styles.activeFilter]}>
            <Text style={active === category ? styles.activeText : undefined}>{category}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="muted">Loading live menu...</Text>
        </View>
      ) : error ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">Menu unavailable</Text>
          <Text variant="muted">{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">No products available</Text>
          <Text variant="muted">The live product API returned an empty catalog.</Text>
        </View>
      ) : (
        filtered.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  searchReady: {
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.05)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  filter: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeFilter: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  },
  activeText: {
    color: colors.background,
    fontWeight: "700"
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
