import React from "react";
import { AbsoluteFill } from "remotion";
import { DemoCaptionOverlay } from "./DemoCaptionOverlay";

export const DemoCaptionsOnly: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <DemoCaptionOverlay />
  </AbsoluteFill>
);
