import type { ChannelName, ChannelProvider } from "./provider";
import { WhatsAppChannelProvider } from "./whatsapp/provider";

const providers = new Map<ChannelName, ChannelProvider>([
  ["whatsapp", new WhatsAppChannelProvider()]
]);

export function registerChannelProvider(provider: ChannelProvider): void {
  providers.set(provider.channel, provider);
}

export function getChannelProvider(channel: ChannelName): ChannelProvider | undefined {
  return providers.get(channel);
}

export function listChannelProviders(): ChannelName[] {
  return [...providers.keys()];
}
