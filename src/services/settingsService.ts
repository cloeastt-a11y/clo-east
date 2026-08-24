import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSettings } from '../types';
import { logAuditAction } from './auditService';

const SETTINGS_DOC_REF = doc(db, 'settings', 'general');

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'CLO.EAST',
  storeTagline: 'Curated Hijab Collection',
  storeDescription: 'Timeless modest pieces for everyday wear with premium materials and signature colors.',
  whatsappNumber: '628123456789',
  instagramHandle: '@clo.east',
  shopeeUrl: 'https://shopee.co.id',
  tokopediaUrl: 'https://tokopedia.com',
  tiktokShopUrl: 'https://tiktok.com',
  defaultCurrency: 'IDR',
  enableStockBadges: true,
  lowStockThreshold: 5,
  address: 'Bandung Timur, Jawa Barat, Indonesia',
};

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const snapshot = await getDoc(SETTINGS_DOC_REF);
    if (!snapshot.exists()) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...snapshot.data() } as StoreSettings;
  } catch (err) {
    console.error('Error loading store settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>,
  userUid = 'system',
  userName = 'Admin'
): Promise<void> {
  await setDoc(
    SETTINGS_DOC_REF,
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: userUid,
    },
    { merge: true }
  );

  await logAuditAction({
    action: 'UPDATE_SETTINGS',
    entityType: 'settings',
    entityName: 'General Store Settings',
    performedBy: userUid,
    performedByName: userName,
  });
}
