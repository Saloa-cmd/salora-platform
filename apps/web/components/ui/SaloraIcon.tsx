import type { LucideProps } from "lucide-react";
import type { SaloraSemanticIconName } from "@salora/types";
import { SALORA_ICON_REGISTRY } from "./saloraIconRegistry";

export type SaloraIconName = SaloraSemanticIconName;

export function SaloraIcon({ name, "aria-hidden": ariaHidden = true, ...props }: LucideProps & { name: SaloraIconName }) {
  const Icon = SALORA_ICON_REGISTRY[name];
  return <Icon aria-hidden={ariaHidden} strokeWidth={1.8} {...props} />;
}
