import { STORAGE_KEY } from "@/config/app";
import type { Scan } from "@/types/scan";

/** Local-only storage boundary. Swap for secure storage later without changing screens. */
function read(): Scan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Scan[]) : [];
  } catch {
    return [];
  }
}

function write(scans: Scan[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  window.dispatchEvent(new Event("stripguide-history"));
}

export const localHistory = {
  list: (): Scan[] => read().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  get: (id: string) => read().find((s) => s.id === id),
  save(scan: Scan, consent: "result-only" | "result-and-photo") {
    const record: Scan = { ...scan, savedConsent: consent, image: consent === "result-and-photo" ? scan.image : undefined };
    write([record, ...read().filter((s) => s.id !== scan.id)]);
    return record;
  },
  remove(id: string) {
    write(read().filter((s) => s.id !== id));
  },
  clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("stripguide-history"));
  },
};
