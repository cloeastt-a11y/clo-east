import { StockTransaction } from '../types';
import { formatDateTime } from './formatters';

/**
 * Escapes a cell value for standard CSV format (RFC 4180)
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If string contains comma, double quote, newline, or carriage return, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts a list of StockTransactions into a formatted CSV string and triggers browser file download.
 * Includes UTF-8 BOM so Excel opens it with proper character encoding.
 */
export function exportTransactionsToCsv(
  transactions: StockTransaction[],
  customFilename?: string
): { success: boolean; count: number; filename: string } {
  const headers = [
    'ID Transaksi',
    'Tanggal & Waktu',
    'ID Produk',
    'Nama Produk',
    'Kategori',
    'ID Warna',
    'Varian Warna',
    'Tipe Transaksi',
    'Jumlah (Qty)',
    'Stok Sebelum',
    'Stok Sesudah',
    'Harga Jual Satuan (IDR)',
    'HPP Satuan (IDR)',
    'Total Omset / Revenue (IDR)',
    'Laba Kotor (IDR)',
    'Laba Bersih (IDR)',
    'Catatan / Keterangan',
    'Admin Pembuat',
    'ID Batch Sesi',
  ];

  const rows = transactions.map((t) => {
    const typeLabel =
      t.type === 'SALE'
        ? 'PENJUALAN (SOLD)'
        : t.type === 'ADD'
        ? 'RESTOCK MASUK'
        : 'PENYESUAIAN OPNAME';

    return [
      escapeCsvCell(t.id),
      escapeCsvCell(formatDateTime(t.createdAt)),
      escapeCsvCell(t.productId),
      escapeCsvCell(t.productName),
      escapeCsvCell(t.categoryName || '-'),
      escapeCsvCell(t.colorId || '-'),
      escapeCsvCell(t.colorName || '-'),
      escapeCsvCell(typeLabel),
      escapeCsvCell(t.quantity),
      escapeCsvCell(t.previousStock ?? '-'),
      escapeCsvCell(t.newStock ?? '-'),
      escapeCsvCell(t.price || 0),
      escapeCsvCell(t.hpp || 0),
      escapeCsvCell(t.revenue || 0),
      escapeCsvCell(t.grossProfit || 0),
      escapeCsvCell(t.netProfit || 0),
      escapeCsvCell(t.note || '-'),
      escapeCsvCell(t.createdByName || 'Admin'),
      escapeCsvCell(t.batchId || '-'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
  const defaultFilename = `CLOEAST_Riwayat_Transaksi_Stok_${dateStr}_${timeStr}.csv`;
  const filename = customFilename || defaultFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    count: transactions.length,
    filename,
  };
}
