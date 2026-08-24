import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog, AuditAction } from '../types';

export async function logAuditAction(params: {
  action: AuditAction;
  entityType: 'product' | 'category' | 'stock' | 'settings' | 'auth' | 'system';
  entityId?: string;
  entityName?: string;
  performedBy: string;
  performedByName?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const colRef = collection(db, 'auditLogs');
    await addDoc(colRef, {
      ...params,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Non-blocking error
  }
}

export async function getAuditLogs(maxCount = 50): Promise<AuditLog[]> {
  try {
    const colRef = collection(db, 'auditLogs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}
