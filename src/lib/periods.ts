/**
 * Generates a list of recent period labels for dropdown selection.
 * Monthly: last 12 months (including current).
 * Weekly:  last 12 weeks (including current).
 */

import { getPeriodLabel } from "@/types";

export function getRecentPeriods(
  type: "weekly" | "monthly",
  count = 12,
): { value: string; label: string }[] {
  const periods: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    let date: Date;

    if (type === "monthly") {
      date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    } else {
      // Step back i * 7 days
      date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    }

    const value = getPeriodLabel(type, date);
    const label = formatPeriodLabel(value);
    // Deduplicate (e.g. weekly can occasionally produce same label)
    if (!periods.find((p) => p.value === value)) {
      periods.push({ value, label });
    }
  }

  return periods;
}

/**
 * Formats a canonical period label into a human-readable string.
 * "2026-07"  → "July 2026"
 * "2026-W27" → "Week 27, 2026"
 */
export function formatPeriodLabel(periodLabel: string): string {
  // Monthly: YYYY-MM
  const monthMatch = periodLabel.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-BD", {
      month: "long",
      year: "numeric",
    });
  }

  // Weekly: YYYY-WNN
  const weekMatch = periodLabel.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    return `Week ${parseInt(weekMatch[2])}, ${weekMatch[1]}`;
  }

  return periodLabel;
}
