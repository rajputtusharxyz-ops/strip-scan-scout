import type { ReferenceConfiguration } from "@/types/referenceConfig";

const PLACEHOLDER = "Educational placeholder — confirm against your strip chart.";

/**
 * Clearly artificial demo values. These are NOT clinical ranges.
 * Replace with a manufacturer-approved, lot-specific configuration with status "validated".
 */
export const demoReferenceConfig: ReferenceConfiguration = {
  id: "cybow-2ac-demo-0",
  status: "demo",
  stripName: "CYBOW 2AC — Demo only",
  pads: [
    {
      id: "pad-a",
      label: "Pad A",
      description: "First reagent pad",
      expectedPosition: "upper",
      levels: [
        { id: "a1", displayName: "Demo level 1", representativeHex: "#F0EBCB", explanatoryText: PLACEHOLDER },
        { id: "a2", displayName: "Demo level 2", representativeHex: "#B9D3C8", explanatoryText: PLACEHOLDER },
        { id: "a3", displayName: "Demo level 3", representativeHex: "#7DA4B5", explanatoryText: PLACEHOLDER },
      ],
    },
    {
      id: "pad-b",
      label: "Pad B",
      description: "Second reagent pad",
      expectedPosition: "lower",
      levels: [
        { id: "b1", displayName: "Demo level 1", representativeHex: "#E8DE9B", explanatoryText: PLACEHOLDER },
        { id: "b2", displayName: "Demo level 2", representativeHex: "#B6C786", explanatoryText: PLACEHOLDER },
        { id: "b3", displayName: "Demo level 3", representativeHex: "#7C9F86", explanatoryText: PLACEHOLDER },
      ],
    },
  ],
};
