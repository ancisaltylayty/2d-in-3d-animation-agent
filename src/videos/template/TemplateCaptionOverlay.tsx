import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import captionChunks from "./caption_chunks.json";

export interface CaptionChunk {
  text: string;
  start: number;
  end: number;
}

export const SahamCaptionOverlay: React.FC<{ bg?: string }> = ({ bg }) => {
  const f = useCurrentFrame();
  const time = f / 30;

  // Find active chunk (give a tiny 0.04s tail so it doesn't flicker between micro-gaps)
  const activeChunk = (captionChunks as CaptionChunk[]).find(
    (c) => time >= c.start && time < c.end + 0.04
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg || "transparent",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 520,
        pointerEvents: "none",
        zIndex: 999,
      }}
    >
      {activeChunk && (
        <span
          style={{
            fontFamily:
              "'Poppins', 'Montserrat', 'Segoe UI', 'Arial Rounded MT Bold', sans-serif",
            fontWeight: 900,
            fontSize: 68,
            lineHeight: 1.15,
            color: "#ffffff",
            WebkitTextStroke: "7px #000000",
            paintOrder: "stroke fill",
            textShadow: "0 6px 16px rgba(0,0,0,0.65)",
            letterSpacing: "0.5px",
            textAlign: "center",
            maxWidth: "85%",
            transform: (() => {
              const elapsed = Math.max(0, time - activeChunk.start);
              const popProgress = Math.min(1, elapsed / 0.08);
              const popScale = 1 + 0.12 * Math.pow(1 - popProgress, 2);
              return `scale(${popScale.toFixed(3)})`;
            })(),
            display: "inline-block",
          }}
        >
          {activeChunk.text}
        </span>
      )}
    </AbsoluteFill>
  );
};
