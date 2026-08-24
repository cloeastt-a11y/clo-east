import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  ArrowLeft,
  Layers,
  Save,
} from 'lucide-react';
import { Product, CSVProductRow } from '../../types';
import { createBulkProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { parseColorString, parseLinksString, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface AdminCSVImportPageProps {
  onBack: () => void;
  onImportComplete: () => void;
}

export const AdminCSVImportPage: React.FC<AdminCSVImportPageProps> = ({
  onBack,
  onImportComplete,
}) => {
  const { adminUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,Category,Price,HPP,Stock,Colors,Links,Description\n' +
      'Paris Jadul,Paris,35000,22000,20,"Black:#171717:10|Cream:#E8E1D5:7|Moca:#A78C78:3","shopee=https://shopee.co.id;tokopedia=https://tokopedia.com;whatsapp=628123456789","Koleksi Paris Jadul legendaris tegak di dahi dan lembut."\n' +
      'Pashmina Silk Premium,Pashmina,55000,32000,15,"Nude:#D2B48C:5|Champagne:#F7E7CE:5|Navy:#000080:5","shopee=https://shopee.co.id;whatsapp=628123456789","Pashmina silk premium dengan kilau mewah."\n' +
      'Segi Empat Voal Motif,Segi Empat,45000,28000,12,"Sage:#9CAF88:6|Dusty Pink:#DCAE96:6","tokopedia=https://tokopedia.com","Hijab segi empat motif minimalis editorial."\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'CLO_EAST_Product_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file selection and parsing
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setImportResult(null);
    setIsParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CSVProductRow[] = [];

        results.data.forEach((row: any, idx: number) => {
          // Normalize keys
          const name = (row.Name || row.name || row['Nama Produk'] || '').trim();
          const category = (row.Category || row.category || row['Kategori'] || '').trim();
          const priceRaw = row.Price || row.price || row['Harga Jual'] || '0';
          const hppRaw = row.HPP || row.hpp || row['Harga Modal'] || '0';
          const stockRaw = row.Stock || row.stock || row['Stok'] || '0';
          const colorsRaw = (row.Colors || row.colors || row['Warna'] || '').trim();
          const linksRaw = (row.Links || row.links || row['Marketplace'] || '').trim();
          const description = (row.Description || row.description || row['Deskripsi'] || '').trim();

          const price = parseFloat(priceRaw.toString().replace(/[^0-9.]/g, '')) || 0;
          const hpp = parseFloat(hppRaw.toString().replace(/[^0-9.]/g, '')) || 0;
          const fallbackStock = parseInt(stockRaw.toString().replace(/[^0-9]/g, ''), 10) || 0;

          const validationErrors: string[] = [];

          if (!name) validationErrors.push('Nama produk kosong.');
          if (price <= 0) validationErrors.push('Harga jual harus > 0.');
          if (hpp <= 0) validationErrors.push('HPP modal harus > 0.');

          const parsedColors = parseColorString(colorsRaw);
          const parsedLinks = parseLinksString(linksRaw);

          rows.push({
            name,
            category: category || 'Paris',
            price,
            hpp,
            stock: parsedColors.length > 0
              ? parsedColors.reduce((sum, c) => sum + (c.stock || 0), 0)
              : fallbackStock,
            colors: colorsRaw,
            links: linksRaw,
            description,
            isValid: validationErrors.length === 0,
            validationErrors,
            parsedColors,
            parsedLinks,
          });
        });

        setParsedRows(rows);
        setIsParsing(false);
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        setErrorMsg(`Gagal membaca file CSV: ${err.message}`);
        setIsParsing(false);
      },
    });
  };

  // Perform Firestore Batch Import
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada baris valid yang dapat diimpor.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    try {
      const categories = await getCategories();
      const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

      const productsToCreate = validRows.map((r) => {
        const matchedCat = catMap.get(r.category.toLowerCase());
        const categoryId = matchedCat?.id || 'paris';
        const categoryName = matchedCat?.name || r.category;

        return {
          name: r.name,
          slug: '',
          categoryId,
          categoryName,
          price: r.price,
          hpp: r.hpp,
          stock: r.stock || 0,
          status: (r.stock || 0) > 0 ? ('AVAILABLE' as const) : ('OUT_OF_STOCK' as const),
          colors: r.parsedColors,
          links: r.parsedLinks,
          description: r.description || '',
          imageUrl: '',
          imagePath: '',
        };
      });

      const created = await createBulkProducts(productsToCreate, userUid, userName);
      setImportResult({ count: created.length });
      setIsImporting(false);

      setTimeout(() => {
        onImportComplete();
      }, 1500);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err?.message || 'Gagal menyimpan batch CSV ke Firestore.');
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-[#6D6D68] hover:text-[#151515] hover:bg-[#E7E7E0] rounded-xl transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#151515] tracking-tight">
              Import Produk dari CSV
            </h2>
            <p className="text-xs text-[#6D6D68]">
              Upload file CSV untuk mengimpor puluhan model hijab, varian warna HEX, harga, dan link secara cepat.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Template CSV</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-[#F8F8F4] border-2 border-dashed border-[#DCDCD5] rounded-3xl p-8 text-center hover:border-[#151515] transition-colors">
        <FileSpreadsheet className="w-12 h-12 text-[#6D6D68] mx-auto mb-3 opacity-60" />
        <h3 className="text-sm font-bold text-[#151515] uppercase tracking-wide">
          Pilih atau Seret File CSV ke Sini
        </h3>
        <p className="text-xs text-[#6D6D68] mt-1 max-w-md mx-auto">
          Mendukung format kolom: Name, Category, Price, HPP, Colors (contoh:
          Black:#171717:10|Cream:#E8E1D5:7), Links, Description.
        </p>

        <div className="mt-5">
          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs">
            <Upload className="w-4 h-4" />
            <span>Pilih File CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <p className="text-xs text-[#151515] font-semibold mt-3">
            File terpilih: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {importResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            Sukses mengimpor {importResult.count} produk ke database Cloud Firestore!
          </span>
        </div>
      )}

      {/* Validation Summary & Preview Table */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="flex items-center justify-between bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wide text-[#151515]">
                Hasil Validasi ({parsedRows.length} baris):
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {validCount} Valid
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                  <XCircle className="w-3.5 h-3.5" />
                  {invalidCount} Error
                </span>
              )}
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isImporting || validCount === 0}
              className="flex items-center gap-2 px-5 py-2 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Impor {validCount} Produk ke Firestore</span>
            </button>
          </div>

          {/* Table Preview */}
          <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F3F3EE] border-b border-[#DCDCD5] text-[#6D6D68]">
                  <tr>
                    <th className="py-3 px-4 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Nama Produk</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Kategori</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Harga Jual</th>
                    <th className="py-3 px-4 uppercase tracking-wider">HPP (Modal)</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Varian Warna</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Stok</th>
                    <th className="py-3 px-4 uppercase tracking-wider">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7E0]">
                  {parsedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#F3F3EE]/80 transition-colors ${
                        !row.isValid ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        {row.isValid ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#151515]">
                        {row.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#6D6D68]">{row.category}</td>
                      <td className="py-3 px-4 font-semibold text-[#151515]">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="py-3 px-4 text-[#6D6D68]">
                        {formatCurrency(row.hpp)}
                      </td>
                      <td className="py-3 px-4">
                        {row.parsedColors.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {row.parsedColors.map((c, i) => (
                              <span
                                key={i}
                                className="w-3 h-3 rounded-full border border-black/20"
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name} (${c.hex})`}
                              />
                            ))}
                            <span className="text-[10px] text-[#6D6D68] ml-1">
                              ({row.parsedColors.length})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6D6D68]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#151515]">
                        {row.stock} pcs
                      </td>
                      <td className="py-3 px-4 text-[11px] text-red-600">
                        {row.validationErrors.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
