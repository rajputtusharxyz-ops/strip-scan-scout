export const APP_NAME = "ACR Strip Reader";
export const STORAGE_KEY = "acr-strip-reader.history.v1";
/** External feedback form. When unset, the feedback link is hidden. */
export const FEEDBACK_URL: string | undefined = (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) || undefined;
/** Fixed preparation timing (seconds). Owner must confirm against the CYBOW 2AC IFU before deployment. */
export const DIP_SECONDS = 10;
export const WAIT_SECONDS = 50;
export const SCAN_STEPS = [
  "Dip the strip in urine for 10 seconds.",
  "Remove the strip and wait 50 seconds.",
  "Place one strip on a plain, light surface.",
  "Keep both pads fully visible and take a photo.",
  "Review your result.",
] as const;
