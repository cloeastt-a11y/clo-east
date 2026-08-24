import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';
import { slugify } from '../utils/formatters';
import { logAuditAction } from './auditService';

const COLLECTION_NAME = 'categories';

export async function getCategories(): Promise<Category[]> {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Category;
}

export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  userUid = 'system',
  userName = 'Admin'
): Promise<Category> {
  const slug = data.slug || slugify(data.name);
  const payload = {
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || '',
    imageUrl: data.imageUrl || '',
    sortOrder: Number(data.sortOrder) || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(colRef, payload);

  await logAuditAction({
    action: 'CREATE_CATEGORY',
    entityType: 'category',
    entityId: docRef.id,
    entityName: data.name,
    performedBy: userUid,
    performedByName: userName,
  });

  return {
    id: docRef.id,
    ...payload,
  };
}

export async function updateCategory(
  id: string,
  data: Partial<Category>,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updatePayload: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.name && !data.slug) {
    updatePayload.slug = slugify(data.name);
  }

  await updateDoc(docRef, updatePayload);

  await logAuditAction({
    action: 'UPDATE_CATEGORY',
    entityType: 'category',
    entityId: id,
    entityName: data.name || 'Category',
    performedBy: userUid,
    performedByName: userName,
  });
}

export async function deleteCategory(
  id: string,
  categoryName: string,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);

  await logAuditAction({
    action: 'DELETE_CATEGORY',
    entityType: 'category',
    entityId: id,
    entityName: categoryName,
    performedBy: userUid,
    performedByName: userName,
  });
}

/**
 * Seed initial modest fashion categories if none exist in Firestore
 */
export async function seedInitialCategories(userUid = 'system'): Promise<Category[]> {
  const defaults = [
    { name: 'Paris', slug: 'paris', description: 'Koleksi hijab Paris klasik dan modern dengan bahan breathable.', sortOrder: 1, isActive: true },
    { name: 'Pashmina', slug: 'pashmina', description: 'Pashmina premium silk, crinkle, dan airflow yang mudah dibentuk.', sortOrder: 2, isActive: true },
    { name: 'Segi Empat', slug: 'segi-empat', description: 'Hijab square voal motif dan polos tegak di dahi seharian.', sortOrder: 3, isActive: true },
    { name: 'Hijab Jadul', slug: 'hijab-jadul', description: 'Edisi nostalgia Paris Jadul dengan tekstur khas legendaris.', sortOrder: 4, isActive: true },
    { name: 'Instan', slug: 'instan', description: 'Hijab instan praktis dan elegan siap pakai untuk aktivitas dinamis.', sortOrder: 5, isActive: true },
    { name: 'Premium Silk', slug: 'premium-silk', description: 'Koleksi mewah dengan kilau satin lembut untuk acara spesial.', sortOrder: 6, isActive: true },
  ];

  const batch = writeBatch(db);
  const created: Category[] = [];

  for (const item of defaults) {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const catData = {
      ...item,
      imageUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(docRef, catData);
    created.push({ id: docRef.id, ...catData });
  }

  await batch.commit();

  await logAuditAction({
    action: 'CREATE_CATEGORY',
    entityType: 'category',
    entityName: 'Initial Categories Seed',
    performedBy: userUid,
    performedByName: 'System Setup',
  });

  return created;
}
