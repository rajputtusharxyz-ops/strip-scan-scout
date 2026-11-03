import { demoReferenceConfig } from "@/data/demoReferenceConfig";
import type { ReferenceConfiguration } from "@/types/referenceConfig";

/** Single entry point so a validated, audited configuration can replace the demo later. */
export function getActiveConfiguration(): ReferenceConfiguration {
  return demoReferenceConfig;
}

export function getConfigurationById(id: string): ReferenceConfiguration | undefined {
  return id === demoReferenceConfig.id ? demoReferenceConfig : undefined;
}

export function configurationStatusLabel(config: Pick<ReferenceConfiguration, "status">): string {
  return config.status === "validated"
    ? "Validated configuration"
    : "Demo configuration — not validated for clinical use.";
}
