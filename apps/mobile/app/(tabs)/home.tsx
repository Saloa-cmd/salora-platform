import type { ExperienceConfiguration, Product } from "@salora/types";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { BrandHeader } from "@/components/BrandHeader";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experience, setExperience] = useState<ExperienceConfiguration | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const [response, experienceResponse] = await Promise.all([saloraFetch("/api/products"), saloraFetch("/api/experience")]);
        const payload = (await response.json()) as ProductsResponse;
        const experiencePayload = (await experienceResponse.json().catch(() => ({}))) as { data?: ExperienceConfiguration };

        if (!active) {
          return;
        }

        if (!response.ok) {
          setProducts([]);
          setError(payload.error ?? "تعذر تحميل المنتجات الآن.");
          return;
        }

        setProducts(Array.isArray(payload.data) ? payload.data : []);
        if (experienceResponse.ok && experiencePayload.data) setExperience(experiencePayload.data);
      } catch {
        if (active) {
          setProducts([]);
          setError("تعذر الاتصال بالمينيو. حاول مرة أخرى بعد قليل.");
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
      <BrandHeader
        eyebrow="SALORA • TASTE THE HARMONY"
        title={experience?.site.heroTitleAr ?? "لحظتك الأجمل تبدأ برشفة"}
        copy={experience?.site.heroSubtitleAr ?? "قهوة مختصة، ماتشا وحلويات مختارة بروح شاطئ الدهاريز."}
      />
      {experience?.site.showAnnouncement ? <View style={[styles.announcement, { backgroundColor: experience.theme.primaryColor }]}><Text style={styles.announcementText}>{experience.site.announcementAr}</Text></View> : null}
      <View style={[styles.hero, experience ? { backgroundColor: experience.theme.surfaceColor, borderRadius: experience.theme.borderRadius } : null]}>
        <Text variant="eyebrow" style={styles.rtl}>اختيار سالورا اليوم</Text>
        <Text variant="title" style={[styles.heroTitle, styles.rtl]}>ذوقك يقود التجربة</Text>
        <Text variant="muted" style={[styles.heroCopy, styles.rtl]}>اختر مزاجك ودع سالورا تقترح عليك الرشفة والحلوى الأنسب.</Text>
        <View style={styles.featured}>
          <ProductVisual size={122} imageUrl={featured?.visual} alt={featured?.name} />
          <View style={styles.featuredText}>
            <Text variant="eyebrow" style={styles.rtl}>مميز اليوم</Text>
            <Text variant="subtitle">{featured?.name ?? "SALORA Signature"}</Text>
            <Text variant="muted" style={styles.rtl}>{featured?.pairing ? `يناسب معه ${featured.pairing}` : "اختيار يحمل بصمة سالورا"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chips}>
        {["ماتشا", "قهوة مختصة", "حلويات", "مشروبات باردة"].map((chip) => (
          <View key={chip} style={styles.chip}><Text variant="muted">{chip}</Text></View>
        ))}
      </View>

      <View style={styles.grid}>
        <Link href="/concierge" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open SALORA AI Concierge" style={styles.panel}>
            <Text variant="eyebrow">مساعد سالورا</Text>
            <Text variant="subtitle" style={[styles.panelTitle, styles.rtl]}>قل لنا مزاجك</Text>
          </Pressable>
        </Link>
        <Link href="/loyalty" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open SALORA loyalty preview" style={styles.panel}>
            <Text variant="eyebrow">الولاء</Text>
            <Text variant="subtitle" style={[styles.panelTitle, styles.rtl]}>كل رشفة تقرّبك</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/offers" asChild>
        <Button variant="secondary" style={styles.offerButton}>اكتشف عروض سالورا</Button>
      </Link>

      <Text variant="subtitle" style={[styles.sectionTitle, styles.rtl]}>نرشّح لك الآن</Text>
      {loading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="muted">نحضّر لك اختيارات سالورا…</Text>
        </View>
      ) : error ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">المينيو غير متاح مؤقتًا</Text>
          <Text variant="muted">{error}</Text>
        </View>
      ) : recommended.length === 0 ? (
        <View style={styles.statePanel}>
          <Text variant="subtitle">لا توجد منتجات متاحة الآن</Text>
          <Text variant="muted">تابعنا قريبًا لمعرفة الاختيارات الجديدة.</Text>
        </View>
      ) : (
        recommended.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  announcement: { marginTop: spacing.md, padding: spacing.sm, borderRadius: radii.md, alignItems: "center" },
  announcementText: { color: "#050505", fontWeight: "700", textAlign: "center" },
  hero: {
    marginTop: spacing.md,
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
    flex: 1,
    alignItems: "flex-end"
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
  rtl: { textAlign: "right", alignSelf: "stretch" },
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
