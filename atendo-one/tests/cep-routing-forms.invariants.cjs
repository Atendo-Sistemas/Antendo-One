const fs = require('node:fs');
const api = fs.readFileSync('server/api.ts', 'utf8');
const client = fs.readFileSync('src/services/api.ts', 'utf8');
const cep = fs.readFileSync('src/components/common/CepLookupField.tsx', 'utf8');
const budget = fs.readFileSync('src/components/budgets/BudgetManager.tsx', 'utf8');
const freight = fs.readFileSync('src/components/freight/FreightFormModal.tsx', 'utf8');

if (!api.includes("'/public/cep'")) throw new Error('CEP_PUBLIC_PATH_MISSING');
if (!api.includes("apiRouter.get('/public/cep'")) throw new Error('CEP_ENDPOINT_MISSING');
if (!api.includes('viacep.com.br/ws')) throw new Error('CEP_PROVIDER_MISSING');
if (!client.includes('lookupCep')) throw new Error('CEP_CLIENT_MISSING');
if (!cep.includes('Buscar CEP') || !cep.includes('publicTrackingApi.lookupCep')) throw new Error('CEP_COMPONENT_MISSING');
if (!budget.includes('CepLookupField') || !budget.includes('onFound={data => setDraft')) throw new Error('BUDGET_CEP_FIELD_MISSING');
if (!freight.includes('CepLookupField') || !freight.includes('setOriginAddress(data.address')) throw new Error('FREIGHT_CEP_FIELD_MISSING');
const directionsBlock = api.slice(api.indexOf("apiRouter.get('/mapbox/directions'"), api.indexOf("apiRouter.get('/public/mapbox/geocode'"));
if (directionsBlock.includes("req.user) return res.status(401)")) throw new Error('DIRECTIONS_AUTH_BLOCKING_ROUTE');
if (!budget.includes('budgetApi.directions(origin, destination)')) throw new Error('BUDGET_DIRECTIONS_CALL_MISSING');
if (!freight.includes('budgetApi.directions({ lat: origin.lat, lng: origin.lng }')) throw new Error('FREIGHT_DIRECTIONS_CALL_MISSING');
console.log('CEP_ROUTING_FORMS_INVARIANTS_OK');
