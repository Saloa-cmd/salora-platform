import { createOrderDraft, generateWhatsAppMessage, generateWhatsAppUrl } from "@salora/data";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { saloraFetch } from "@/services/apiClient";
import { useCartStore } from "@/store/cart";

type CheckoutValues = {
  name: string;
  phone: string;
  orderType: "Counter" | "Car" | "DineIn" | "Gift";
  notes: string;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, watch, setValue } = useForm<CheckoutValues>({
    defaultValues: {
      name: "",
      phone: "",
      orderType: "Counter",
      notes: ""
    }
  });
  const values = watch();
  const draft = createOrderDraft(values, items);
  const message = generateWhatsAppMessage(draft);
  const canConfirm = items.length > 0 && values.name.trim().length > 1 && values.phone.trim().length > 5;

  const confirm = handleSubmit(async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await saloraFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: values.name.trim(),
          customerPhone: values.phone.trim(),
          notes: [values.orderType, values.notes].filter(Boolean).join(" | "),
          items: items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price
          }))
        })
      });
      const payload = (await response.json()) as { data?: { id?: string; status?: string; total?: string | number }; error?: string };

      if (!response.ok || !payload.data?.id) {
        setSubmitError(payload.error ?? "Live order API is unavailable.");
        return;
      }

      clear();
      router.push({
        pathname: "/confirmation",
        params: {
          orderId: payload.data.id,
          status: payload.data.status ?? "PENDING_CONFIRMATION",
          message,
          url: generateWhatsAppUrl(draft)
        }
      });
    } catch {
      setSubmitError("Live order API could not be reached. Checkout is blocked until backend ordering is available.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <Text variant="eyebrow" style={styles.rtl}>إتمام الطلب</Text>
      <Text variant="title" style={[styles.title, styles.rtl]}>أكد لحظتك مع سالورا</Text>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="subtitle">أضف منتجًا أولًا</Text>
          <Text variant="muted" style={styles.emptyCopy}>اختر مشروبك أو حلوى سالورا ثم عد لإكمال الطلب.</Text>
        </View>
      ) : null}
      <Field name="name" label="الاسم" control={control} placeholder="اكتب اسمك" />
      <Field name="phone" label="رقم الهاتف" control={control} placeholder="+968..." keyboardType="phone-pad" />
      <Text variant="eyebrow" style={[styles.label, styles.rtl]}>طريقة الاستلام</Text>
      <View style={styles.segment}>
        {(["Counter", "Car", "DineIn", "Gift"] as const).map((type) => (
          <Button key={type} variant={values.orderType === type ? "primary" : "secondary"} style={styles.segmentButton} onPress={() => setValue("orderType", type)}>
            {{ Counter: "الكاونتر", Car: "السيارة", DineIn: "داخل سالورا", Gift: "هدية" }[type]}
          </Button>
        ))}
      </View>
      <Field name="notes" label="ملاحظات" control={control} placeholder="الثلج، السكر، السيارة أو وقت الاستلام…" multiline />
      <View style={styles.summary}>
        <Text variant="subtitle" style={styles.rtl}>ملخص الطلب</Text>
        {items.map((item) => <Text key={item.product.id} variant="muted">- {item.quantity}x {item.product.name}</Text>)}
        <Text variant="price" style={styles.total}>{draft.total.toFixed(3)} ر.ع</Text>
      </View>
      <View style={styles.preview}>
        <Text variant="eyebrow" style={styles.rtl}>رسالة واتساب</Text>
        <Text variant="muted" style={styles.previewText}>{message}</Text>
      </View>
      {submitError ? (
        <View style={styles.errorState}>
          <Text variant="subtitle">تعذر إنشاء الطلب</Text>
          <Text variant="muted">{submitError}</Text>
        </View>
      ) : null}
      <Button disabled={!canConfirm || submitting} accessibilityLabel="Create live SALORA COD order" onPress={confirm}>
        {submitting ? "جارٍ إنشاء الطلب…" : "تأكيد الطلب"}
      </Button>
    </Screen>
  );
}

function Field({
  name,
  label,
  control,
  placeholder,
  keyboardType,
  multiline
}: {
  name: keyof CheckoutValues;
  label: string;
  control: ReturnType<typeof useForm<CheckoutValues>>["control"];
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text variant="eyebrow" style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={String(value)}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            keyboardType={keyboardType}
            multiline={multiline}
            style={[styles.input, multiline && styles.textarea]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.11)",
    backgroundColor: "rgba(245,239,227,0.045)",
    paddingHorizontal: spacing.md,
    color: colors.cream,
    fontSize: 15
  },
  textarea: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  segmentButton: { width: "48%" },
  summary: {
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md
  },
  total: { marginTop: spacing.sm },
  preview: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(201,164,92,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,164,92,0.16)",
    marginBottom: spacing.lg
  },
  previewText: {
    marginTop: spacing.sm
  },
  errorState: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(231,161,161,0.08)",
    borderWidth: 1,
    borderColor: "rgba(231,161,161,0.22)",
    marginBottom: spacing.lg
  },
  emptyState: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(231,161,161,0.08)",
    borderWidth: 1,
    borderColor: "rgba(231,161,161,0.22)",
    marginBottom: spacing.lg
  },
  emptyCopy: {
    marginTop: spacing.sm,
    textAlign: "right"
  },
  rtl: { textAlign: "right", alignSelf: "stretch" }
});
