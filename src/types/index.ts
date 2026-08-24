export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  stock: number;
}

export interface MarketplaceLinks {
  shopee?: string;
  tokopedia?: string;
  tiktokShop?: string;
  lazada?: string;
  facebook?: string;
  whatsapp?: string;
  other?: string;
}

export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  price: number;
  hpp: number;
  stock: number;
  status: ProductStatus;
  colors: ProductColor[];
  links: MarketplaceLinks;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  createdBy?: string;
  updatedBy?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type TransactionType = 'ADD' | 'SALE' | 'ADJUSTMENT';

export interface StockTransaction {
  id: string;
  batchId?: string;
  productId: string;
  productName: string;
  categoryName?: string;
  colorId?: string;
  colorName?: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  price: number;
  hpp: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  note?: string;
  createdAt: any;
  createdBy: string;
  createdByName?: string;
}

export interface StockBatchItem {
  productId: string;
  productName: string;
  colorId?: string;
  colorName?: string;
  type: TransactionType;
  quantity: number;
  price: number;
  hpp: number;
  note?: string;
}

export interface StockBatch {
  id: string;
  status: 'submitted' | 'draft';
  totalAdded: number;
  totalSold: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  createdAt: any;
  createdBy: string;
  createdByName?: string;
  items: StockBatchItem[];
  notes?: string;
}

export interface AdminUser {
  uid: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  displayName: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type AuditAction =
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'BULK_DELETE_PRODUCT'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'STOCK_UPDATE'
  | 'STOCK_PURGE'
  | 'CSV_IMPORT'
  | 'UPDATE_SETTINGS'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: 'product' | 'category' | 'stock' | 'settings' | 'auth' | 'system';
  entityId?: string;
  entityName?: string;
  performedBy: string;
  performedByName?: string;
  createdAt: any;
  metadata?: Record<string, any>;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  whatsappNumber: string;
  instagramHandle: string;
  shopeeUrl: string;
  tokopediaUrl: string;
  tiktokShopUrl: string;
  defaultCurrency: string;
  enableStockBadges: boolean;
  lowStockThreshold: number;
  address?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface DashboardStats {
  revenue: number;
  grossProfit: number;
  netProfit: number;
  totalProducts: number;
  totalStockUnits: number;
  inventoryCapital: number;
  totalCategories: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalSoldUnits: number;
  totalAddedUnits: number;
}

export interface CSVProductRow {
  name: string;
  category: string;
  price: number;
  hpp: number;
  stock?: number;
  colors?: string; // Format: "Black:#171717:10|Cream:#E8E1D5:7" or "Black:#171717"
  links?: string;  // Format: "shopee=...;tokopedia=...;whatsapp=..."
  description?: string;
  isValid: boolean;
  validationErrors: string[];
  parsedColors: ProductColor[];
  parsedLinks: MarketplaceLinks;
}

export interface PendingStockChange {
  productId: string;
  productName: string;
  colorId?: string;
  colorName?: string;
  currentStock: number;
  type: TransactionType;
  quantity: number;
  price: number;
  hpp: number;
  note?: string;
}
