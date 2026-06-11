import { products, recommendFromPrompt } from "@salora/data";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

export default function ConciergeScreen() {
  const [prompt, setPrompt] = useState("I want something cold");
  const reply = recommendFromPrompt(prompt);
  const suggestions = products.filter((product) => reply.productIds.includes(product.id));
  const quickReplies = reply.quickReplies ?? ["cold", "sweet", "light", "dessert pairing", "matcha"];

  return (
    <Screen>
      <Text variant="eyebrow">AI Concierge</Text>
      <Text variant="title" style={styles.title}>Your quiet menu guide</Text>
      <View style={styles.chat}>
        <View style={styles.userBubble}><Text>{prompt}</Text></View>
        <View style={styles.botBubble}>
          <View style={styles.typing}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Text variant="muted">{reply.message}</Text>
          {reply.pairing ? <Text variant="price" style={styles.pairing}>{reply.pairing}</Text> : null}
        </View>
      </View>
      <View style={styles.prompts}>
        {quickReplies.map((item) => (
          <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Ask for ${item}`} onPress={() => setPrompt(item)} style={styles.promptChip}>
            <Text variant="muted">{item}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={prompt} onChangeText={setPrompt} placeholder="Tell SALORA your mood" placeholderTextColor={colors.muted} style={styles.input} />
      <Text variant="subtitle" style={styles.resultsTitle}>Suggestions</Text>
      {suggestions.length ? suggestions.map((product) => <ProductCard key={product.id} product={product} />) : <Text variant="muted">Try cold, sweet, light, matcha, or dessert pairing.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  chat: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: "rgba(201,164,92,0.18)"
  },
  botBubble: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  typing: {
    flexDirection: "row",
    gap: 5,
    marginBottom: spacing.sm
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.goldSoft,
    opacity: 0.75
  },
  pairing: {
    marginTop: spacing.sm
  },
  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  promptChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)"
  },
  input: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: "rgba(245,239,227,0.045)",
    borderWidth: 1,
    borderColor: "rgba(245,239,227,0.1)",
    paddingHorizontal: spacing.md,
    color: colors.cream
  },
  resultsTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md
  }
});
