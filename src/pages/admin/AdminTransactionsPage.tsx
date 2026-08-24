import React, { useState, useEffect } from 'react';
import {
  Search,
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Trash2,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';
import { StockTransaction } from '../../types';
import {
  getStockTransactions,
  getAllStockTransactions,
  deleteAllStockTransactions,
} from '../../services/stockService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportTransactionsToCsv } from '../../utils/csvExport';
import { useAuth } from '../../context/AuthContext';

export const AdminTransactionsPage: React.FC = () => {
  const { adminUser } = useAuth();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'last7' | 'thisMonth'>('all');

  // Export & Action notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Delete All Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreparingBackup, setIsPreparingBackup] = useState(false);
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [backupFilename, setBackupFilename] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [allTransactionsForBackup, setAllTransactionsForBackup] = useState<StockTransaction[]>([]);

  const loadData = async () => {
    setLoading(true);
    const data = await getStockTransactions({
      type: selectedType,
      maxCount: 500,
    });
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedType]);

  // Helper to extract JS Date from various timestamp formats
  const extractDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'number' || typeof timestamp === 'string') {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // Preset Date Handlers
  const applyDatePreset = (preset: 'all' | 'today' | 'last7' | 'thisMonth') => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === 'last7') {
      const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
      return;
    }

    if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
      return;
    }
  };

  // Filter transactions based on search, type, and date range
  const filteredTransactions = transactions.filter((t) => {
    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        t.productName?.toLowerCase().includes(term) ||
        t.colorName?.toLowerCase().includes(term) ||
        t.note?.toLowerCase().includes(term) ||
        t.createdByName?.toLowerCase().includes(term);
      if (!match) return false;
    }

    // 2. Date Range filter
    const txDate = extractDate(t.createdAt);
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      if (txDate && txDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59.999');
      if (txDate && txDate > end) return false;
    }

    return true;
  });

  // Calculate summary for current filtered view
  const totalRevenue = filteredTransactions
    .filter((t) => t.type === 'SALE')
    .reduce((sum, t) => sum + (t.revenue || t.quantity * t.price || 0), 0);

  const totalGrossProfit = filteredTransactions
    .filter((t) => t.type === 'SALE')
    .reduce((sum, t) => sum + (t.grossProfit || 0), 0);

  const totalUnitsSold = filteredTransactions
    .filter((t) => t.type === 'SALE')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  const totalUnitsAdded = filteredTransactions
    .filter((t) => t.type === 'ADD')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  // Handle Export Filtered Data
  const handleExportFiltered = () => {
    if (filteredTransactions.length === 0) {
      setNotification({
        type: 'error',
        message: 'Tidak ada data transaksi pada rentang tanggal/filter yang dipilih untuk diexport.',
      });
      return;
    }

    let dateRangeSuffix = 'Semua_Periode';
    if (startDate && endDate) {
      dateRangeSuffix = `${startDate}_sd_${endDate}`;
    } else if (startDate) {
      dateRangeSuffix = `mulai_${startDate}`;
    } else if (endDate) {
      dateRangeSuffix = `sampai_${endDate}`;
    }

    const filename = `CLOEAST_Transaksi_Stok_${dateRangeSuffix}.csv`;
    const res = exportTransactionsToCsv(filteredTransactions, filename);

    if (res.success) {
      setNotification({
        type: 'success',
        message: `Berhasil meng-export ${res.count} data transaksi ke file "${res.filename}".`,
      });
    }
  };

  // Open Delete All Modal
  const handleOpenDeleteModal = async () => {
    setIsDeleteModalOpen(true);
    setHasDownloadedBackup(false);
    setConfirmText('');
    setIsPreparingBackup(true);

    // Fetch all transactions in database for complete backup
    const allData = await getAllStockTransactions();
    setAllTransactionsForBackup(allData);
    setIsPreparingBackup(false);
  };

  // Download Backup in Modal
  const handleDownloadBackup = () => {
    const backupData = allTransactionsForBackup.length > 0 ? allTransactionsForBackup : transactions;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `CLOEAST_BACKUP_TOTAL_TRANSAKSI_${dateStr}_${timeStr}.csv`;

    const res = exportTransactionsToCsv(backupData, filename);
    setBackupFilename(res.filename);
    setHasDownloadedBackup(true);

    setNotification({
      type: 'success',
      message: `File backup "${res.filename}" (${res.count} data) berhasil diunduh. Silakan lanjutkan jika ingin menghapus data.`,
    });
  };

  // Execute Permanent Delete of All Transactions
  const handleConfirmDeleteAll = async () => {
    if (!hasDownloadedBackup) {
      alert('Wajib mengunduh file backup CSV terlebih dahulu sebelum menghapus data!');
      return;
    }

    setIsDeleting(true);
    const userUid = adminUser?.uid || 'admin';
    const userName = adminUser?.displayName || adminUser?.username || 'Admin';

    const result = await deleteAllStockTransactions(userUid, userName);
    setIsDeleting(false);

    if (result.success) {
      setIsDeleteModalOpen(false);
      setTransactions([]);
      setAllTransactionsForBackup([]);
      setNotification({
        type: 'success',
        message: `Seluruh data riwayat transaksi stok (${result.count} transaksi) berhasil dihapus dari database.`,
      });
    } else {
      setNotification({
        type: 'error',
        message: result.error || 'Gagal menghapus seluruh data transaksi.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Riwayat Transaksi Stok & Penjualan
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Audit pembukuan setiap mutasi stok masuk (restock), penjualan (sold), dan penyesuaian fisik.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Export Filtered Button */}
          <button
            type="button"
            onClick={handleExportFiltered}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-[#151515] hover:bg-[#2A2A2A] text-[#F8F8F4] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-40"
            title="Export data sesuai filter & tanggal yang dipilih"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV ({filteredTransactions.length})</span>
          </button>

          {/* Delete All Data Button */}
          <button
            type="button"
            onClick={handleOpenDeleteModal}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs"
            title="Hapus seluruh riwayat transaksi stok dari database"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Hapus Semua Data</span>
          </button>
        </div>
      </div>

      {/* Dynamic Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-xs animate-in slide-in-from-top-2 duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-inherit hover:opacity-70 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Omset (Tersaring)
          </span>
          <p className="text-xl font-bold text-[#151515] mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Laba Kotor (Gross Profit)
          </span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(totalGrossProfit)}
          </p>
        </div>

        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Terjual (Sold)
          </span>
          <p className="text-xl font-bold text-red-600 mt-1">
            -{totalUnitsSold} pcs
          </p>
        </div>

        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Masuk (Restock)
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1">
            +{totalUnitsAdded} pcs
          </p>
        </div>
      </div>

      {/* Filter Toolbar with Date Pickers */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-4 space-y-3.5 shadow-xs">
        {/* Top Filter Bar: Search & Type Selection */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#6D6D68] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk, warna, catatan, atau admin..."
              className="w-full pl-10 pr-4 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl text-xs text-[#151515] focus:outline-hidden font-medium"
            >
              <option value="all">Semua Tipe Mutasi</option>
              <option value="SALE">Hanya Penjualan (SALE)</option>
              <option value="ADD">Hanya Restock Masuk (ADD)</option>
              <option value="ADJUSTMENT">Hanya Opname (ADJUSTMENT)</option>
            </select>
          </div>
        </div>

        {/* Bottom Filter Bar: Date Range Pickers & Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-[#E7E7E0] text-xs">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#6D6D68] mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Rentang:
            </span>
            <button
              type="button"
              onClick={() => applyDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                datePreset === 'all' && !startDate && !endDate
                  ? 'bg-[#151515] text-[#F8F8F4]'
                  : 'bg-[#F3F3EE] text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                datePreset === 'today'
                  ? 'bg-[#151515] text-[#F8F8F4]'
                  : 'bg-[#F3F3EE] text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('last7')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                datePreset === 'last7'
                  ? 'bg-[#151515] text-[#F8F8F4]'
                  : 'bg-[#F3F3EE] text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('thisMonth')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                datePreset === 'thisMonth'
                  ? 'bg-[#151515] text-[#F8F8F4]'
                  : 'bg-[#F3F3EE] text-[#6D6D68] hover:text-[#151515]'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          {/* Explicit Date Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-[#6D6D68] uppercase font-bold">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('all');
                }}
                className="bg-transparent border-none text-xs text-[#151515] focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#F3F3EE] border border-[#DCDCD5] rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-[#6D6D68] uppercase font-bold">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('all');
                }}
                className="bg-transparent border-none text-xs text-[#151515] focus:outline-hidden font-mono"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDatePreset('all');
                }}
                className="p-1.5 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#6D6D68] hover:text-[#151515] rounded-xl transition-colors"
                title="Reset filter tanggal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Export Button based on selected dates */}
            <button
              type="button"
              onClick={handleExportFiltered}
              disabled={filteredTransactions.length === 0}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Export CSV data pada rentang tanggal ini"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sesuai Tanggal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCDCD5] bg-[#F3F3EE] text-[#6D6D68]">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Tanggal & Waktu</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Produk & Varian</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Tipe</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Perubahan Qty</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Stok Baru</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Harga & HPP</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Revenue</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Gross Profit</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Catatan</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7E0]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#6D6D68]">
                    <div className="w-6 h-6 border-2 border-[#151515] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#6D6D68]">
                    Tidak ada transaksi tercatat pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F3F3EE]/80 transition-colors">
                    <td className="py-3.5 px-4 text-[#6D6D68] whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#151515]">
                      <div className="font-semibold uppercase tracking-tight">{tx.productName}</div>
                      {tx.colorName && (
                        <div className="text-[11px] text-[#6D6D68]">Warna: {tx.colorName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          tx.type === 'SALE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'ADD'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {tx.type === 'SALE' ? 'Penjualan' : tx.type === 'ADD' ? 'Restock' : 'Opname'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={
                          tx.type === 'SALE'
                            ? 'text-red-600'
                            : tx.type === 'ADD'
                            ? 'text-blue-600'
                            : 'text-[#151515]'
                        }
                      >
                        {tx.type === 'SALE' ? `-${tx.quantity}` : `+${tx.quantity}`} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68] font-mono">
                      {tx.newStock ?? '-'} pcs
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68]">
                      <div>{formatCurrency(tx.price)}</div>
                      <div className="text-[10px] text-[#6D6D68]/80">HPP: {formatCurrency(tx.hpp)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#151515]">
                      {tx.revenue ? formatCurrency(tx.revenue) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {tx.grossProfit ? formatCurrency(tx.grossProfit) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68] max-w-xs truncate">
                      {tx.note || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6D68] font-mono text-[11px]">
                      {tx.createdByName || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete All Data Modal with Required Auto-Backup Flow */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#151515] tracking-tight">
                    Hapus Seluruh Data Transaksi
                  </h3>
                  <p className="text-xs text-[#6D6D68]">
                    Alur keamanan wajib: download file backup sebelum menghapus.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="p-1.5 text-[#6D6D68] hover:text-[#151515] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Perhatian: Tindakan Ini Bersifat Permanen
              </div>
              <p className="text-amber-800/90 leading-relaxed text-[11px]">
                Menghapus data akan membersihkan seluruh riwayat transaksi stok, omset penjualan, laba, dan batch mutasi dari Firestore. Untuk keamanan pembukuan Anda, sistem <strong>mewajibkan Anda mengunduh backup CSV</strong> terlebih dahulu.
              </p>
            </div>

            {/* Step 1: Backup Data CSV */}
            <div className="p-4 bg-[#F3F3EE] border border-[#DCDCD5] rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#151515]">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#151515] text-[#F8F8F4] flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  Download File Backup (Wajib)
                </span>
                <span className="text-[11px] text-[#6D6D68]">
                  Total: {allTransactionsForBackup.length || transactions.length} data transaksi
                </span>
              </div>

              {isPreparingBackup ? (
                <div className="py-3 text-center text-xs text-[#6D6D68] flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#151515] border-t-transparent rounded-full animate-spin" />
                  <span>Menyiapkan seluruh data transaksi...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                    hasDownloadedBackup
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-[#151515] hover:bg-[#2A2A2A] text-[#F8F8F4]'
                  }`}
                >
                  {hasDownloadedBackup ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>File Backup Berhasil Diunduh ({backupFilename})</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Backup Seluruh Data (.CSV)</span>
                    </>
                  )}
                </button>
              )}

              {hasDownloadedBackup && (
                <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  File cadangan telah tersimpan. Tombol hapus data kini dapat digunakan.
                </p>
              )}
            </div>

            {/* Step 2: Confirm Delete Button (Only active after download) */}
            <div className="space-y-3">
              {hasDownloadedBackup ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-[11px] text-red-800 leading-tight">
                      Konfirmasi: Anda siap menghapus seluruh data transaksi secara permanen?
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={isDeleting}
                      className="px-4 py-2.5 text-xs font-semibold text-[#151515] bg-[#E7E7E0] hover:bg-[#DCDCD5] rounded-xl transition-colors"
                    >
                      Batalkan
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmDeleteAll}
                      disabled={isDeleting}
                      className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Menghapus Data...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Lanjutkan Hapus Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-[#6D6D68] italic">
                  Tombol "Lanjutkan Hapus Data" akan muncul setelah Anda mengklik dan mengunduh file backup di atas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
