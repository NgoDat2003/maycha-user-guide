export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// key: cụm không dấu người dùng gõ; value: các thuật ngữ đích (sẽ được normalize khi so khớp)
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  'quet anh': ['ocr', 'boc tach', 'trich xuat', 'quet'],
  'quet': ['ocr', 'boc tach'],
  'mat coc': ['811', 'phat coc', 'vi pham', 'mat coc', '244'],
  'phat coc': ['811', 'vi pham', 'mat coc'],
  'doi chu nha': ['phu luc', 'thu huong', 'chuyen nhuong', 'beneficiary'],
  'ban nha': ['phu luc', 'thu huong', 'chuyen nhuong'],
  'doi so tai khoan': ['thu huong', 'phu luc', 'beneficiary'],
  'xuat sap': ['batch', 'je', 'but toan', 'sap'],
  'giam gia': ['ho tro', 'pricing', 'bac thang', 'giam gia'],
  'ma quan': ['cost center', 'diem ban', 'ma quan'],
  'ma chu nha': ['cardcode', 'doi tac', 'chu nha'],
};

export function expandQuery(rawQuery: string): string[] {
  const q = normalizeText(rawQuery);
  if (!q) return [];
  const terms = new Set<string>([q]);
  for (const [key, targets] of Object.entries(SEARCH_SYNONYMS)) {
    const nk = normalizeText(key);
    // Chỉ áp dụng nhánh nk.includes(q) khi q đủ dài (≥4 ký tự) để tránh 2 ký tự nở ra toàn bộ từ đồng nghĩa
    if (q.includes(nk) || (nk.includes(q) && q.length >= 4)) {
      targets.forEach((t) => terms.add(normalizeText(t)));
    }
  }
  return [...terms].filter(Boolean);
}

export function matchText(text: string, terms: string[]): boolean {
  if (!text) return false;
  const nt = normalizeText(text);
  return terms.some((t) => nt.includes(t));
}
