# App Android do Motorista (Capacitor)

O app empacota o front-end Vite (`dist`) com Capacitor (`capacitor.config.json`).

## Passos
1. `npm i @capacitor/core @capacitor/android @capacitor/push-notifications @capacitor-community/background-geolocation && npm i -D @capacitor/cli`
2. `npx cap add android` (uma vez) e `npm run cap:sync`.
3. Adicionar `google-services.json` (Firebase) em `android/app` e definir `FCM_SERVICE_ACCOUNT_JSON` no servidor.
4. Permissões no AndroidManifest: `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE_LOCATION`, `POST_NOTIFICATIONS`.
5. Criar o canal de notificação `fretes` (alta prioridade).
6. `npm run android:build` gera o AAB (assinar no CI).

## Backend
- `POST /api/mobile/push-token` aceita tokens Expo e FCM (`kind: 'fcm'`), somente motoristas reais.
- Envio via FCM HTTP v1 com `FCM_SERVICE_ACCOUNT_JSON`.
- `POST /api/drivers/me/location`: exige opt-in, limite de 1 envio a cada 5 s; desativar apaga a localização.
- Autenticação nativa usa `Authorization: Bearer`.

## Pendências
Login exclusivo de motorista no app, GPS em segundo plano nativo, histórico por frete e política de retenção LGPD.

## Configuração do servidor para o app
- `MOBILE_APP_ORIGINS=https://localhost,capacitor://localhost` libera CORS para o WebView do Capacitor.
- O app deve enviar `X-Atendo-Client: atendo-one-motorista-beta` no login para receber `accessToken`/`refreshToken` no corpo e usar `Authorization: Bearer` (sem CSRF).
