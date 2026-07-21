import type { ExperienceConfiguration, Product } from "@salora/types";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { BrandHeader } from "@/components/BrandHeader";
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experience, setExperience] = useState<ExperienceConfiguration | null>(null);
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const [active, setActive] = useState<string>("All");
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = active === "All" || product.category === active;
      const searchMatch = !search || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search);
      return categoryMatch && searchMatch;
    });
  }, [active, products, query]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const [response, experienceResponse] = await Promise.all([saloraFetch("/api/products"), saloraFetch("/api/experience")]);
        const payload = (await response.json()) as Product[] | ProductsResponse;
        const experiencePayload = (await experienceResponse.json().catch(() => ({}))) as { data?: ExperienceConfiguration };
        const data = Array.isArray(payload) ? payload : payload.data ?? [];

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setProducts([]);
          setError(Array.isArray(payload) ? "Product API is unavailable." : payload.error ?? "Product API is unavailable.");
          return;
        }

        setProducts(data);
        if (experienceResponse.ok && experiencePayload.data) setExperience(experiencePayload.data);
      } catch {
        if (mounted) {
          setProducts([]);
          setError("تعذر الاتصال بالمينيو. حاول مرة أخرى بعد قليل.");
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
      <BrandHeader eyebrow="مينيو سالورا" title="اختر ما ينسجم مع مزاجك" copy="ابحث وتصفّح اختياراتنا، ثم خصّص طلبك بكل سهولة." />
      {experience?.menu.showSearch !== false ? <View style={[styles.searchReady, experience ? { backgroundColor: experience.theme.surfaceColor, borderRadius: experience.theme.borderRadius } : null]}>
        <TextInput value={query} onChangeText={setQuery} placeholder="ابحث عن مشروب أو حلوى" placeholderTextColor={colors.muted} style={styles.searchInput} textAlign="right" />
      </View> : null}
      {experience?.menu.showCategories !== false ? <View style={styles.filters}>
        {categories.map((category) => (
          <Pressable key={category} onPress={() => setActive(category)} style={[styles.filter, active === category && styles.activeFilter]}>
            <Text style={active === category ? styles.activeText : undefined}>{category === "All" ? "الكل" : category}</Text>
          </Pressable>
        ))}
      </View> : null}
      {loading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="muted">نحمّل مينيو سالورا…</Text>
        </View>
      ) : error ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">المينيو غير متاح مؤقتًا</Text>
          <Text variant="muted">{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">لا توجد نتائج</Text>
          <Text variant="muted">جرّب كلمة بحث أو تصنيفًا مختلفًا.</Text>
        </View>
      ) : (
        filtered.map((product) => <ProductCard key={product.id} product={product} compact={experience?.app.compactCards} showDescription={experience?.menu.showDescriptions} primaryColor={experience?.theme.primaryColor} surfaceColor={experience?.theme.surfaceColor} borderRadius={experience?.theme.borderRadius} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchReady: {
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.05)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchInput: { minHeight: 42, color: colors.cream, fontSize: 15 },
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
