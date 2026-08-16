export const LINE_COLORS = [
  "#4f46e5", // indigo
  "#059669", // emerald
  "#dc2626", // red
  "#d97706", // amber
  "#0891b2", // cyan
  "#7c3aed", // violet
  "#db2777", // pink
  "#65a30d", // lime
] as const;

export function getLineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length] ?? LINE_COLORS[0];
}
