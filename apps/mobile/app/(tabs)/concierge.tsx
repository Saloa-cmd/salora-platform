import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";
import { askMobileConcierge, type MobileConciergeResponse } from "@/services/aiConcierge";

const quickReplies = [
  "Something cold and not too sweet",
  "Coffee with dessert",
  "Matcha",
  "A calm evening drink"
];

export default function ConciergeScreen() {
  const [prompt, setPrompt] = useState(quickReplies[0]);
  const [reply, setReply] = useState<MobileConciergeResponse | null>(null);
  const [message, setMessage] = useState("Tell SALORA your mood and I’ll use the published menu to help you choose.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(value = prompt) {
    const normalized = value.trim();
    if (!normalized || loading) return;
    setPrompt(normalized);
    setLoading(true);
    setError(null);
    try {
      const result = await askMobileConcierge(normalized, "en");
      setReply(result);
      setMessage(result.answer);
      if (result.safety.blocked) setError("This request was handled with an additional safety restriction.");
    } catch (cause) {
      setReply(null);
      setError(cause instanceof Error ? cause.message : "SALORA Concierge is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.headingRow}>
        <View>
          <Text variant="eyebrow">SALORA AI · LIVE</Text>
          <Text variant="title" style={styles.title}>Your quiet menu guide</Text>
        </View>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text variant="muted" style={styles.liveText}>Published menu</Text></View>
      </View>

      <View style={styles.chat}>
        <View style={styles.userBubble}><Text>{prompt}</Text></View>
        <View style={styles.botBubble}>
          {loading ? <ActivityIndicator color={colors.goldSoft} /> : <Text variant="muted">{message}</Text>}
          {reply && !loading ? <Text variant="price" style={styles.provider}>{reply.provider.provider} · {reply.provider.model}</Text> : null}
        </View>
      </View>

      {error ? <View style={styles.errorBox}><Text variant="muted">{error}</Text></View> : null}

      <View style={styles.prompts}>
        {quickReplies.map((item) => (
          <Pressable key={item} disabled={loading} accessibilityRole="button" accessibilityLabel={`Ask SALORA for ${item}`} onPress={() => void ask(item)} style={({ pressed }) => [styles.promptChip, pressed && styles.pressed, loading && styles.disabled]}>
            <Text variant="muted">{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={() => void ask()}
          returnKeyType="send"
          editable={!loading}
          maxLength={1000}
          placeholder="Tell SALORA your mood"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable disabled={loading || !prompt.trim()} accessibilityRole="button" accessibilityLabel="Send to SALORA Concierge" onPress={() => void ask()} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed, (loading || !prompt.trim()) && styles.disabled]}>
          <Text style={styles.sendText}>{loading ? "…" : "Ask"}</Text>
        </Pressable>
      </View>

      <Text variant="muted" style={styles.disclaimer}>AI suggestions are advisory. Published availability and prices remain authoritative.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, alignItems: "flex-start" },
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: "rgba(87,211,139,0.2)", paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: "rgba(87,211,139,0.08)" },
  liveDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: "#57D38B" },
  liveText: { fontSize: 10 },
  chat: { gap: spacing.md, marginBottom: spacing.md },
  userBubble: { alignSelf: "flex-end", maxWidth: "82%", borderRadius: radii.md, padding: spacing.md, backgroundColor: "rgba(201,164,92,0.18)" },
  botBubble: { alignSelf: "flex-start", minHeight: 64, minWidth: "72%", maxWidth: "92%", justifyContent: "center", borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.surface },
  provider: { marginTop: spacing.sm, fontSize: 11 },
  errorBox: { marginBottom: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(242,190,82,0.2)", backgroundColor: "rgba(242,190,82,0.08)", padding: spacing.md },
  prompts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  promptChip: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: "rgba(245,239,227,0.1)" },
  composer: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: { flex: 1, minHeight: 52, borderRadius: radii.pill, backgroundColor: "rgba(245,239,227,0.045)", borderWidth: 1, borderColor: "rgba(245,239,227,0.1)", paddingHorizontal: spacing.md, color: colors.cream },
  sendButton: { minHeight: 48, minWidth: 64, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, backgroundColor: colors.gold },
  sendText: { color: "#0B0B0C", fontWeight: "700" },
  disclaimer: { marginTop: spacing.md, fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 }
});
