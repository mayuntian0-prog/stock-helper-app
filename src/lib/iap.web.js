// Web/预览环境不支持 App Store 内购，提供空实现避免打包失败
export const LIFETIME_SKU = 'com.mayuntian.stockhelper.lifetime';

export function isIapSupported() {
  return false;
}

export async function subscribePurchaseEvents() {
  return () => {};
}

export async function buyLifetime() {
  throw new Error('iap-unsupported');
}

export async function finishLifetimePurchase() {}

export async function restoreLifetime() {
  return false;
}
