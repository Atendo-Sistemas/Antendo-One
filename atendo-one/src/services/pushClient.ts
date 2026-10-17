import { getCsrfToken } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const sessionHeaders = (mutating = false): HeadersInit => ({
  Accept: 'application/json',
  ...(mutating ? { 'X-CSRF-Token': getCsrfToken() } : {})
});

export async function registerPushNotifications(): Promise<{ success: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Web Push não é suportado por este navegador.' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Permissão de notificação negada pelo usuário.' };
    }

    const res = await fetch('/api/push/vapid-key', {
      credentials: 'include',
      headers: sessionHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.publicKey) {
      throw new Error(data.error || 'Chave VAPID não encontrada');
    }

    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...sessionHeaders(true),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    const subData = await subRes.json();
    if (!subRes.ok) {
      throw new Error(subData.error || 'Erro ao registrar subscription no servidor');
    }

    return { success: true, message: 'Notificações Push ativadas com sucesso para novos fretes!' };
  } catch (err: any) {
    console.error('Push subscription error:', err);
    return { success: false, message: err.message || 'Erro ao ativar notificações push.' };
  }
}

export async function testPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      credentials: 'include',
      headers: sessionHeaders(true)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro ao testar push');
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Não foi possível testar as notificações Push.' };
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...sessionHeaders(true),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });
  await subscription.unsubscribe();
}
