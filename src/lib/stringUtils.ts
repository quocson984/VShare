/**
 * Remove Vietnamese accents from string
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Search string with Vietnamese accent support
 * Returns true if searchTerm is found in text (case-insensitive and accent-insensitive)
 */
export function searchVietnamese(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return true;
  
  const normalizedText = removeVietnameseAccents(text.toLowerCase());
  const normalizedSearch = removeVietnameseAccents(searchTerm.toLowerCase());
  
  return normalizedText.includes(normalizedSearch);
}
