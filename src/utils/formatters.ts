import { ProductColor, MarketplaceLinks } from '../types';

/**
 * Format number to Indonesian Rupiah standard format (e.g., Rp35.000)
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rp0';
  }
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Format standard: replace "IDR" or spaces with Rp
  return formatted.replace(/\s+/g, '');
}

/**
 * Format generic number with thousands separator
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Format Firestore timestamp or Date to readable Indonesian date
 */
export function formatDate(timestamp: any): string {
  if (!timestamp) return '-';
  
  let date: Date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date with time
 */
export function formatDateTime(timestamp: any): string {
  if (!timestamp) return '-';
  
  let date: Date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Parse color string format:
 * "Black:#171717:10|Cream:#E8E1D5:7|Moca:#A78C78:5"
 * or "Black:#171717|Cream:#E8E1D5"
 */
export function parseColorString(colorStr: string): ProductColor[] {
  if (!colorStr || !colorStr.trim()) return [];
  
  const segments = colorStr.split('|').map((s) => s.trim()).filter(Boolean);
  const colors: ProductColor[] = [];

  for (const seg of segments) {
    // format: Name:Hex:Stock or Name:Hex
    const parts = seg.split(':').map((p) => p.trim());
    if (parts.length >= 2) {
      const name = parts[0];
      let hex = parts[1];
      if (!hex.startsWith('#')) {
        hex = '#' + hex;
      }
      const stock = parts.length >= 3 ? parseInt(parts[2], 10) || 0 : 0;
      const id = slugify(name) || `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      colors.push({ id, name, hex, stock });
    } else if (parts.length === 1 && parts[0]) {
      const name = parts[0];
      const id = slugify(name);
      colors.push({ id, name, hex: '#A78C78', stock: 0 });
    }
  }

  return colors;
}

/**
 * Convert colors array back to CSV string
 */
export function serializeColorsToString(colors: ProductColor[]): string {
  if (!colors || colors.length === 0) return '';
  return colors
    .map((c) => `${c.name}:${c.hex}:${c.stock ?? 0}`)
    .join('|');
}

/**
 * Parse marketplace links format:
 * "shopee=https://shopee.co.id/...;tokopedia=https://tokopedia.com/...;whatsapp=628123456789"
 * or newlines / comma separated
 */
export function parseLinksString(linkStr: string): MarketplaceLinks {
  if (!linkStr || !linkStr.trim()) return {};
  
  const links: MarketplaceLinks = {};
  const pairs = linkStr.split(/[;\n,]/).map((p) => p.trim()).filter(Boolean);

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const key = pair.slice(0, eqIdx).trim().toLowerCase();
      const val = pair.slice(eqIdx + 1).trim();
      if (val) {
        if (key.includes('shopee')) links.shopee = val;
        else if (key.includes('tokopedia')) links.tokopedia = val;
        else if (key.includes('tiktok')) links.tiktokShop = val;
        else if (key.includes('lazada')) links.lazada = val;
        else if (key.includes('facebook') || key.includes('fb')) links.facebook = val;
        else if (key.includes('wa') || key.includes('whatsapp')) links.whatsapp = val;
        else links.other = val;
      }
    }
  }

  return links;
}

/**
 * Serialize Marketplace links to string
 */
export function serializeLinksToString(links: MarketplaceLinks): string {
  if (!links) return '';
  const entries: string[] = [];
  if (links.shopee) entries.push(`shopee=${links.shopee}`);
  if (links.tokopedia) entries.push(`tokopedia=${links.tokopedia}`);
  if (links.tiktokShop) entries.push(`tiktokShop=${links.tiktokShop}`);
  if (links.lazada) entries.push(`lazada=${links.lazada}`);
  if (links.whatsapp) entries.push(`whatsapp=${links.whatsapp}`);
  if (links.facebook) entries.push(`facebook=${links.facebook}`);
  if (links.other) entries.push(`other=${links.other}`);
  return entries.join(';');
}

/**
 * Validate hex color
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex.trim());
}
