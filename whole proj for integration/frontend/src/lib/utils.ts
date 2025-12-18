import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize employee id for comparison.
 * Examples:
 *  - "EMP001" -> "1"
 *  - "001" -> "1"
 *  - 1 -> "1"
 *  - "admin" -> "admin"
 */
export function normalizeEmpId(id?: string | number | null): string | null {
  if (id === undefined || id === null) return null;
  const s = String(id).trim();
  const m = s.match(/(\d+)/);
  if (m) return String(Number(m[0]));
  return s.toLowerCase();
}

export function empIdEquals(
  a?: string | number | null,
  b?: string | number | null
) {
  const na = normalizeEmpId(a);
  const nb = normalizeEmpId(b);
  if (na === null || nb === null) return false;
  return na === nb;
}
