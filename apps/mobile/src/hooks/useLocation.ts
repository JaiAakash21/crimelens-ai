import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
  error?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation({
            latitude: 12.9716,
            longitude: 77.5946,
            error: "Location permission denied. Using default location.",
          });
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
        });
      } catch {
        setLocation({
          latitude: 12.9716,
          longitude: 77.5946,
          error: "Could not fetch location. Using default.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, loading };
}
