import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DashboardStats, Product, StockTransaction } from '../types';

export async function getDashboardMetrics(): Promise<{
  stats: DashboardStats;
  topProducts: Array<{ id: string; name: string; sold: number; revenue: number }>;
  categoryDistribution: Array<{ name: string; count: number; stock: number }>;
  recentTransactions: StockTransaction[];
}> {
  try {
    // 1. Fetch all products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Product[];

    // 2. Fetch categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const totalCategories = categoriesSnapshot.size;

    // 3. Fetch all SALE stock transactions for accurate revenue & profit calculations
    const txColRef = collection(db, 'stockTransactions');
    const txSnapshot = await getDocs(query(txColRef, orderBy('createdAt', 'desc')));
    const allTransactions = txSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StockTransaction[];

    let totalRevenue = 0;
    let totalGrossProfit = 0;
    let totalNetProfit = 0;
    let totalSoldUnits = 0;
    let totalAddedUnits = 0;

    const productSalesMap = new Map<string, { name: string; sold: number; revenue: number }>();

    for (const tx of allTransactions) {
      if (tx.type === 'SALE') {
        const rev = Number(tx.revenue) || (Number(tx.quantity) * Number(tx.price)) || 0;
        const gp = Number(tx.grossProfit) || (rev - (Number(tx.quantity) * Number(tx.hpp))) || 0;
        const np = Number(tx.netProfit) || gp;
        const qty = Number(tx.quantity) || 0;

        totalRevenue += rev;
        totalGrossProfit += gp;
        totalNetProfit += np;
        totalSoldUnits += qty;

        const curr = productSalesMap.get(tx.productId) || { name: tx.productName || 'Produk', sold: 0, revenue: 0 };
        curr.sold += qty;
        curr.revenue += rev;
        productSalesMap.set(tx.productId, curr);
      } else if (tx.type === 'ADD') {
        totalAddedUnits += Number(tx.quantity) || 0;
      }
    }

    // 4. Calculate products stock and Inventory Capital using Formula: SUM(current stock * HPP)
    let totalStockUnits = 0;
    let inventoryCapital = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    const categoryMap = new Map<string, { name: string; count: number; stock: number }>();

    for (const p of products) {
      const stock = Number(p.stock) || 0;
      const hpp = Number(p.hpp) || 0;

      totalStockUnits += stock;
      inventoryCapital += (stock * hpp);

      if (stock === 0) {
        outOfStockCount += 1;
      } else if (stock <= 5) {
        lowStockCount += 1;
      }

      const catName = p.categoryName || 'Tanpa Kategori';
      const catStat = categoryMap.get(catName) || { name: catName, count: 0, stock: 0 };
      catStat.count += 1;
      catStat.stock += stock;
      categoryMap.set(catName, catStat);
    }

    // Sort top selling products
    const topProducts = Array.from(productSalesMap.entries())
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const categoryDistribution = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    return {
      stats: {
        revenue: totalRevenue,
        grossProfit: totalGrossProfit,
        netProfit: totalNetProfit,
        totalProducts: products.length,
        totalStockUnits,
        inventoryCapital,
        totalCategories,
        outOfStockCount,
        lowStockCount,
        totalSoldUnits,
        totalAddedUnits,
      },
      topProducts,
      categoryDistribution,
      recentTransactions: allTransactions.slice(0, 10),
    };
  } catch (err) {
    console.error('Error computing dashboard metrics:', err);
    return {
      stats: {
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
      },
      topProducts: [],
      categoryDistribution: [],
      recentTransactions: [],
    };
  }
}
