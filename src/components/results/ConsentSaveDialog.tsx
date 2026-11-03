import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type SaveChoice = "none" | "result-only" | "result-and-photo";
export const DEFAULT_SAVE_CHOICE: SaveChoice = "none";

export function ConsentSaveDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (c: SaveChoice) => void }) {
  const [choice, setChoice] = useState<SaveChoice>(DEFAULT_SAVE_CHOICE);
  const opts: { v: SaveChoice; label: string; hint: string }[] = [
    { v: "none", label: "Don’t save", hint: "Nothing is kept after you leave." },
    { v: "result-only", label: "Save result only", hint: "Date, pad readings and photo quality." },
    { v: "result-and-photo", label: "Save result + photo", hint: "Also keeps a smaller copy of the photo." },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setChoice(DEFAULT_SAVE_CHOICE); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this screening estimate and image on this device?</DialogTitle>
          <DialogDescription>Saved items stay in this browser only. This is not a medical record.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={choice} onValueChange={(v) => setChoice(v as SaveChoice)} className="gap-2" aria-label="Save options">
          {opts.map((o) => (
            <Label key={o.v} htmlFor={`save-${o.v}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary">
              <RadioGroupItem id={`save-${o.v}`} value={o.v} className="mt-0.5" />
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-sm font-normal text-muted-foreground">{o.hint}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onConfirm(choice)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
