<template>
  <div class="cart-display">
    <h3>Shopping Cart ({{ itemCount }} items)</h3>

    <div v-if="cart && !isEmpty" class="cart-items">
      <div v-for="item in cart['@ITEMS']" :key="item.sku" class="cart-item">
        <div class="item-name">{{ item.prod_name }}</div>
        <div class="item-details">
          <div class="item-price">${{ item.price.toFixed(2) }}</div>
          <input
            type="number"
            v-model.number="item.qty"
            @change="updateQty(item.sku, item.qty)"
            min="0"
            class="qty-input"
          />
          <button @click="removeItem(item.sku)" class="btn-remove">Remove</button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-line">
          <span>Items Total:</span>
          <span>${{ cart.sum.items_total.toFixed(2) }}</span>
        </div>
        <div class="summary-line">
          <span>Shipping:</span>
          <span>${{ cart.sum.shipping_total.toFixed(2) }}</span>
        </div>
        <div class="summary-line">
          <span>Tax:</span>
          <span>${{ cart.sum.tax_total.toFixed(2) }}</span>
        </div>
        <div class="summary-line total">
          <span>Total:</span>
          <span>${{ cart.sum.balance_due.toFixed(2) }}</span>
        </div>
      </div>

      <div class="cart-actions">
        <button @click="clearCart" class="btn-clear">Clear Cart</button>
        <button class="btn-checkout">Proceed to Checkout</button>
      </div>
    </div>

    <div v-else class="cart-empty">
      <p>Your cart is empty</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore } from '@/stores/cart';

const cartStore = useCartStore();

const cart = computed(() => cartStore.cart);
const itemCount = computed(() => cartStore.itemCount);
const isEmpty = computed(() => cartStore.isEmpty);

const updateQty = async (sku: string, qty: number) => {
  try {
    await cartStore.updateQuantity(sku, qty);
  } catch (err) {
    console.error('Failed to update quantity:', err);
  }
};

const removeItem = async (sku: string) => {
  try {
    await cartStore.removeItem(sku);
  } catch (err) {
    console.error('Failed to remove item:', err);
  }
};

const clearCart = async () => {
  if (confirm('Are you sure you want to clear your cart?')) {
    try {
      await cartStore.clearCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }
};
</script>

<style scoped>
.cart-display {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  max-width: 800px;
}

h3 {
  margin: 0 0 1rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.item-name {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-price {
  font-weight: bold;
  color: #2e7d32;
}

.qty-input {
  width: 60px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-remove {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.cart-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-line.total {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
}

.cart-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-clear {
  background-color: #757575;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-checkout {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.cart-empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
