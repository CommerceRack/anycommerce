// Core types for AnyCommerce Vue3 frontend

export interface Product {
  pid: string;
  '@variations': Variation[];
  '@inventory': Record<string, InventoryItem>;
  '%attribs': Record<string, any>;
}

export interface Variation {
  id: string;
  prompt: string;
  type: string;
  '@options': VariationOption[];
}

export interface VariationOption {
  v: string;
  prompt: string;
  price_mod?: number;
}

export interface InventoryItem {
  SKU: string;
  AVAILABLE: string;
  ONSHELF: string;
}

export interface CartItem {
  sku: string;
  pid: string;
  prod_name: string;
  qty: number;
  base_price: number;
  price: number;
  variations?: Record<string, string>;
}

export interface CartSummary {
  items_total: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  balance_due: number;
}

export interface Cart {
  cart_id: string;
  '@ITEMS': CartItem[];
  sum: CartSummary;
  want: CheckoutPreferences;
  coupons: string[];
}

export interface CheckoutPreferences {
  shipping_id?: string;
  payby?: string;
}

export interface ApiRequest {
  _cmd: string;
  [key: string]: any;
}

export interface ApiResponse {
  '@MESSAGES'?: ApiMessage[];
  [key: string]: any;
}

export interface ApiMessage {
  '@CODE': string;
  '@TYPE': string;
  '@TEXT': string;
}

export enum QueueType {
  Mutable = 0,
  Immutable = 1,
  Passive = 2,
}
