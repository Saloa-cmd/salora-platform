import { useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

const steps = [
  { id: "received", title: "تم استلام الطلب", copy: "تم التحقق من الأسعار والتوفر وحفظ طلبك في سالورا." },
  { id: "confirm", title: "تأكيد واتساب", copy: "أرسل ملخص الطلب إلى فريق سالورا لتأكيد وقت الاستلام." },
  { id: "preparing", title: "قيد التحضير", copy: "سيؤكد الفريق بدء تحضير طلبك عبر واتساب." }
];

export default function ConfirmationScreen() {
  const { orderId, status, message, url } = useLocalSearchParams<{ orderId?: string; status?: string; message?: string; url?: string }>();

  return (
    <Screen>
      <Text variant="eyebrow" style={styles.rtl}>تم تسجيل طلبك</Text>
      <Text variant="title" style={[styles.title, styles.rtl]}>لحظتك مع سالورا بدأت</Text>
      <View style={styles.orderMeta}>
        <Text variant="muted">رقم الطلب</Text>
        <Text variant="price">{orderId ?? "—"}</Text>
        <Text variant="muted">{status ?? "PENDING_CONFIRMATION"}</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.step}>
            <View style={[styles.dot, index === 0 && styles.activeDot]} />
            <View style={styles.stepCopy}>
              <Text variant="subtitle" style={styles.rtl}>{step.title}</Text>
              <Text variant="muted" style={styles.rtl}>{step.copy}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text variant="eyebrow" style={styles.rtl}>ملخص واتساب</Text>
        <Text variant="muted" style={[styles.message, styles.rtl]}>{message || "تم حفظ الطلب، لكن تعذر إنشاء ملخص واتساب."}</Text>
        {url ? <Button style={styles.action} onPress={() => void Linking.openURL(url)}>أرسل الطلب إلى واتساب</Button> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  rtl: { textAlign: "right", alignSelf: "stretch" },
  orderMeta: {
    alignItems: "flex-end",
    gap: spacing.xs,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(201,164,92,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.22)"
  },
  timeline: {
    gap: spacing.lg,
    marginBottom: spacing.lg
  },
  step: {
    flexDirection: "row-reverse",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  stepCopy: { flex: 1, alignItems: "flex-end", gap: spacing.xs },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.muted,
    marginTop: 5
  },
  activeDot: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)"
  },
  message: { marginTop: spacing.md },
  action: { marginTop: spacing.lg }
});
