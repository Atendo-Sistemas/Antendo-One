# Atendo One v1.8.12 — Hardening de segurança

## Implementado

- Rate limit separado por operação de autenticação, com backoff progressivo após falhas consecutivas.
- Bloqueio temporário crescente para login, OTP, cadastro e recuperação.
- Exigência configurável de HTTPS com redirecionamento 308 quando `REQUIRE_HTTPS=true` ou quando produção usa `APP_URL` HTTPS.
- Auditoria de falhas de login e verificação de OTP sem registrar o telefone completo.
- Procedimento não destrutivo de verificação de restauração em homologação: `ops/elolog-restore-verify.sh`.
- Atualização de `sanitize-html` para 2.17.7.
- Override de `qs` para 6.16.0 em toda a árvore transitiva.
- Novo teste `tests/security-hardening.invariants.cjs`.

## Validação

- `npm audit --omit=dev`: 0 vulnerabilidades.
- `npm run lint`: PASS.
- `npm test`: PASS.
- `npm run build`: PASS.
- ZIP e SHA256 verificados.

O aviso de chunk Mapbox acima de 500 kB permanece não bloqueante.

## Limites externos

Turnstile/CAPTCHA, 2FA, firewall, SSH, criptografia do host, backup externo, restauração real em produção e auditoria do Docker Swarm continuam dependendo de configuração, credenciais ou acesso ao ambiente externo.
