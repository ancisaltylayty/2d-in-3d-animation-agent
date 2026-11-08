import React from "react";
import { AbsoluteFill } from "remotion";
import { SahamCaptionOverlay } from "./SahamCaptionOverlay";

export const SahamCaptions: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <SahamCaptionOverlay />
  </AbsoluteFill>
);
