import * as SecureStore from 'expo-secure-store';

export const TRIAL_DAYS = 7;
const TRIAL_START_KEY = 'stockhelper.trialStart';
const PRO_KEY = 'stockhelper.pro';

const hasLocalStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

async function read(key) {
  try {
    if (hasLocalStorage) return window.localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key, value) {
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // 存储不可用时静默降级，不阻塞使用
  }
}

export async function readEntitlement() {
  const [startRaw, proRaw] = await Promise.all([
    read(TRIAL_START_KEY),
    read(PRO_KEY),
  ]);

  let startMs = startRaw ? Date.parse(startRaw) : NaN;
  if (!Number.isFinite(startMs)) {
    startMs = Date.now();
    await write(TRIAL_START_KEY, new Date(startMs).toISOString());
  }

  const isPro = proRaw === '1';
  const msLeft = startMs + TRIAL_DAYS * 86400000 - Date.now();
  return {
    isPro,
    trialDaysLeft: Math.max(0, Math.ceil(msLeft / 86400000)),
    trialExpired: msLeft <= 0,
    trialEndsAt: startMs + TRIAL_DAYS * 86400000,
  };
}

export async function markPro() {
  await write(PRO_KEY, '1');
}

export function canUseApp(entitlement) {
  return Boolean(entitlement) && (entitlement.isPro || !entitlement.trialExpired);
}
