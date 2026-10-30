import { Platform } from 'react-native';

export const LIFETIME_SKU = 'com.mayuntian.stockhelper.lifetime';

let libPromise = null;
let connectionPromise = null;

export function isIapSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

// 内购库只在用户真正点购买/恢复时加载，避免一进页面就触碰 StoreKit
function loadLib() {
  if (!libPromise) {
    try {
      libPromise = Promise.resolve(require('react-native-iap'));
    } catch {
      libPromise = Promise.resolve(null);
    }
  }
  return libPromise;
}

function connect() {
  if (!isIapSupported()) return Promise.resolve(null);
  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        const iap = await loadLib();
        if (!iap) return null;
        const connected = await iap.initConnection();
        return connected ? iap : null;
      } catch {
        return null;
      }
    })();
  }
  return connectionPromise;
}

export async function subscribePurchaseEvents(onPurchase, onError) {
  const iap = await connect();
  if (!iap) return () => {};
  try {
    const updated = iap.purchaseUpdatedListener((purchase) => onPurchase(purchase));
    const failed = iap.purchaseErrorListener((error) => onError(error));
    return () => {
      updated?.remove();
      failed?.remove();
    };
  } catch {
    return () => {};
  }
}

export async function buyLifetime() {
  const iap = await connect();
  if (!iap) throw new Error('iap-unavailable');
  await iap.requestPurchase({
    request: {
      apple: { sku: LIFETIME_SKU },
      google: { skus: [LIFETIME_SKU] },
    },
    type: 'in-app',
  });
}

export async function finishLifetimePurchase(purchase) {
  const iap = await connect();
  if (!iap) return;
  try {
    await iap.finishTransaction({ purchase, isConsumable: false });
  } catch {
    // 完成后失败不影响解锁，交易会由 StoreKit 下次补完
  }
}

export async function restoreLifetime() {
  const iap = await connect();
  if (!iap) return false;
  try {
    const purchases = await iap.getAvailablePurchases();
    return (purchases ?? []).some((p) => p.productId === LIFETIME_SKU);
  } catch {
    return false;
  }
}
