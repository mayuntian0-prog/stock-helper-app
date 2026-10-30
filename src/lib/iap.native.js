import { Platform } from 'react-native';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';

export const LIFETIME_SKU = 'com.mayuntian.stockhelper.lifetime';

export function isIapSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function loadLifetimeProduct() {
  if (!isIapSupported()) return null;
  try {
    const connected = await initConnection();
    if (!connected) return null;
    const products = await fetchProducts({
      skus: [LIFETIME_SKU],
      type: 'in-app',
    });
    const list = Array.isArray(products) ? products : [];
    return list.find((p) => p.productId === LIFETIME_SKU) ?? list[0] ?? null;
  } catch {
    return null;
  }
}

export async function buyLifetime() {
  await requestPurchase({
    request: {
      apple: { sku: LIFETIME_SKU },
      google: { skus: [LIFETIME_SKU] },
    },
    type: 'in-app',
  });
}

export async function restoreLifetime() {
  if (!isIapSupported()) return false;
  try {
    const connected = await initConnection();
    if (!connected) return false;
    const purchases = await getAvailablePurchases();
    return (purchases ?? []).some((p) => p.productId === LIFETIME_SKU);
  } catch {
    return false;
  }
}

export {
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
};
