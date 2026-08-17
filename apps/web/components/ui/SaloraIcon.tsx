import type { LucideProps } from "lucide-react";
import type { SaloraSemanticIconName } from "@salora/types";
import { SALORA_ICON_METADATA, SALORA_ICON_REGISTRY } from "./saloraIconRegistry";

export type SaloraIconName = SaloraSemanticIconName;

export function SaloraIcon({ name, "aria-hidden": ariaHidden, "aria-label": ariaLabel, className = "", ...props }: LucideProps & { name: SaloraIconName }) {
  const Icon = SALORA_ICON_REGISTRY[name];
  const metadata = SALORA_ICON_METADATA[name];
  const decorative = ariaHidden ?? !ariaLabel;
  return <Icon aria-hidden={decorative} aria-label={decorative ? undefined : ariaLabel} role={decorative ? undefined : "img"} data-icon={metadata.semanticName} className={`${metadata.directional ? "salora-icon-directional" : ""} ${className}`.trim()} strokeWidth={1.8} {...props} />;
}
