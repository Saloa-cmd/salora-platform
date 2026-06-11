import { createOrderDraft, generateWhatsAppMessage, generateWhatsAppUrl } from "@salora/data";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { useCartStore } from "@/store/cart";

type CheckoutValues = {
  name: string;
  phone: string;
  orderType: "Pickup" | "Delivery";
  notes: string;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items } = useCartStore();
  const { control, handleSubmit, watch, setValue } = useForm<CheckoutValues>({
    defaultValues: {
      name: "",
      phone: "",
      orderType: "Pickup",
      notes: ""
    }
  });
  const values = watch();
  const draft = createOrderDraft(values, items);
  const message = generateWhatsAppMessage(draft);
  const canConfirm = items.length > 0 && values.name.trim().length > 1 && values.phone.trim().length > 5;

  const confirm = handleSubmit(() => {
    router.push({ pathname: "/confirmation", params: { message, url: generateWhatsAppUrl(draft) } });
  });

  return (
    <Screen>
      <Text variant="eyebrow">Checkout</Text>
      <Text variant="title" style={styles.title}>Prepare WhatsApp order</Text>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="subtitle">Add a SALORA item first.</Text>
          <Text variant="muted" style={styles.emptyCopy}>Checkout stays ready, but a WhatsApp order needs at least one drink or dessert.</Text>
        </View>
      ) : null}
      <Field name="name" label="Customer name" control={control} placeholder="Your name" />
      <Field name="phone" label="Phone number" control={control} placeholder="+968..." keyboardType="phone-pad" />
      <Text variant="eyebrow" style={styles.label}>Order type</Text>
      <View style={styles.segment}>
        {(["Pickup", "Delivery"] as const).map((type) => (
          <Button key={type} variant={values.orderType === type ? "primary" : "secondary"} style={styles.segmentButton} onPress={() => setValue("orderType", type)}>
            {type}
          </Button>
        ))}
      </View>
      <Field name="notes" label="Notes" control={control} placeholder="Less ice, pickup time, delivery note..." multiline />
      <View style={styles.summary}>
        <Text variant="subtitle">Order summary</Text>
        {items.map((item) => <Text key={item.product.id} variant="muted">- {item.quantity}x {item.product.name}</Text>)}
        <Text variant="price" style={styles.total}>OMR {draft.total.toFixed(3)}</Text>
      </View>
      <View style={styles.preview}>
        <Text variant="eyebrow">WhatsApp preview</Text>
        <Text variant="muted" style={styles.previewText}>{message}</Text>
      </View>
      <Button disabled={!canConfirm} accessibilityLabel="Confirm mock SALORA order" onPress={confirm}>Confirm mock order</Button>
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
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  segmentButton: { flex: 1 },
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
  emptyState: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(231,161,161,0.08)",
    borderWidth: 1,
    borderColor: "rgba(231,161,161,0.22)",
    marginBottom: spacing.lg
  },
  emptyCopy: {
    marginTop: spacing.sm
  }
});
