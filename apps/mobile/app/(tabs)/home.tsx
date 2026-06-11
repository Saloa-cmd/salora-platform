import type { Product } from "@salora/types";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
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

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [runtime, setRuntime] = useState<ProductRuntime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await saloraFetch("/api/products");
        const payload = (await response.json()) as ProductsResponse;

        if (!active) {
          return;
        }

        setRuntime(payload.runtime ?? null);

        if (!response.ok) {
          setProducts([]);
          setError(payload.error ?? "Product API is unavailable.");
          return;
        }

        setProducts(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        if (active) {
          setProducts([]);
          setRuntime({ source: "api", stale: true, mode: "error", databaseHealth: "unavailable" });
          setError("Product API could not be reached.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const featured = useMemo(() => products.find((product) => product.featured) ?? products[0], [products]);
  const preview = useMemo(() => products.filter((product) => product.featured).slice(0, 2), [products]);
  const recommended = preview.length > 0 ? preview : products.slice(0, 2);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text variant="eyebrow">SALORA morning</Text>
        <Text variant="title" style={styles.heroTitle}>Taste guided by intelligence.</Text>
        <Text variant="muted" style={styles.heroCopy}>Matcha, specialty coffee, desserts, and a local AI concierge ready to make the first choice feel effortless.</Text>
        <View style={styles.featured}>
          <ProductVisual size={122} />
          <View style={styles.featuredText}>
            <Text variant="eyebrow">Featured</Text>
            <Text variant="subtitle">{featured?.name ?? "SALORA Signature"}</Text>
            <Text variant="muted">{featured?.pairing ? `Best with ${featured.pairing}` : "Signature SALORA profile"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chips}>
        {["Matcha", "Coffee", "Dessert", "Cold"].map((chip) => (
          <View key={chip} style={styles.chip}><Text variant="muted">{chip}</Text></View>
        ))}
      </View>

      <View style={styles.grid}>
        <Link href="/concierge" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open SALORA AI Concierge" style={styles.panel}>
            <Text variant="eyebrow">AI Concierge</Text>
            <Text variant="subtitle" style={styles.panelTitle}>Tell us your mood.</Text>
          </Pressable>
        </Link>
        <Link href="/loyalty" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open SALORA loyalty preview" style={styles.panel}>
            <Text variant="eyebrow">Loyalty</Text>
            <Text variant="subtitle" style={styles.panelTitle}>VIP preview.</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/offers" asChild>
        <Button variant="secondary" style={styles.offerButton}>View offers</Button>
      </Link>

      <Text variant="subtitle" style={styles.sectionTitle}>Recommended now</Text>
      <View style={styles.runtimePanel}>
        <Text variant="eyebrow">Product API</Text>
        <Text variant="muted">
          Source: {runtime?.source ?? "loading"} | Mode: {runtime?.mode ?? "pending"} | Stale: {runtime?.stale ? "yes" : "no"}
        </Text>
      </View>
      {loading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="muted">Loading live products...</Text>
        </View>
      ) : error ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">Products unavailable</Text>
          <Text variant="muted">{error}</Text>
        </View>
      ) : recommended.length === 0 ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">No products available</Text>
          <Text variant="muted">The live product API returned an empty catalog.</Text>
        </View>
      ) : (
        recommended.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)"
  },
  heroTitle: {
    marginTop: spacing.sm
  },
  heroCopy: {
    marginTop: spacing.sm
  },
  featured: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center"
  },
  featuredText: {
    flex: 1
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(245,239,227,0.055)"
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md
  },
  panel: {
    flex: 1,
    minHeight: 126,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(201,164,92,0.09)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.18)",
    justifyContent: "space-between"
  },
  panelTitle: {
    fontSize: 18
  },
  offerButton: {
    marginTop: spacing.lg
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md
  },
  runtimePanel: {
    gap: 4,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(245,239,227,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.09)"
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
