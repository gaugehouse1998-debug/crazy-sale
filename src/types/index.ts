export interface ProductVariant {
  id: string;
  sku: string;
  name: string; // e.g., "White / 12-Piece"
  attributes: Record<string, string>; // e.g. { Color: "White", "Set Size": "12 Pieces" }
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  image?: string;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  images: string[];
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  unit: string; // "Set", "Piece", "Pack"
  weightKg: number;
  isFeatured: boolean;
  isPublished: boolean;
  isSample?: boolean;
  tags: string[];
  specifications: Specification[];
  variants?: ProductVariant[];
  variantDimensions?: { name: string; options: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  destination: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CartItem {
  id: string; // unique cart line id: productId + variantId
  productId: string;
  productTitle: string;
  productSlug: string;
  image: string;
  sku: string;
  selectedVariant?: ProductVariant;
  variantDescription?: string;
  unitPrice: number;
  salePrice?: number;
  quantity: number;
  maxStock: number;
  weightKg: number;
}

export type DeliveryMethodType = 'door_to_door' | 'local_cargo' | 'self_pickup';

export type PaymentMethodType = 'advance_bank_transfer' | 'cash_on_delivery';

export type PaymentStatusType = 
  | 'unpaid' 
  | 'payment_pending' 
  | 'pending_verification' 
  | 'verified' 
  | 'rejected';

export type PaymentStatus = PaymentStatusType;

export type OrderStatusType = 
  | 'new' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'completed' 
  | 'cancelled' 
  | 'payment_pending' 
  | 'payment_issue';

export type OrderStatus = OrderStatusType;

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface PaymentAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchName: string;
  branchCode: string;
  instructions: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  image: string;
  variantId?: string;
  variantName?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  lineSubtotal: number;
  weightKg: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. CS-2026-104928
  customer: CustomerInfo;
  customerUid: string;
  customerType?: 'registered';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCity?: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  deliveryFee?: number;
  total: number;
  
  deliveryMethod: DeliveryMethodType;
  deliveryServiceName: string;
  deliveryTime: string;
  totalWeightKg: number;
  deliveryRatePerKg: number;
  
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  selectedBank?: PaymentAccount;
  paymentAccount?: PaymentAccount;
  transactionId?: string;
  paidAmount?: number;
  paymentProofUrl?: string;
  paymentNotes?: string;
  
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  
  orderStatus: OrderStatusType;
  orderNotes?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  currency: string;
  currencySymbol: string;
  adminEmail: string;
  
  doorToDoor: {
    enabled: boolean;
    serviceName: string;
    ratePerKg: number;
    deliveryTime: string;
  };
  
  localCargo: {
    enabled: boolean;
    serviceName: string;
    ratePerKg: number;
    deliveryTime: string;
  };
  
  selfPickup: {
    enabled: boolean;
    instructions: string;
    readyTime: string;
    pickupAddress: string;
  };
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuideArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  readTime: string;
  publishedDate: string;
  imageUrl: string;
  sections: { heading: string; body: string }[];
  faqs: { question: string; answer: string }[];
  seoDescription: string;
}
