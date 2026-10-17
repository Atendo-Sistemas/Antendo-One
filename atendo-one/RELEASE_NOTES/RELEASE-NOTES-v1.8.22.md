# Atendo One v1.8.22

## 🔒 Segurança Crítica: Vulnerabilidade Token Mapbox Exposto

### Problema Identificado
Na versão v1.8.20/v1.8.21, o rastreamento ao vivo (`LiveRouteTrackingModal.tsx`) realizava geocodificação diretamente via Mapbox com o token API exposto na URL do cliente:

```javascript
// ❌ VULNERÁVEL: Token exposto no fetch do navegador
const response = await fetch(
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxRuntime.apiKey}`
);
```

### Solução Implementada

#### 1️⃣ Novo Endpoint Protegido
- ✅ POST `/api/mapbox/geocode-tracking` com autenticação obrigatória
- ✅ Token Mapbox processado apenas no backend
- ✅ Coordenadas retornadas sem exposição de credenciais
- ✅ Validação: requer usuário autenticado + token válido

#### 2️⃣ Frontend Seguro
- ✅ `LiveRouteTrackingModal.tsx` migrado para `budgetApi.geocodeTracking()`
- ✅ Chamadas ao novo endpoint `/api/mapbox/geocode-tracking`
- ✅ Fallback automático para Leaflet quando Mapbox indisponível
- ✅ Tratamento visual de erros de geocodificação

#### 3️⃣ Separação de Responsabilidades
- ✅ `budgetApi.geocode()` - Para orçamentos (já protegido em v1.8.20)
- ✅ `budgetApi.geocodeTracking()` - Para rastreamento (novo, seguro)
- ✅ Isolamento de chamadas públicas vs. protegidas

---

## 🛡️ Autorização Super Admin

Adicionado guard `isSuperAdminRequest()` para endpoints críticos:

- ✅ Endpoints de Configuração SaaS (SEO, Conteúdo Global, Notificações)
- ✅ Validação de role `SUPER_ADMIN` obrigatória
- ✅ Proteção consistente contra contas teste/demo
- ✅ Rejeição silenciosa de requisições não autorizadas

---

## 🔄 Validações Adicionais

### Cache de Endereços
- ✅ Isolamento por tenant (prefixo no cache)
- ✅ Limpeza automática ao trocar tenant
- ✅ Evita vazamento de dados entre empresas

### Orçamento → Frete
- ✅ Verifica `convertedFreightId` antes de reconverter
- ✅ Mensagem de confirmação ao usuário
- ✅ Log de auditoria de conversão

### Mapbox Configuration
- ✅ Valida habilitação antes de geocodificar
- ✅ Fallback para Leaflet se indisponível
- ✅ Mensagens de erro amigáveis ao usuário

---

## 📝 Arquivos Alterados

| Arquivo | Mudança | Impacto |
|---------|---------|--------|
| `src/components/tracking/LiveRouteTrackingModal.tsx` | Geocodificação via novo endpoint | 🔴 CRÍTICO |
| `src/services/api.ts` | Novo método `geocodeTracking()` | 🟠 MÉDIO |
| `server/api.ts` | Endpoint `/mapbox/geocode-tracking` + guards | 🔴 CRÍTICO |

---

## ✅ Testes Recomendados

1. **Rastreamento ao Vivo**: Verificar geocodificação de endereços em `LiveRouteTrackingModal`
2. **Orçamento**: Testar cálculo de rota e seleção de endereços em `BudgetManager`
3. **Super Admin**: Validar acesso a painéis de configuração
4. **Contas Teste**: Confirmar que demo/teste não conseguem salvar configs críticas
5. **Fallback**: Desabilitar Mapbox e validar funcionamento com Leaflet

---

## 🚀 Compatibilidade

- ✅ PostgreSQL: Sem mudanças
- ✅ Volumes: Sem mudanças
- ✅ Migrations: Sem mudanças
- ✅ Autenticação: Sem mudanças
- ⚠️ Frontend: Requer rebuild (`npm run build`)
- ⚠️ Backend: Requer restart

---

## 📦 Upgrade Path

```bash
# 1. Pull changes
git pull origin main

# 2. Install dependencies (se necessário)
npm install

# 3. Build frontend
npm run build

# 4. Start server
npm start

# 5. Verificar logs
# Procure por "✅ MAPBOX_GEOCODE_TRACKING_OK" nos testes
```

---

## 🔍 Verificação Pós-Deploy

```bash
# Rodar testes de invariantes
npm test

# Verificar logs de inicialização
grep "MAPBOX\|WHATSAPP\|CONFIG_ENCRYPTION" logs/startup.log

# Testar endpoint protegido
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mapbox/geocode-tracking?q=São%20Paulo"
```

---

## 📋 Notas Importantes

- **Segurança**: Esta é uma correção de vulnerabilidade CRÍTICA. Implantação recomendada imediatamente.
- **Backward Compatibility**: Endpoints anteriores preservados; apenas novo método adicionado.
- **Fallback**: Sistema continua funcionando com Leaflet se Mapbox não responder.
- **Auditoria**: Todas as credenciais continuam criptografadas em `app_secrets`.

**Versão anterior correlata**: v1.8.20 (Persistência de credenciais), v1.8.21 (Interface simplificada)

---

**Data**: 2026-09-13  
**Commit**: 9643821fe5b56e1a074dd048ad9d0c865172d176  
**Status**: ✅ Pronto para Produção
