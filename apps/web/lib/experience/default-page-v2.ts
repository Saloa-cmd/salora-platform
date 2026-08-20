import type { ExperiencePageV2 } from "@salora/types";
import { adaptExperienceConfigurationV1 } from "./compatibility";
import { defaultExperienceConfiguration } from "./config";

export const EXPERIENCE_PAGE_V2_DRAFT_KEY = "salora_experience_page_v2_homepage_draft";
export const defaultExperiencePageV2: ExperiencePageV2 = adaptExperienceConfigurationV1(defaultExperienceConfiguration, "25f30000-0000-4000-8000-000000000003");
