// CrimeLens AI Mobile — Theme Colors
export const colors = {
  primary: "#1a1a2e",
  secondary: "#16213e",
  accent: "#0f3460",
  danger: "#e94560",
  success: "#2ecc71",
  warning: "#f39c12",
  background: "#f8f9fa",
  surface: "#ffffff",
  text: "#1a1a2e",
  textSecondary: "#6c757d",
  border: "#dee2e6",
  muted: "#adb5bd",
  white: "#ffffff",
  black: "#000000",

  // Incident type colors
  typeTheft: "#3498db",
  typeRobbery: "#e74c3c",
  typeHarassment: "#9b59b6",
  typeAssault: "#e74c3c",
  typeSuspicious: "#f39c12",
  typeVandalism: "#1abc9c",
  typeOther: "#95a5a6",

  // Risk level colors
  riskLow: "#2ecc71",
  riskModerate: "#f39c12",
  riskHigh: "#e67e22",
  riskCritical: "#e74c3c",
};

export const incidentTypes = [
  { label: "Theft", value: "theft" },
  { label: "Robbery", value: "robbery" },
  { label: "Harassment", value: "harassment" },
  { label: "Assault", value: "assault" },
  { label: "Suspicious Activity", value: "suspicious_activity" },
  { label: "Vandalism", value: "vandalism" },
  { label: "Other", value: "other" },
] as const;

export const API_BASE_URL = __DEV__
  ? "http://localhost:8000/api/v1"
  : "https://api.crimelens.ai/api/v1";

export const MAP_STYLE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const BANGALORE_DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
} as const;
