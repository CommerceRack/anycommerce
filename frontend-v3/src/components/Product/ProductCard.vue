<template>
  <div class="product-card">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="product" class="product-content">
      <div class="product-image">
        <img :src="productImage" :alt="productName" />
      </div>
      <div class="product-details">
        <h2>{{ productName }}</h2>
        <p class="description">{{ productDescription }}</p>
        <div class="price">{{ formattedPrice }}</div>
        <button @click="addToCart" class="btn-add-cart">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/product';
import { useCartStore } from '@/stores/cart';
import type { Product } from '@/types';

const props = defineProps<{
  pid: string;
}>();

const productStore = useProductStore();
const cartStore = useCartStore();

const loading = ref(false);
const error = ref<string | null>(null);
const product = ref<Product | null>(null);

const productName = computed(() => {
  return product.value?.['%attribs']?.['zoovy:prod_name'] || 'Unnamed Product';
});

const productDescription = computed(() => {
  return product.value?.['%attribs']?.['zoovy:prod_desc'] || '';
});

const productImage = computed(() => {
  return product.value?.['%attribs']?.['zoovy:prod_image1'] || '/placeholder.jpg';
});

const formattedPrice = computed(() => {
  const price = product.value?.['%attribs']?.['zoovy:base_price'] || '0.00';
  return `$${price}`;
});

const addToCart = async () => {
  try {
    await cartStore.addItem({
      sku: props.pid,
      pid: props.pid,
      prod_name: productName.value,
      qty: 1,
      base_price: parseFloat(product.value?.['%attribs']?.['zoovy:base_price'] || '0'),
      price: parseFloat(product.value?.['%attribs']?.['zoovy:base_price'] || '0'),
    });
    alert('Product added to cart!');
  } catch (err) {
    console.error('Failed to add to cart:', err);
    alert('Failed to add to cart');
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    product.value = await productStore.loadProduct(props.pid);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load product';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  max-width: 600px;
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
}

.error {
  color: #d32f2f;
}

.product-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
}

.product-image img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.product-details h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.75rem;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 1rem;
}

.btn-add-cart {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-cart:hover {
  background-color: #1565c0;
}
</style>
