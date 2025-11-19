<script setup lang="ts">
import { onMounted } from 'vue';
import ProductCard from './components/Product/ProductCard.vue';
import CartDisplay from './components/Cart/CartDisplay.vue';
import { useCartStore } from './stores/cart';

const cartStore = useCartStore();

onMounted(async () => {
  // Initialize cart on app load
  cartStore.loadFromStorage();
});
</script>

<template>
  <div class="app">
    <header>
      <h1>🐕 App4.Dog E-Commerce</h1>
      <p class="subtitle">Smart Pet Treat Dispensers & Table Cases</p>
    </header>

    <main class="container">
      <section class="product-section">
        <h2>Featured Product</h2>
        <ProductCard pid="APP4DOG-001" />
      </section>

      <section class="cart-section">
        <h2>Your Cart</h2>
        <CartDisplay />
      </section>

      <footer class="tech-info">
        <p>
          <strong>Technology Stack:</strong> Vue 3 + TypeScript + Rust/WASM + Pinia
        </p>
        <p>
          <em>Legacy jQuery codebase successfully migrated to modern architecture</em>
        </p>
      </footer>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.product-section,
.cart-section {
  margin-bottom: 3rem;
}

.product-section h2,
.cart-section h2 {
  font-size: 1.75rem;
  margin-bottom: 1rem;
  color: #444;
}

.tech-info {
  margin-top: 4rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  text-align: center;
  color: #666;
}

.tech-info p {
  margin-bottom: 0.5rem;
}

.tech-info strong {
  color: #333;
}
</style>
