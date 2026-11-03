export type PadId = "pad-a" | "pad-b";

export type ReferenceLevel = {
  id: string;
  displayName: string;
  representativeHex: string;
  explanatoryText: string;
};

export type ReferencePad = {
  id: PadId;
  label: string;
  description: string;
  expectedPosition: "upper" | "lower";
  levels: ReferenceLevel[];
};

export type ReferenceConfiguration = {
  id: string;
  status: "demo" | "validated";
  stripName: string;
  lotNumber?: string;
  pads: ReferencePad[];
};
