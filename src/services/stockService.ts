import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  runTransaction,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockTransaction, StockBatch, PendingStockChange } from '../types';
import { logAuditAction } from './auditService';

const TRANSACTIONS_COLLECTION = 'stockTransactions';
const BATCHES_COLLECTION = 'stockBatches';
const PRODUCTS_COLLECTION = 'products';

export interface SubmitBatchResult {
  success: boolean;
  batchId?: string;
  totalSold: number;
  totalAdded: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  error?: string;
}

/**
 * Atomic stock batch submission using Firestore runTransaction to guarantee consistency
 */
export async function submitStockBatch(
  changes: PendingStockChange[],
  userUid = 'system',
  userName = 'Admin',
  batchNotes = ''
): Promise<SubmitBatchResult> {
  if (!changes || changes.length === 0) {
    throw new Error('Tidak ada perubahan stok untuk diproses.');
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Group changes by productId to read each product once
      const productIds = Array.from(new Set(changes.map((c) => c.productId)));
      const productDocsMap = new Map<string, any>();

      // Read all products within the transaction
      for (const pId of productIds) {
        const pRef = doc(db, PRODUCTS_COLLECTION, pId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) {
          throw new Error(`Produk dengan ID ${pId} tidak ditemukan di database.`);
        }
        productDocsMap.set(pId, { ref: pRef, data: pSnap.data() });
      }

      let totalSold = 0;
      let totalAdded = 0;
      let totalRevenue = 0;
      let totalGrossProfit = 0;
      let totalNetProfit = 0;

      const transactionRecords: Array<{
        docRef: any;
        data: Omit<StockTransaction, 'id'>;
      }> = [];

      // Create a working clone of products data to accumulate multiple changes to the same product
      const workingProducts = new Map<string, any>();
      for (const [pId, info] of productDocsMap.entries()) {
        workingProducts.set(pId, JSON.parse(JSON.stringify(info.data)));
      }

      // Determine effective note for each transaction item
      const getEffectiveNote = (itemNote?: string, type?: string) => {
        const b = (batchNotes || '').trim();
        const c = (itemNote || '').trim();
        const isGeneric = (str: string) =>
          [
            'penjualan kasir / marketplace',
            'penjualan / sold',
            'sold',
            'restock masuk',
            'restock / stok masuk',
            'restock',
            'penyesuaian stok (opname)',
            'penyesuaian stok',
            'opname',
          ].includes(str.toLowerCase());

        if (b) {
          if (c && !isGeneric(c)) {
            return `${b} (${c})`;
          }
          return b;
        }
        if (c) return c;
        if (type === 'SALE') return 'Penjualan / Sold';
        if (type === 'ADD') return 'Restock / Stok Masuk';
        return 'Penyesuaian Stok (Opname)';
      };

      // Process each change item
      for (const change of changes) {
        const prod = workingProducts.get(change.productId);
        const prevTotalStock = Number(prod.stock) || 0;
        let newTotalStock = prevTotalStock;

        const colors = prod.colors || [];
        const colorIdx = change.colorId
          ? colors.findIndex((c: any) => c.id === change.colorId)
          : -1;

        let prevColorStock = 0;
        let newColorStock = 0;

        if (colorIdx >= 0) {
          prevColorStock = Number(colors[colorIdx].stock) || 0;
        }

        const effectiveNote = getEffectiveNote(change.note, change.type);

        // Apply change
        if (change.type === 'SALE') {
          // Verify stock
          if (colorIdx >= 0) {
            if (prevColorStock < change.quantity) {
              throw new Error(
                `Stok tidak mencukupi untuk ${prod.name} (Warna: ${colors[colorIdx].name}). Stok saat ini: ${prevColorStock}, permintaan: ${change.quantity}.`
              );
            }
            newColorStock = prevColorStock - change.quantity;
            colors[colorIdx].stock = newColorStock;
          } else {
            if (prevTotalStock < change.quantity) {
              throw new Error(
                `Stok tidak mencukupi untuk ${prod.name}. Stok saat ini: ${prevTotalStock}, permintaan: ${change.quantity}.`
              );
            }
          }

          newTotalStock = colors.length > 0
            ? colors.reduce((acc: number, c: any) => acc + (Number(c.stock) || 0), 0)
            : Math.max(0, prevTotalStock - change.quantity);

          const saleRevenue = change.quantity * change.price;
          const totalHpp = change.quantity * change.hpp;
          const grossProfit = saleRevenue - totalHpp;
          const netProfit = grossProfit; // Future expansion: minus marketplace fee/discount

          totalSold += change.quantity;
          totalRevenue += saleRevenue;
          totalGrossProfit += grossProfit;
          totalNetProfit += netProfit;

          const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));
          transactionRecords.push({
            docRef: txRef,
            data: {
              productId: change.productId,
              productName: prod.name,
              colorId: change.colorId,
              colorName: colorIdx >= 0 ? colors[colorIdx].name : undefined,
              type: 'SALE',
              quantity: change.quantity,
              previousStock: colorIdx >= 0 ? prevColorStock : prevTotalStock,
              newStock: colorIdx >= 0 ? newColorStock : newTotalStock,
              price: change.price,
              hpp: change.hpp,
              revenue: saleRevenue,
              grossProfit,
              netProfit,
              note: effectiveNote,
              createdAt: serverTimestamp(),
              createdBy: userUid,
              createdByName: userName,
            },
          });
        } else if (change.type === 'ADD') {
          if (colorIdx >= 0) {
            newColorStock = prevColorStock + change.quantity;
            colors[colorIdx].stock = newColorStock;
          }

          newTotalStock = colors.length > 0
            ? colors.reduce((acc: number, c: any) => acc + (Number(c.stock) || 0), 0)
            : prevTotalStock + change.quantity;

          totalAdded += change.quantity;

          const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));
          transactionRecords.push({
            docRef: txRef,
            data: {
              productId: change.productId,
              productName: prod.name,
              colorId: change.colorId,
              colorName: colorIdx >= 0 ? colors[colorIdx].name : undefined,
              type: 'ADD',
              quantity: change.quantity,
              previousStock: colorIdx >= 0 ? prevColorStock : prevTotalStock,
              newStock: colorIdx >= 0 ? newColorStock : newTotalStock,
              price: change.price,
              hpp: change.hpp,
              revenue: 0,
              grossProfit: 0,
              netProfit: 0,
              note: effectiveNote,
              createdAt: serverTimestamp(),
              createdBy: userUid,
              createdByName: userName,
            },
          });
        } else {
          // ADJUSTMENT
          if (colorIdx >= 0) {
            colors[colorIdx].stock = change.quantity;
            newColorStock = change.quantity;
          }
          newTotalStock = colors.length > 0
            ? colors.reduce((acc: number, c: any) => acc + (Number(c.stock) || 0), 0)
            : change.quantity;

          const diff = newTotalStock - prevTotalStock;
          if (diff > 0) totalAdded += diff;
          else if (diff < 0) totalSold += Math.abs(diff);

          const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));
          transactionRecords.push({
            docRef: txRef,
            data: {
              productId: change.productId,
              productName: prod.name,
              colorId: change.colorId,
              colorName: colorIdx >= 0 ? colors[colorIdx].name : undefined,
              type: 'ADJUSTMENT',
              quantity: change.quantity,
              previousStock: colorIdx >= 0 ? prevColorStock : prevTotalStock,
              newStock: colorIdx >= 0 ? newColorStock : newTotalStock,
              price: change.price,
              hpp: change.hpp,
              revenue: 0,
              grossProfit: 0,
              netProfit: 0,
              note: effectiveNote,
              createdAt: serverTimestamp(),
              createdBy: userUid,
              createdByName: userName,
            },
          });
        }

        prod.stock = newTotalStock;
        prod.status = newTotalStock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
      }

      // Create Stock Batch document
      const batchRef = doc(collection(db, BATCHES_COLLECTION));
      const batchPayload: Omit<StockBatch, 'id'> = {
        status: 'submitted',
        totalAdded,
        totalSold,
        totalRevenue,
        totalGrossProfit,
        totalNetProfit,
        createdAt: serverTimestamp(),
        createdBy: userUid,
        createdByName: userName,
        notes: batchNotes || '',
        items: changes.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          colorId: c.colorId,
          colorName: c.colorName,
          type: c.type,
          quantity: c.quantity,
          price: c.price,
          hpp: c.hpp,
          note: getEffectiveNote(c.note, c.type),
        })),
      };
      transaction.set(batchRef, batchPayload);

      // Save transactions with batchId link
      for (const tx of transactionRecords) {
        transaction.set(tx.docRef, {
          ...tx.data,
          batchId: batchRef.id,
        });
      }

      // Update products in Firestore
      for (const [pId, prodData] of workingProducts.entries()) {
        const pRef = productDocsMap.get(pId).ref;
        transaction.update(pRef, {
          stock: prodData.stock,
          status: prodData.status,
          colors: prodData.colors || [],
          updatedAt: serverTimestamp(),
          updatedBy: userUid,
        });
      }

      return {
        batchId: batchRef.id,
        totalSold,
        totalAdded,
        totalRevenue,
        totalGrossProfit,
        totalNetProfit,
      };
    });

    await logAuditAction({
      action: 'STOCK_UPDATE',
      entityType: 'stock',
      entityId: result.batchId,
      entityName: `Stock batch update (${changes.length} items)`,
      performedBy: userUid,
      performedByName: userName,
      metadata: {
        totalAdded: result.totalAdded,
        totalSold: result.totalSold,
        totalRevenue: result.totalRevenue,
        totalGrossProfit: result.totalGrossProfit,
      },
    });

    return {
      success: true,
      ...result,
    };
  } catch (err: any) {
    console.error('Stock batch transaction failed:', err);
    return {
      success: false,
      totalSold: 0,
      totalAdded: 0,
      totalRevenue: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      error: err?.message || 'Gagal memproses perubahan stok.',
    };
  }
}

/**
 * Fetch stock transactions history
 */
export async function getStockTransactions(options?: {
  type?: string;
  productId?: string;
  maxCount?: number;
}): Promise<StockTransaction[]> {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    let q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(options?.maxCount || 100));

    if (options?.type && options.type !== 'all') {
      q = query(
        colRef,
        where('type', '==', options.type),
        orderBy('createdAt', 'desc'),
        firestoreLimit(options?.maxCount || 100)
      );
    }

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StockTransaction[];

    if (options?.productId && options.productId !== 'all') {
      results = results.filter((t) => t.productId === options.productId);
    }

    return results;
  } catch (err) {
    console.error('Error fetching stock transactions:', err);
    return [];
  }
}

/**
 * Fetch all stock transactions without pagination limit for full backup / export
 */
export async function getAllStockTransactions(): Promise<StockTransaction[]> {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StockTransaction[];
  } catch (err) {
    console.error('Error fetching all stock transactions:', err);
    return [];
  }
}

/**
 * Fetch stock batches history
 */
export async function getStockBatches(maxCount = 30): Promise<StockBatch[]> {
  try {
    const colRef = collection(db, BATCHES_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StockBatch[];
  } catch (err) {
    console.error('Error fetching stock batches:', err);
    return [];
  }
}

/**
 * Permanently purge all stock transactions and batches from Firestore with audit logging
 */
export async function deleteAllStockTransactions(
  userUid = 'system',
  userName = 'Admin'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Fetch all documents in stockTransactions
    const txSnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    const txDocs = txSnapshot.docs;

    // 2. Fetch all documents in stockBatches
    const batchSnapshot = await getDocs(collection(db, BATCHES_COLLECTION));
    const batchDocs = batchSnapshot.docs;

    const totalToDelete = txDocs.length + batchDocs.length;
    if (totalToDelete === 0) {
      return { success: true, count: 0 };
    }

    // Firestore batch limit is 500 operations per batch
    const allDocs = [...txDocs, ...batchDocs];
    const CHUNK_SIZE = 400;

    for (let i = 0; i < allDocs.length; i += CHUNK_SIZE) {
      const chunk = allDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }

    // Record audit log
    await logAuditAction({
      action: 'STOCK_PURGE',
      entityType: 'stock',
      entityId: 'all',
      entityName: `Hapus seluruh riwayat transaksi stok (${txDocs.length} transaksi, ${batchDocs.length} batch)`,
      performedBy: userUid,
      performedByName: userName,
      metadata: {
        deletedTransactionsCount: txDocs.length,
        deletedBatchesCount: batchDocs.length,
      },
    });

    return {
      success: true,
      count: txDocs.length,
    };
  } catch (err: any) {
    console.error('Error deleting all stock transactions:', err);
    return {
      success: false,
      count: 0,
      error: err?.message || 'Gagal menghapus data riwayat transaksi.',
    };
  }
}

