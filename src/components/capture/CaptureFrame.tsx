import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImageUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/States";
import { readFileAsDataUrl } from "@/lib/image";

type CamState = "idle" | "starting" | "live" | "denied" | "unsupported";

export function CaptureFrame({ onCapture }: { onCapture: (image: string, source: "camera" | "upload") => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cam, setCam] = useState<CamState>("idle");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [canSwitch, setCanSwitch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  async function start(mode = facing) {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCam("unsupported"); return; }
    setCam("starting");
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
      setCam("live");
    } catch (e) {
      setCam((e as DOMException)?.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }

  function snap() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    stop();
    onCapture(c.toDataURL("image/jpeg", 0.92), "camera");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG, PNG, WebP or HEIC)."); return; }
    try { stop(); onCapture(await readFileAsDataUrl(file), "upload"); }
    catch (err) { setError((err as Error).message); }
  }

  return (
    <div className="space-y-5">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-xl border bg-card">
        <video ref={videoRef} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${cam === "live" ? "" : "hidden"}`} aria-label="Camera preview" />
        {cam !== "live" && (
          <div className="absolute inset-0 grid place-items-center bg-muted">
            {cam === "starting" ? <p className="text-muted-foreground" role="status">Opening camera…</p> : null}
          </div>
        )}
        {/* Alignment guide: small, thin, upper-middle; outline only so it never covers real pads */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[8%] flex justify-center">
          <div className="h-[16rem] max-h-[60%] w-10 rounded border border-dashed border-card/80" />
        </div>
      </div>

      <p className="text-center text-muted-foreground" aria-live="polite">
        Keep both pads fully visible and in focus.
      </p>

      {cam === "denied" && (
        <ErrorState icon={CameraOff} title="Camera access is off">
          You can allow it in your browser settings, or upload a photo instead.
        </ErrorState>
      )}
      {cam === "unsupported" && (
        <ErrorState icon={CameraOff} title="The camera is not available here">
          This browser or device did not open a camera. Upload a photo instead.
        </ErrorState>
      )}
      {error && <ErrorState icon={ImageUp} title="That file could not be used">{error}</ErrorState>}

      <div className="mx-auto flex max-w-md flex-col gap-2.5">
        {cam === "live" ? (
          <>
            <Button size="lg" onClick={snap}><Camera strokeWidth={1.5} /> Take photo</Button>
            {canSwitch && (
              <Button variant="outline" onClick={() => { const n = facing === "environment" ? "user" : "environment"; setFacing(n); start(n); }}>
                <RefreshCw strokeWidth={1.5} /> Switch camera
              </Button>
            )}
          </>
        ) : (
          <Button size="lg" onClick={() => start()} disabled={cam === "starting"}><Camera strokeWidth={1.5} /> {cam === "denied" ? "Try camera again" : "Open camera"}</Button>
        )}
        <Button variant="outline" size="lg" onClick={() => fileRef.current?.click()}>
          <ImageUp strokeWidth={1.5} /> Upload photo
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload a photo of one strip" onChange={onFile} tabIndex={-1} />
        <p className="text-center text-sm text-muted-foreground">Your photo is sent securely for analysis and is not saved.</p>
      </div>
    </div>
  );
}
