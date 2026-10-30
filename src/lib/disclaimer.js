import * as SecureStore from 'expo-secure-store';

const ACCEPTED_KEY = 'stockhelper.disclaimerAccepted';

const hasLocalStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const DISCLAIMER_TEXT =
  '本工具仅提供交易决策流程的梳理与自我检查，所有内容均为通用经验总结，不构成任何证券投资建议、不推荐任何具体股票或买卖时机。股市有风险，投资需谨慎，盈亏由您自行承担。';

export async function readDisclaimerAccepted() {
  try {
    const raw = hasLocalStorage
      ? window.localStorage.getItem(ACCEPTED_KEY)
      : await SecureStore.getItemAsync(ACCEPTED_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function acceptDisclaimer() {
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(ACCEPTED_KEY, '1');
      return;
    }
    await SecureStore.setItemAsync(ACCEPTED_KEY, '1');
  } catch {
    // 存储不可用时本次会话仍放行，下次启动会再次提示
  }
}
