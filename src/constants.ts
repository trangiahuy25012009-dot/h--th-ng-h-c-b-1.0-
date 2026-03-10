export const LEVEL_NAMES = [
  "Học Tra", "Học Giả", "Học Mướn", "Học Cụ", "Học Miệt",
  "Học Bá", "Học Quái", "Học Thánh", "Học Đế", "Học Thần"
];

export function getLevelName(level: number): string {
  // Map level 1-10 to index 0-9. Handle 0 just in case.
  const index = Math.max(0, Math.min(level - 1, 9));
  return LEVEL_NAMES[index] || "Học Thần";
}
