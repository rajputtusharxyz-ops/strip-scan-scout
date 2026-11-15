export const APP_NAME = "ACR Strip Reader";
export const STORAGE_KEY = "acr-strip-reader.history.v1";
/** Fixed preparation timing (seconds). Owner must confirm against the CYBOW 2AC IFU before deployment. */
export const DIP_SECONDS = 10;
export const WAIT_SECONDS = 60;
export const SCAN_STEPS = [
  "Dip the strip in urine for 10 seconds.",
  "Remove the strip and wait 60 seconds.",
  "Place one strip on a plain, light surface.",
  "Keep both pads fully visible and take a photo.",
  "Review your result.",
] as const;
