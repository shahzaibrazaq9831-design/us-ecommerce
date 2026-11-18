/** Client-safe data transfer objects for the admin dashboard. */

export interface AdminProduct {
  id: number;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  brandSlug: string;
  brandName: string;
  occasionSlugs: string[];
  price: number;
  salePrice: number | null;
  stock: number;
  stitching: string[];
  isNew: boolean;
  isBestSeller: boolean;
  onSale: boolean;
  status: "draft" | "active" | "hidden";
  sku: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminTaxonomyItem {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  productSlug: string;
  productName: string;
  rating: number;
  text: string;
  author: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  verified: boolean;
  photoUrl: string;
  orderId: string;
}

export interface AdminCustomer {
  email: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
  city: string;
  country: string;
}

export interface AdminOrderDetailItem {
  name: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  stitching: string;
  size: string;
  lining: string;
  measurements: { label: string; value: string }[];
  notes: string;
}

export interface AdminOrderDetail {
  id: string;
  date: string;
  customer: string;
  email: string;
  phone: string;
  address: string[];
  items: AdminOrderDetailItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string;
  courier: string;
  notes: string;
  status: string;
  history: { at: string; message: string; type: string; by: string }[];
}

export interface AdminSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  shippingText: string;
  announcementText: string;
  returnsText: string;
}

export interface DashboardOrder {
  id: string;
  date: string;
  customer: string;
  email: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: number;
  city: string;
  country: string;
  stitching: string[];
  trackingNumber: string;
  courier: string;
}

export interface RevenuePoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  slug: string;
  stock: number;
  image: string;
}

export interface NamedValue {
  name: string;
  value: number;
  slug?: string;
}

export interface AdminSnapshot {
  source: "supabase" | "local" | "unavailable";
  schemaNotice: string | null;
  productRanking: NamedValue[];
  brandRanking: NamedValue[];
  products: AdminProduct[];
  categories: AdminTaxonomyItem[];
  brands: AdminTaxonomyItem[];
  occasions: AdminTaxonomyItem[];
  reviews: AdminReview[];
  orders: DashboardOrder[];
  customers: AdminCustomer[];
  settings: AdminSettings;
}

export interface DashboardAnalytics {
  revenueSeries: RevenuePoint[];
  statusCounts: NamedValue[];
  topProducts: NamedValue[];
  topBrands: NamedValue[];
  categoryCounts: NamedValue[];
  occasionCounts: NamedValue[];
  cityCounts: NamedValue[];
  countryCounts: NamedValue[];
  ratingBreakdown: NamedValue[];
}
