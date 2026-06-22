import React from "react";
import { Circle } from "react-native-maps";
import { RiskScore } from "../../types";
import { colors } from "../../constants";

const LEVEL_COLORS: Record<string, string> = {
  low: colors.riskLow,
  moderate: colors.riskModerate,
  high: colors.riskHigh,
  critical: colors.riskCritical,
};

const LEVEL_OPACITY: Record<string, number> = {
  low: 0.08,
  moderate: 0.12,
  high: 0.18,
  critical: 0.25,
};

interface RiskScoreLayerProps {
  scores: RiskScore[];
}

export function RiskScoreLayer({ scores }: RiskScoreLayerProps) {
  return (
    <>
      {scores.map((score, index) => {
        const color = LEVEL_COLORS[score.level] ?? colors.riskLow;
        const opacity = LEVEL_OPACITY[score.level] ?? 0.1;

        return (
          <Circle
            key={`risk-${index}`}
            center={{ latitude: score.lat, longitude: score.lng }}
            radius={75}
            fillColor={color + Math.round(opacity * 255).toString(16).padStart(2, "0")}
            strokeColor="transparent"
            strokeWidth={0}
          />
        );
      })}
    </>
  );
}
