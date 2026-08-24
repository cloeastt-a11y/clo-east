import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Boxes,
  Package,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  ArrowDownRight,
} from 'lucide-react';
import { DashboardStats, Product, StockTransaction } from '../../types';
import { getDashboardMetrics } from '../../services/dashboardService';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { StatsCardSkeleton } from '../../components/common/Skeleton';
import { AdminTab } from '../../components/admin/AdminSidebar';

interface AdminDashboardPageProps {
  onNavigate?: (tab: AdminTab) => void;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate, onNavigateTab }) => {
  const handleNav = (tab: AdminTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    grossProfit: 0,
    netProfit: 0,
    totalProducts: 0,
    totalStockUnits: 0,
    inventoryCapital: 0,
    totalCategories: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    totalSoldUnits: 0,
    totalAddedUnits: 0,
  });
  const [topProducts, setTopProducts] = useState<Array<{ id: string; name: string; sold: number; revenue: number }>>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<Array<{ name: string; count: number; stock: number }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);

  const loadData = async () => {
    setLoading(true);
    const data = await getDashboardMetrics();
    setStats(data.stats);
    setTopProducts(data.topProducts);
    setCategoryDistribution(data.categoryDistribution);
    setRecentTransactions(data.recentTransactions);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#6D6D68] font-medium">
            CLO.EAST Modest Management
          </span>
          <h2 className="text-2xl font-bold text-[#151515] tracking-tight mt-1 font-heading">
            Selamat Datang, Admin CLO.EAST
          </h2>
          <p className="text-xs sm:text-sm text-[#6D6D68] mt-1">
            Pantau stok real-time, nilai modal berjalan, dan transaksi penjualan hijab hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleNav('stock')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#151515] text-[#F8F8F4] hover:bg-[#2A2A2A] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
          >
            <Boxes className="w-4 h-4" />
            <span>Update Stok</span>
          </button>
          <button
            onClick={() => handleNav('products-new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E7E7E0] hover:bg-[#DCDCD5] text-[#151515] rounded-xl text-xs font-semibold tracking-wider uppercase transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 6 Primary Key Metric Cards (Inspired by Reference 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Revenue */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Total Revenue (Omset)
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatCurrency(stats.revenue)}
              </p>
              <p className="text-[11px] text-[#6D6D68] mt-1.5 flex items-center gap-1">
                <span>Dari total {formatNumber(stats.totalSoldUnits)} pcs terjual</span>
              </p>
            </div>

            {/* Card 2: Gross Profit */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Gross Profit (Laba Kotor)
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatCurrency(stats.grossProfit)}
              </p>
              <p className="text-[11px] text-[#6D6D68] mt-1.5">
                Formula: (Harga Jual &minus; HPP) &times; Qty Terjual
              </p>
            </div>

            {/* Card 3: Net Profit */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Net Profit (Laba Bersih)
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatCurrency(stats.netProfit)}
              </p>
              <p className="text-[11px] text-[#6D6D68] mt-1.5">
                Laba bersih operasional terverifikasi
              </p>
            </div>

            {/* Card 4: Total Products */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Total Model Produk
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatNumber(stats.totalProducts)}{' '}
                <span className="text-sm font-normal text-[#6D6D68]">Models</span>
              </p>
              <p className="text-[11px] text-[#6D6D68] mt-1.5">
                Dalam {stats.totalCategories} kategori aktif
              </p>
            </div>

            {/* Card 5: Total Stock Units */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Total Stok Fisik
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatNumber(stats.totalStockUnits)}{' '}
                <span className="text-sm font-normal text-[#6D6D68]">pcs</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                {stats.outOfStockCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {stats.outOfStockCount} model habis
                  </span>
                )}
                {stats.lowStockCount > 0 && (
                  <span className="text-amber-600 font-medium">
                    &bull; {stats.lowStockCount} model menipis
                  </span>
                )}
                {stats.outOfStockCount === 0 && stats.lowStockCount === 0 && (
                  <span className="text-emerald-700 font-medium">Stok prima</span>
                )}
              </div>
            </div>

            {/* Card 6: Inventory Capital (Modal Berjalan HPP) */}
            <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-2xl p-6 shadow-xs hover:border-[#151515]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6D6D68]">
                  Inventory Capital (Modal HPP)
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#151515] mt-3 tracking-tight">
                {formatCurrency(stats.inventoryCapital)}
              </p>
              <p className="text-[11px] text-[#6D6D68] mt-1.5">
                Formula: SUM(Stok Fisik &times; HPP)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grid: Category Distribution & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCDCD5]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
              Distribusi Kategori Produk
            </h3>
            <button
              onClick={() => handleNav('categories')}
              className="text-xs text-[#6D6D68] hover:text-[#151515] flex items-center gap-1 font-medium"
            >
              <span>Kelola Kategori</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryDistribution.length === 0 ? (
            <p className="text-xs text-[#6D6D68] py-6 text-center">
              Belum ada data kategori tersimpan.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryDistribution.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#F3F3EE] rounded-xl border border-[#DCDCD5]"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#151515] uppercase tracking-wide">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-[#6D6D68]">
                      {cat.count} model hijab terdaftar
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#151515]">
                      {formatNumber(cat.stock)} pcs
                    </span>
                    <p className="text-[10px] text-[#6D6D68]">Total stok fisik</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCDCD5]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
              Top 5 Produk Terlaris
            </h3>
            <button
              onClick={() => handleNav('reports')}
              className="text-xs text-[#6D6D68] hover:text-[#151515] flex items-center gap-1 font-medium"
            >
              <span>Lihat Laporan Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-[#6D6D68] py-6 text-center">
              Belum ada catatan transaksi penjualan. Lakukan penjualan di menu 'Update Stok'.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 bg-[#F3F3EE] rounded-xl border border-[#DCDCD5]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#151515] text-[#F8F8F4] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#151515] uppercase tracking-wide">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-[#6D6D68]">
                        Omset: {formatCurrency(prod.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                      {formatNumber(prod.sold)} pcs terjual
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Stock Transactions Feed */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCDCD5]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515]">
            Riwayat Transaksi Stok Terbaru
          </h3>
          <button
            onClick={() => handleNav('transactions')}
            className="text-xs text-[#6D6D68] hover:text-[#151515] flex items-center gap-1 font-medium"
          >
            <span>Lihat Semua Transaksi</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-[#6D6D68] py-6 text-center">
            Belum ada aktivitas stok tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCDCD5] text-[#6D6D68]">
                  <th className="pb-2 font-semibold uppercase tracking-wider">Tanggal</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Produk</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Tipe</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Qty</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Harga</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Revenue</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Gross Profit</th>
                  <th className="pb-2 font-semibold uppercase tracking-wider">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E0]">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F3F3EE]/60 transition-colors">
                    <td className="py-3 text-[#6D6D68] whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3 font-medium text-[#151515]">
                      {tx.productName}
                      {tx.colorName && (
                        <span className="text-[11px] text-[#6D6D68] ml-1">
                          ({tx.colorName})
                        </span>
                      )}
                    </td>
                    <td className="py-3">
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
                    <td className="py-3 font-semibold text-[#151515]">
                      {tx.type === 'SALE' ? `-${tx.quantity}` : `+${tx.quantity}`} pcs
                    </td>
                    <td className="py-3 text-[#6D6D68]">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="py-3 font-medium text-[#151515]">
                      {tx.revenue ? formatCurrency(tx.revenue) : '-'}
                    </td>
                    <td className="py-3 font-semibold text-emerald-700">
                      {tx.grossProfit ? formatCurrency(tx.grossProfit) : '-'}
                    </td>
                    <td className="py-3 text-[#6D6D68]">
                      {tx.createdByName || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
