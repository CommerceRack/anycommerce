import { defineStore } from 'pinia';
import type { Product } from '@/types';

export const useProductStore = defineStore('product', {
  state: () => ({
    products: new Map<string, Product>(),
    currentProduct: null as Product | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getProductById: (state) => (pid: string) => {
      return state.products.get(pid);
    },
  },

  actions: {
    async loadProduct(pid: string) {
      this.loading = true;
      this.error = null;

      try {
        // In production, this would fetch from API
        // For now, we'll use mock data
        const product: Product = {
          pid,
          '@variations': [],
          '@inventory': {},
          '%attribs': {
            'zoovy:prod_name': 'App4.Dog Smart Treat Dispenser',
            'zoovy:prod_desc':
              'Smart pet treat dispenser with app control and table case compatibility',
            'zoovy:base_price': '99.99',
            'zoovy:prod_image1': '/images/app4dog-dispenser.jpg',
          },
        };

        // Initialize WASM product processor
        const { ProductProcessor } = await import('@wasm/anycommerce_wasm');
        const processor = new ProductProcessor();

        processor.load_product(product);

        this.products.set(pid, product);
        this.currentProduct = product;

        return product;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load product';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async calculateSku(pid: string, selections: Record<string, string>) {
      try {
        const { ProductProcessor } = await import('@wasm/anycommerce_wasm');
        const processor = new ProductProcessor();

        const product = this.products.get(pid);
        if (!product) {
          throw new Error(`Product ${pid} not found`);
        }

        processor.load_product(product);
        const sku = processor.calculate_sku(pid, selections);

        return sku;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to calculate SKU';
        throw err;
      }
    },

    async calculatePrice(pid: string, selections: Record<string, string>) {
      try {
        const { ProductProcessor } = await import('@wasm/anycommerce_wasm');
        const processor = new ProductProcessor();

        const product = this.products.get(pid);
        if (!product) {
          throw new Error(`Product ${pid} not found`);
        }

        processor.load_product(product);
        const price = processor.calculate_price(pid, selections);

        return price;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to calculate price';
        throw err;
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
