import type { ExperienceConfiguration, MenuAuthoritySection, Product } from "@salora/types";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { saloraFetch } from "@/services/apiClient";
import { loadMenuAuthority, type MobileMenuAuthority } from "@/services/menuAuthority";

export default function HomeScreen() {
  const [authority, setAuthority] = useState<MobileMenuAuthority | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [experience, setExperience] = useState<ExperienceConfiguration | null>(null);

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const [menu, experienceResponse] = await Promise.all([
        loadMenuAuthority(force),
        saloraFetch("/api/experience")
      ]);
      const experiencePayload = await experienceResponse.json().catch(() => ({})) as { data?: ExperienceConfiguration };
      setAuthority(menu);
      setProducts(menu.products);
      if (experienceResponse.ok && experiencePayload.data) setExperience(experiencePayload.data);
    } catch (reason) {
      setProducts([]);
      setError(reason instanceof Error ? reason.message : "تعذر الاتصال بالمينيو. حاول مرة أخرى بعد قليل.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featured = useMemo(() => products.find((product) => product.featured) ?? products[0], [products]);
  const preview = useMemo(() => products.filter((product) => product.featured).slice(0, 2), [products]);
  const recommended = preview.length > 0 ? preview : products.slice(0, 2);
  const visibleSections = useMemo(
    () => (authority?.sections ?? [])
      .filter((section) => products.some((product) => product.sectionKey === section.key))
      .slice(0, 6),
    [authority?.sections, products]
  );

  return (
    <Screen refreshing={refreshing} onRefresh={() => void load(true)}>
      <BrandHeader
        eyebrow="SALORA • TASTE THE HARMONY"
        title={experience?.site.heroTitleAr ?? "لحظتك الأجمل تبدأ برشفة"}
        copy={experience?.site.heroSubtitleAr ?? "قهوة مختصة، ماتشا وحلويات مختارة بروح شاطئ الدهاريز."}
      />

      {authority ? (
        <View style={styles.authority}>
          <Text variant="eyebrow" style={styles.rtl}>
            {authority.offline ? "نسخة محفوظة للعمل دون اتصال" : "منيو منشور ومتزامن"}
          </Text>
          <Text variant="muted" style={styles.rtl}>
            {authority.revision
              ? `Revision v${authority.revision.version} • ${authority.products.length} صنف`
              : "وضع التوافق المؤقت"}
          </Text>
        </View>
      ) : null}

      {experience?.site.showAnnouncement ? (
        <View style={[styles.announcement, { backgroundColor: experience.theme.primaryColor }]}>
          <Text style={styles.announcementText}>{experience.site.announcementAr}</Text>
        </View>
      ) : null}

      <View style={[styles.hero, experience ? { backgroundColor: experience.theme.surfaceColor, borderRadius: experience.theme.borderRadius } : null]}>
        <Text variant="eyebrow" style={styles.rtl}>اختيار سالورا اليوم</Text>
        <Text variant="title" style={[styles.heroTitle, styles.rtl]}>ذوقك يقود التجربة</Text>
        <Text variant="muted" style={[styles.heroCopy, styles.rtl]}>اختر مزاجك ودع سالورا تقترح عليك الرشفة والحلوى الأنسب.</Text>
        <View style={styles.featured}>
          <ProductVisual size={122} imageUrl={featured?.visual} alt={featured?.name} />
          <View style={styles.featuredText}>
            <Text variant="eyebrow" style={styles.rtl}>مميز اليوم</Text>
            <Text variant="subtitle">{featured?.nameAr ?? featured?.name ?? "SALORA Signature"}</Text>
            <Text variant="muted" style={styles.rtl}>
              {featured?.pairing ? `يناسب معه ${featured.pairing}` : "اختيار يحمل بصمة سالورا"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chips}>
        {visibleSections.map((section: MenuAuthoritySection) => (
          <View key={section.key} style={styles.chip}>
            <Text variant="muted">{section.nameAr}</Text>
          </View>
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
          <Text variant="muted">اسحب الشاشة للأسفل لتحديث النسخة المنشورة.</Text>
        </View>
      ) : (
        recommended.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  authority: {
    marginTop: spacing.md,
    gap: spacing.xs,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(201,164,92,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.2)"
  },
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
  heroTitle: { marginTop: spacing.sm },
  heroCopy: { marginTop: spacing.sm },
  featured: { marginTop: spacing.lg, flexDirection: "row", gap: spacing.md, alignItems: "center" },
  featuredText: { flex: 1, alignItems: "flex-end" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.lg },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(245,239,227,0.055)"
  },
  grid: { flexDirection: "row", gap: spacing.md },
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
  panelTitle: { fontSize: 18 },
  offerButton: { marginTop: spacing.lg },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
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
