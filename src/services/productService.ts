import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Product, ProductStatus } from '../types';
import { slugify } from '../utils/formatters';
import { logAuditAction } from './auditService';

const COLLECTION_NAME = 'products';

/**
 * Fetch all products from Firestore
 */
export async function getProducts(options?: {
  categoryId?: string;
  status?: string;
  search?: string;
}): Promise<Product[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    let q = query(colRef, orderBy('createdAt', 'desc'));

    if (options?.categoryId && options.categoryId !== 'all') {
      q = query(colRef, where('categoryId', '==', options.categoryId), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Product[];

    if (options?.status && options.status !== 'all') {
      products = products.filter((p) => p.status === options.status);
    }

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.categoryName?.toLowerCase().includes(term) ||
          p.colors?.some((c) => c.name.toLowerCase().includes(term))
      );
    }

    return products;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

/**
 * Fetch single product by Document ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Product;
}

/**
 * Fetch product by Slug (for public clean URL)
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Product;
}

/**
 * Create a single product
 */
export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  userUid = 'system',
  userName = 'Admin'
): Promise<Product> {
  const colors = data.colors || [];
  const calculatedStock = colors.length > 0
    ? colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)
    : Number(data.stock) || 0;

  const status: ProductStatus = calculatedStock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
  const baseSlug = slugify(data.name) || 'product';
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const payload = {
    name: data.name.trim(),
    slug: data.slug || uniqueSlug,
    categoryId: data.categoryId || '',
    categoryName: data.categoryName || '',
    description: data.description?.trim() || '',
    imageUrl: data.imageUrl || '',
    imagePath: data.imagePath || '',
    price: Number(data.price) || 0,
    hpp: Number(data.hpp) || 0,
    stock: calculatedStock,
    status,
    colors: colors.map((c) => ({
      id: c.id || slugify(c.name) || Math.random().toString(36).slice(2, 7),
      name: c.name.trim(),
      hex: c.hex.startsWith('#') ? c.hex : `#${c.hex}`,
      stock: Number(c.stock) || 0,
    })),
    links: data.links || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userUid,
    updatedBy: userUid,
  };

  const colRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(colRef, payload);

  await logAuditAction({
    action: 'CREATE_PRODUCT',
    entityType: 'product',
    entityId: docRef.id,
    entityName: data.name,
    performedBy: userUid,
    performedByName: userName,
    metadata: { price: payload.price, hpp: payload.hpp, stock: payload.stock },
  });

  return {
    id: docRef.id,
    ...payload,
  };
}

/**
 * Bulk create products (from bulk entry form or CSV import)
 */
export async function createBulkProducts(
  products: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  userUid = 'system',
  userName = 'Admin'
): Promise<Product[]> {
  const batch = writeBatch(db);
  const created: Product[] = [];
  const colRef = collection(db, COLLECTION_NAME);

  for (const item of products) {
    const docRef = doc(colRef);
    const colors = item.colors || [];
    const calculatedStock = colors.length > 0
      ? colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0)
      : Number(item.stock) || 0;

    const status: ProductStatus = calculatedStock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
    const baseSlug = slugify(item.name) || 'product';
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const payload = {
      name: item.name.trim(),
      slug: item.slug || uniqueSlug,
      categoryId: item.categoryId || '',
      categoryName: item.categoryName || '',
      description: item.description?.trim() || '',
      imageUrl: item.imageUrl || '',
      imagePath: item.imagePath || '',
      price: Number(item.price) || 0,
      hpp: Number(item.hpp) || 0,
      stock: calculatedStock,
      status,
      colors: colors.map((c) => ({
        id: c.id || slugify(c.name) || Math.random().toString(36).slice(2, 7),
        name: c.name.trim(),
        hex: c.hex.startsWith('#') ? c.hex : `#${c.hex}`,
        stock: Number(c.stock) || 0,
      })),
      links: item.links || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userUid,
      updatedBy: userUid,
    };

    batch.set(docRef, payload);
    created.push({ id: docRef.id, ...payload });
  }

  await batch.commit();

  await logAuditAction({
    action: 'CSV_IMPORT',
    entityType: 'product',
    entityName: `Bulk import ${products.length} products`,
    performedBy: userUid,
    performedByName: userName,
    metadata: { count: products.length },
  });

  return created;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  data: Partial<Product>,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);

  const colors = data.colors;
  let calculatedStock = data.stock;
  if (colors && colors.length > 0) {
    calculatedStock = colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
  }

  const updatePayload: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userUid,
  };

  if (calculatedStock !== undefined) {
    updatePayload.stock = calculatedStock;
    updatePayload.status = calculatedStock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
  }

  await updateDoc(docRef, updatePayload);

  await logAuditAction({
    action: 'UPDATE_PRODUCT',
    entityType: 'product',
    entityId: id,
    entityName: data.name || 'Product',
    performedBy: userUid,
    performedByName: userName,
    metadata: { updatedFields: Object.keys(data) },
  });
}

/**
 * Delete a product and its image if stored in Storage
 */
export async function deleteProduct(
  id: string,
  productName: string,
  imagePath?: string,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);

  if (imagePath) {
    try {
      const storageRef = ref(storage, imagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Storage image cleanup error (ignored):', err);
    }
  }

  await logAuditAction({
    action: 'DELETE_PRODUCT',
    entityType: 'product',
    entityId: id,
    entityName: productName,
    performedBy: userUid,
    performedByName: userName,
  });
}

/**
 * Bulk delete products
 */
export async function deleteBulkProducts(
  products: Array<{ id: string; name: string; imagePath?: string }>,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  const batch = writeBatch(db);

  for (const p of products) {
    const docRef = doc(db, COLLECTION_NAME, p.id);
    batch.delete(docRef);

    if (p.imagePath) {
      try {
        const storageRef = ref(storage, p.imagePath);
        deleteObject(storageRef).catch(() => {});
      } catch {}
    }
  }

  await batch.commit();

  await logAuditAction({
    action: 'BULK_DELETE_PRODUCT',
    entityType: 'product',
    entityName: `Deleted ${products.length} products`,
    performedBy: userUid,
    performedByName: userName,
    metadata: { count: products.length, ids: products.map((p) => p.id) },
  });
}

/**
 * Upload single product image to Firebase Storage with timeout & fallback protection
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: (status: string) => void
): Promise<{ imageUrl: string; imagePath: string; source: 'storage' | 'fallback'; error?: string }> {
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const imagePath = `products/${productId}/${timestamp}_${cleanFileName}`;

  try {
    onProgress?.('Mengunggah ke Firebase Storage...');
    const storageRef = ref(storage, imagePath);

    // Timeout promise for 12 seconds to prevent infinite hanging on slow storage network
    const uploadPromise = uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    }).then((snapshot) => getDownloadURL(snapshot.ref));

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Waktu unggah ke Firebase Storage habis (timeout).')), 12000)
    );

    const imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
    onProgress?.('Foto berhasil tersimpan di Storage.');
    return { imageUrl, imagePath, source: 'storage' };
  } catch (err: any) {
    console.warn('Firebase Storage upload error, falling back to optimized inline format:', err);
    onProgress?.('Menyimpan cadangan foto...');

    // Fallback: read file into data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          imageUrl: dataUrl,
          imagePath: '',
          source: 'fallback',
          error: err?.message || 'Storage offline / permission limit',
        });
      };
      reader.onerror = () => {
        resolve({
          imageUrl: '',
          imagePath: '',
          source: 'fallback',
          error: 'Gagal memproses file gambar.',
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

