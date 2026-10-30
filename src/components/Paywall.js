import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PRIVACY_URL, TERMS_URL } from '../config';
import {
  LIFETIME_SKU,
  buyLifetime,
  finishLifetimePurchase,
  isIapSupported,
  restoreLifetime,
  subscribePurchaseEvents,
} from '../lib/iap';

const BENEFITS = [
  ['8 个决策板块', '大盘、选股、买点、仓位、做T、卖点、心态、复盘'],
  ['买前先自检', '每次操作前走一遍引导，避免追涨杀跌'],
  ['一次付费长期使用', '没有订阅，不会自动续费'],
];

export default function Paywall({ visible, onClose, onPurchased, canDismiss = true, badgeText }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const purchasedRef = useRef(false);
  const unsubscribeRef = useRef(null);

  const settle = useCallback(async (purchase) => {
    await finishLifetimePurchase(purchase);
    if (purchasedRef.current) return;
    purchasedRef.current = true;
    setBusy(false);
    onPurchased();
  }, [onPurchased]);

  useEffect(() => {
    if (!visible) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setBusy(false);
      setMessage('');
    }
  }, [visible]);

  useEffect(() => () => {
    unsubscribeRef.current?.();
  }, []);

  const listenOnce = useCallback(async () => {
    if (unsubscribeRef.current) return;
    const unsubscribe = await subscribePurchaseEvents((purchase) => {
      if (purchase?.productId !== LIFETIME_SKU) return;
      settle(purchase).catch(() => {
        setBusy(false);
        setMessage('交易确认失败，请点「恢复购买」重试。');
      });
    }, (error) => {
      if (error?.code === 'E_USER_CANCELLED') {
        setBusy(false);
        return;
      }
      setBusy(false);
      setMessage('购买未完成，请稍后重试。');
    });
    unsubscribeRef.current = unsubscribe;
  }, [settle]);

  const handleBuy = useCallback(async () => {
    setMessage('');
    if (!isIapSupported()) {
      setMessage('内购功能需要在 App Store 安装的版本中使用。');
      return;
    }
    setBusy(true);
    await listenOnce();
    try {
      await buyLifetime();
    } catch {
      setBusy(false);
      setMessage('无法发起购买，请稍后重试。');
    }
  }, [listenOnce]);

  const handleRestore = useCallback(async () => {
    setMessage('');
    setBusy(true);
    const ok = await restoreLifetime();
    setBusy(false);
    if (ok) {
      purchasedRef.current = true;
      onPurchased();
    } else {
      setMessage('没有找到可恢复的购买记录。');
    }
  }, [onPurchased]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={canDismiss ? onClose : undefined}
      />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.badge}>{badgeText ?? '7 天试用已结束'}</Text>
          <Text style={styles.title}>解锁终身会员</Text>
          <Text style={styles.subtitle}>一次买断，永久使用全部决策板块</Text>

          <View style={styles.benefitList}>
            {BENEFITS.map(([title, desc]) => (
              <View key={title} style={styles.benefitRow}>
                <Text style={styles.check}>✓</Text>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitTitle}>{title}</Text>
                  <Text style={styles.benefitDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.buyBtn, busy && styles.buyBtnDisabled]}
            onPress={handleBuy}
            disabled={busy}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyText}>¥12 买断 · 永久使用</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={busy}>
            <Text style={styles.restoreText}>恢复购买</Text>
          </TouchableOpacity>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Text style={styles.legal}>
            付款后立即解锁，不自动续费。购买即表示同意
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}>
              {' '}用户协议{' '}
            </Text>
            与
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}>
              {' '}隐私政策
            </Text>
            。
          </Text>

          {canDismiss ? (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>暂时不用</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  content: {
    padding: 24,
    paddingBottom: 36,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  benefitList: {
    gap: 14,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  check: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    marginTop: 1,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  buyBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  restoreText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  legal: {
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
  link: {
    color: '#2563eb',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  closeText: {
    color: '#9ca3af',
    fontSize: 13,
  },
});
