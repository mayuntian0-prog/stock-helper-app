// Web/预览环境不支持 App Store 内购，提供空实现避免打包失败
export const LIFETIME_SKU = 'com.mayuntian.stockhelper.lifetime';

export function isIapSupported() {
  return false;
}

export async function loadLifetimeProduct() {
  return null;
}

export async function buyLifetime() {
  throw new Error('iap-unsupported');
}

export async function restoreLifetime() {
  return false;
}

export function purchaseUpdatedListener() {
  return { remove() {} };
}

export function purchaseErrorListener() {
  return { remove() {} };
}

export async function finishTransaction() {}
