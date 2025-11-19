import { defineStore } from 'pinia';
import type { Cart, CartItem } from '@/types';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null as Cart | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    itemCount(): number {
      if (!this.cart) return 0;
      return this.cart['@ITEMS'].reduce((sum, item) => sum + item.qty, 0);
    },

    isEmpty(): boolean {
      return !this.cart || this.cart['@ITEMS'].length === 0;
    },

    total(): number {
      return this.cart?.sum.balance_due || 0;
    },
  },

  actions: {
    async createCart() {
      this.loading = true;
      this.error = null;

      try {
        // Initialize WASM cart manager
        const { CartManager } = await import('@wasm/anycommerce_wasm');
        const manager = new CartManager();

        const cartId = `cart_${Date.now()}`;
        const cart = manager.create_cart(cartId);

        this.cart = cart;

        // Store cart ID in localStorage
        localStorage.setItem('cartId', cartId);

        return cart;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create cart';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async addItem(item: CartItem) {
      if (!this.cart) {
        await this.createCart();
      }

      this.loading = true;
      this.error = null;

      try {
        const { CartManager } = await import('@wasm/anycommerce_wasm');
        const manager = new CartManager();

        // Load current cart
        if (this.cart) {
          manager.load_cart(this.cart);
        }

        // Add item
        const updatedCart = manager.add_item(this.cart!.cart_id, item);
        this.cart = updatedCart;

        return updatedCart;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to add item';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateQuantity(sku: string, qty: number) {
      if (!this.cart) return;

      this.loading = true;
      this.error = null;

      try {
        const { CartManager } = await import('@wasm/anycommerce_wasm');
        const manager = new CartManager();

        manager.load_cart(this.cart);
        const updatedCart = manager.update_item(this.cart.cart_id, sku, qty);
        this.cart = updatedCart;

        return updatedCart;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to update item';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async removeItem(sku: string) {
      if (!this.cart) return;

      this.loading = true;
      this.error = null;

      try {
        const { CartManager } = await import('@wasm/anycommerce_wasm');
        const manager = new CartManager();

        manager.load_cart(this.cart);
        const updatedCart = manager.remove_item(this.cart.cart_id, sku);
        this.cart = updatedCart;

        return updatedCart;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to remove item';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async clearCart() {
      if (!this.cart) return;

      this.loading = true;
      this.error = null;

      try {
        const { CartManager } = await import('@wasm/anycommerce_wasm');
        const manager = new CartManager();

        manager.load_cart(this.cart);
        const updatedCart = manager.clear_cart(this.cart.cart_id);
        this.cart = updatedCart;

        return updatedCart;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to clear cart';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    loadFromStorage() {
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        // Would load from API in production
        console.log('Cart ID from storage:', cartId);
      }
    },
  },
});
