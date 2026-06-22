import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function capitalize(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    theft: "#3b82f6",
    robbery: "#ef4444",
    harassment: "#a855f7",
    assault: "#dc2626",
    suspicious_activity: "#f59e0b",
    vandalism: "#14b8a6",
    other: "#6b7280",
  };
  return colors[type] ?? colors.other;
}

export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    low: "#22c55e",
    moderate: "#f59e0b",
    high: "#f97316",
    critical: "#ef4444",
  };
  return colors[level] ?? colors.moderate;
}
