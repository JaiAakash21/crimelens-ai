import React from "react";
import { Circle, Marker } from "react-native-maps";
import { Hotspot } from "../../types";
import { colors } from "../../constants";

const RISK_COLORS: Record<string, string> = {
  low: colors.riskLow,
  moderate: colors.riskModerate,
  high: colors.riskHigh,
  critical: colors.riskCritical,
};

const RISK_OPACITY: Record<string, number> = {
  low: 0.15,
  moderate: 0.2,
  high: 0.25,
  critical: 0.3,
};

interface HotspotLayerProps {
  hotspots: Hotspot[];
}

export function HotspotLayer({ hotspots }: HotspotLayerProps) {
  return (
    <>
      {hotspots.map((hotspot) => {
        const color = RISK_COLORS[hotspot.risk_level] ?? colors.riskModerate;
        const opacity = RISK_OPACITY[hotspot.risk_level] ?? 0.2;

        return (
          <React.Fragment key={hotspot.id}>
            <Circle
              center={{
                latitude: hotspot.center_lat,
                longitude: hotspot.center_lng,
              }}
              radius={hotspot.radius_meters}
              fillColor={color + Math.round(opacity * 255).toString(16).padStart(2, "0")}
              strokeColor={color + "60"}
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: hotspot.center_lat,
                longitude: hotspot.center_lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {/* Using a transparent marker to show label */}
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}
