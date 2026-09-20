"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AlertTriangle, Maximize } from "lucide-react";

interface ProctorGuardProps {
  teamId: string;
  roundId: number;
  onViolation?: (type: string, severity: string) => void;
}

const BLOCKED_KEYS = [
  { key: "F12" },
  { key: "I", ctrlKey: true, shiftKey: true },
  { key: "J", ctrlKey: true, shiftKey: true },
  { key: "U", ctrlKey: true },
  { key: "S", ctrlKey: true },
  { key: "P", ctrlKey: true },
  { key: "F5", ctrlKey: true },
  { key: "PrintScreen" },
  { key: "S", metaKey: true, shiftKey: true },
];

function matchesBlockedKey(e: KeyboardEvent): boolean {
  return BLOCKED_KEYS.some((k) => {
    if (k.key && e.key !== k.key) return false;
    if (k.ctrlKey && !e.ctrlKey) return false;
    if (k.shiftKey && !e.shiftKey) return false;
    if (k.metaKey && !e.metaKey) return false;
    return true;
  });
}

export default function ProctorGuard({ teamId, roundId, onViolation }: ProctorGuardProps) {
  const lastSnapshotRef = useRef<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isExitedFullscreen, setIsExitedFullscreen] = useState(false);

  const reportViolation = useCallback(
    async (type: string, metadata?: Record<string, unknown>) => {
      try {
        let snapshotDataUrl: string | null = null;
        const now = Date.now();
        if (now - lastSnapshotRef.current > 30_000 && mediaStreamRef.current) {
          lastSnapshotRef.current = now;
          snapshotDataUrl = await captureScreenSnapshot(mediaStreamRef.current);
        }

        const res = await fetch("/api/violations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            violation_type: type,
            round_id: roundId,
            metadata,
            snapshot_data_url: snapshotDataUrl,
          }),
        });

        const data = await res.json();
        if (data.severity && onViolation) {
          onViolation(type, data.severity);
        }
      } catch (err) {
        console.warn("Failed to report violation:", err);
      }
    },
    [roundId, onViolation]
  );

  // Screen share logic removed to prevent repeated prompt issues

  // Fullscreen change
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsExitedFullscreen(true);
        reportViolation("FULLSCREEN_EXIT", {
          message: "User exited fullscreen mode",
        });
      } else {
        setIsExitedFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [reportViolation]);

  // Visibility change (tab switch / minimize)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        reportViolation("TAB_SWITCH", {
          message: "Tab or window became hidden",
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [reportViolation]);

  // Window blur
  useEffect(() => {
    function handleWindowBlur() {
      reportViolation("WINDOW_BLUR", { message: "Browser window lost focus" });
    }
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [reportViolation]);

  // Clipboard events
  useEffect(() => {
    function handleCopy() {
      reportViolation("COPY_PASTE", { action: "copy", text: window.getSelection()?.toString().substring(0, 100) });
    }
    function handlePaste() {
      reportViolation("COPY_PASTE", { action: "paste" });
    }
    function handleCut() {
      reportViolation("COPY_PASTE", { action: "cut" });
    }
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
    };
  }, [reportViolation]);

  // Blocked key combos
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (matchesBlockedKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        const type = e.key === "PrintScreen" || (e.key === "S" && e.metaKey && e.shiftKey) 
          ? "SCREENSHOT_ATTEMPT" 
          : "BLOCKED_SHORTCUT";
        reportViolation(type, {
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        });
      }
    }
    
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "PrintScreen") {
        reportViolation("SCREENSHOT_ATTEMPT", { key: e.key });
      }
    }
    
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", handleKeyUp, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, [reportViolation]);

  // Right-click context menu & text selection dragging
  useEffect(() => {
    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
      reportViolation("DEVTOOLS_ATTEMPT", { message: "Right-click context menu attempt" });
    }
    function handleSelectStart(e: Event) {
      e.preventDefault();
    }
    function handleDragStart(e: DragEvent) {
      e.preventDefault();
    }
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [reportViolation]);

  // Cleanup media stream
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // UI Overlay if fullscreen is exited
  if (isExitedFullscreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-rose-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fullscreen Exited</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              You must remain in fullscreen mode during the proctored assessment. Exiting fullscreen has been logged as a security violation.
            </p>
          </div>
          <button
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-[0.98]"
          >
            <Maximize size={18} />
            Return to Fullscreen
          </button>
        </div>
      </div>
    );
  }

  return null;
}

async function captureScreenSnapshot(stream: MediaStream): Promise<string | null> {
  try {
    const track = stream.getVideoTracks()[0];
    if (!track || track.readyState === "ended") return null;

    // Use ImageCapture if available for lower overhead
    if ("ImageCapture" in window) {
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement("canvas");
      // Scale down to max 800px width to keep uploads small
      const scale = Math.min(1, 800 / bitmap.width);
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", 0.5);
    }
    return null;
  } catch {
    return null;
  }
}
