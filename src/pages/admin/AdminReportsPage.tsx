import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { StockTransaction, Product } from '../../types';
import { getStockTransactions } from '../../services/stockService';
import { getProducts } from '../../services/productService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const AdminReportsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [txs, prods] = await Promise.all([
        getStockTransactions({ maxCount: 500 }),
        getProducts(),
      ]);
      setTransactions(txs);
      setProducts(prods);
      setLoading(false);
    };
    load();
  }, []);

  // Filter transactions by timeRange
  const now = new Date();
  const filteredTxs = transactions.filter((tx) => {
    if (timeRange === 'all') return true;

    let txDate: Date;
    if (tx.createdAt?.toDate) {
      txDate = tx.createdAt.toDate();
    } else if (tx.createdAt) {
      txDate = new Date(tx.createdAt);
    } else {
      return true;
    }

    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);

    if (timeRange === 'today') {
      return (
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    } else if (timeRange === 'week') {
      return diffDays <= 7;
    } else if (timeRange === 'month') {
      return diffDays <= 30;
    }
    return true;
  });

  // Calculate Metrics
  const saleTxs = filteredTxs.filter((t) => t.type === 'SALE');
  const totalRevenue = saleTxs.reduce((sum, t) => sum + (t.revenue || t.quantity * t.price || 0), 0);
  const totalGrossProfit = saleTxs.reduce((sum, t) => sum + (t.grossProfit || 0), 0);
  const totalSoldUnits = saleTxs.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalHppCost = totalRevenue - totalGrossProfit;
  const profitMarginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Top Selling in Period
  const productMap = new Map<string, { name: string; sold: number; revenue: number; profit: number }>();
  saleTxs.forEach((tx) => {
    const curr = productMap.get(tx.productId) || {
      name: tx.productName,
      sold: 0,
      revenue: 0,
      profit: 0,
    };
    curr.sold += tx.quantity;
    curr.revenue += tx.revenue || tx.quantity * tx.price;
    curr.profit += tx.grossProfit || 0;
    productMap.set(tx.productId, curr);
  });

  const rankedProducts = Array.from(productMap.values()).sort((a, b) => b.sold - a.sold);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCDCD5]">
        <div>
          <h2 className="text-xl font-bold text-[#151515] tracking-tight">
            Laporan Penjualan & Margin Profit
          </h2>
          <p className="text-xs text-[#6D6D68] mt-0.5">
            Analisis performa finansial, efisiensi modal HPP, dan pergerakan stok hijab.
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1.5 bg-[#E7E7E0] p-1 rounded-xl">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              timeRange === 'today'
                ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                : 'text-[#6D6D68] hover:text-[#151515]'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              timeRange === 'week'
                ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                : 'text-[#6D6D68] hover:text-[#151515]'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              timeRange === 'month'
                ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                : 'text-[#6D6D68] hover:text-[#151515]'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              timeRange === 'all'
                ? 'bg-[#151515] text-[#F8F8F4] shadow-xs'
                : 'text-[#6D6D68] hover:text-[#151515]'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Revenue (Omset)
          </span>
          <p className="text-2xl font-bold text-[#151515] mt-2 tracking-tight">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[11px] text-[#6D6D68] mt-1">
            Dari {formatNumber(totalSoldUnits)} pcs terjual
          </p>
        </div>

        {/* Gross Profit */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Gross Profit (Laba Kotor)
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-2 tracking-tight">
            {formatCurrency(totalGrossProfit)}
          </p>
          <p className="text-[11px] text-emerald-800 mt-1">
            Margin: {profitMarginPercent.toFixed(1)}%
          </p>
        </div>

        {/* Total Modal HPP */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Total Modal HPP Terjual
          </span>
          <p className="text-2xl font-bold text-[#151515] mt-2 tracking-tight">
            {formatCurrency(totalHppCost)}
          </p>
          <p className="text-[11px] text-[#6D6D68] mt-1">
            Biaya pokok barang keluar
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6D6D68] tracking-wider">
            Net Profit (Laba Bersih)
          </span>
          <p className="text-2xl font-bold text-indigo-700 mt-2 tracking-tight">
            {formatCurrency(totalGrossProfit)}
          </p>
          <p className="text-[11px] text-[#6D6D68] mt-1">
            Operasional bersih
          </p>
        </div>
      </div>

      {/* Ranked Products Leaderboard */}
      <div className="bg-[#F8F8F4] border border-[#DCDCD5] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#151515] flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Peringkat Penjualan Produk Periode Ini</span>
        </h3>

        {rankedProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6D6D68]">
            Belum ada data penjualan pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCDCD5] text-[#6D6D68]">
                  <th className="pb-3 px-3 uppercase tracking-wider w-12">No</th>
                  <th className="pb-3 px-3 uppercase tracking-wider">Nama Produk Hijab</th>
                  <th className="pb-3 px-3 uppercase tracking-wider text-right">Terjual</th>
                  <th className="pb-3 px-3 uppercase tracking-wider text-right">Total Omset</th>
                  <th className="pb-3 px-3 uppercase tracking-wider text-right">Total Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E0]">
                {rankedProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#F3F3EE]/80">
                    <td className="py-3 px-3 font-bold text-[#151515]">#{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-[#151515] uppercase tracking-tight">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#151515]">
                      {p.sold} pcs
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#151515]">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(p.profit)}
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
