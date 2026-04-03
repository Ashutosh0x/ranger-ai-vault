import { clsx, type ClassValue } from "clsx";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format number as USD string: $1,234.56 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format decimal as percentage: 0.1234 → "12.34%" */
export function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
