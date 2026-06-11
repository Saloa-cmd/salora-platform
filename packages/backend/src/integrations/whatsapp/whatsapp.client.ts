import { recordChannelDelivery, recordChannelFailure, recordChannelOutbound } from "../../channels/metrics";
import { assertWhatsAppReady } from "../../channels/whatsapp/config";
import type { WhatsAppClient, WhatsAppClientResult, WhatsAppSendInput } from "./whatsapp.types";

type FetchLike = typeof fetch;

export type WhatsAppCloudClientOptions = {
  fetcher?: FetchLike;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mediaPayload(input: Extract<WhatsAppSendInput, { kind: "media" }>) {
  return {
    messaging_product: "whatsapp",
    to: input.to,
    type: input.mediaType,
    [input.mediaType]: {
      id: input.mediaId,
      link: input.link,
      caption: input.caption,
      filename: input.mediaType === "document" ? input.filename : undefined
    }
  };
}

function payloadFor(input: WhatsAppSendInput) {
  if (input.kind === "text") {
    return {
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: { preview_url: input.previewUrl ?? false, body: input.text }
    };
  }

  if (input.kind === "template") {
    return {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.locale ?? "en" },
        components: input.parameters?.length
          ? [{ type: "body", parameters: input.parameters.map((text) => ({ type: "text", text })) }]
          : undefined
      }
    };
  }

  return mediaPayload(input);
}

export class WhatsAppCloudClient implements WhatsAppClient {
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(options: WhatsAppCloudClientOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.retryAttempts = options.retryAttempts ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 400;
  }

  async send(input: WhatsAppSendInput): Promise<WhatsAppClientResult> {
    const env = assertWhatsAppReady();
    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetcher(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "content-type": "application/json",
            "x-salora-correlation-id": input.correlationId
          },
          body: JSON.stringify(payloadFor(input)),
          signal: controller.signal
        });

        const data = await response.json().catch(() => undefined) as { messages?: Array<{ id?: string }>; error?: { message?: string } } | undefined;
        if (response.ok) {
          recordChannelOutbound("whatsapp");
          recordChannelDelivery("whatsapp", "sent");
          return { status: "sent", providerMessageId: data?.messages?.[0]?.id, response: data };
        }

        lastError = new Error(data?.error?.message ?? `Meta WhatsApp API returned ${response.status}`);
        if (![408, 425, 429, 500, 502, 503, 504].includes(response.status)) break;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }

      if (attempt < this.retryAttempts) await wait(this.retryDelayMs * (attempt + 1));
    }

    recordChannelFailure("whatsapp");
    return {
      status: "failed",
      reason: lastError instanceof Error ? lastError.message : "Unknown WhatsApp Cloud API failure."
    };
  }
}
