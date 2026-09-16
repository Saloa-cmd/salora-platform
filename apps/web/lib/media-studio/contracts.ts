import { z } from "zod";

export const mediaFormatSchema = z.enum(["reel", "story", "feed", "landscape"]);
export const mediaGoalSchema = z.enum(["product", "offer", "launch", "brand"]);

export const storyboardSceneSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  durationSeconds: z.number().min(1).max(12),
  direction: z.string().min(1).max(600),
  assetIds: z.array(z.string()).max(12).default([])
});

export const mediaCampaignDraftSchema = z.object({
  productSlug: z.string().min(1).max(160),
  goal: mediaGoalSchema,
  format: mediaFormatSchema,
  creativeDirection: z.string().min(8).max(2000),
  scenes: z.array(storyboardSceneSchema).min(1).max(12)
});

export const mediaAiDirectorSchema = z.object({
  productSlug: z.string().min(1).max(160),
  goal: mediaGoalSchema,
  format: mediaFormatSchema,
  creativeDirection: z.string().min(8).max(2000),
  locale: z.enum(["ar", "en"]).default("ar")
});

export type MediaCampaignDraft = z.infer<typeof mediaCampaignDraftSchema>;
export type StoryboardScene = z.infer<typeof storyboardSceneSchema>;

export type MediaAssetReference = {
  id: string;
  publicUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
};

export type RenderJob = {
  id: string;
  state: "DRAFT" | "QUEUED" | "RENDERING" | "REVIEW" | "APPROVED" | "REJECTED" | "FAILED" | "FINAL_RENDERED";
  productSlug: string;
  format: z.infer<typeof mediaFormatSchema>;
  sceneCount: number;
  durationSeconds: number;
  compositionId: "SaloraProductPreview";
  createdAt: string;
};
