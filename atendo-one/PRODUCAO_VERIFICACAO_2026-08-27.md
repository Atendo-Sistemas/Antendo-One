# Verificação pública de produção — 27/08/2026

URL verificada: https://gestor.atendo.log.br/

A Home respondeu com conteúdo institucional do Atendo One/Elo Log, planos comerciais, páginas de conteúdo e acesso ao login. Não houve texto técnico de carregamento visível na captura.

URL verificada: https://gestor.atendo.log.br/manifest.json

O manifesto publicado ainda é o anterior:

- `start_url`: `/`
- ícone declarado: `/favicon.svg`
- não há os ícones `/icons/atendo-one-192.png` e `/icons/atendo-one-512.png`

Conclusão: a produção ainda não contém o manifesto PWA da v1.7.4. A versão atualmente publicada é compatível com a linha anterior v1.7.3, mas a confirmação numérica exata da versão não aparece na Home nem no manifesto; a confirmação definitiva deve ser feita após o deploy consultando a versão visível no painel e os assets da release.

Durante o acompanhamento da atualização, `https://gestor.atendo.log.br/health` retornou a página pública de 404 (`Página não encontrada`). Isso não permite concluir indisponibilidade da aplicação: o endpoint de saúde pode estar exposto internamente ou em outra rota, e a Home pública continuou respondendo. A validação definitiva deve usar os comandos Docker na VPS e os smoke tests de Home/manifesto.

Teste de login via WhatsApp com Cloudflare proxied ativo: a página `/login` abriu, o número foi preenchido e o botão de solicitação foi acionado com confirmação do usuário. A resposta exibida foi uma página Cloudflare `502 Bad gateway`, indicando `Host Error` para `gestor.atendo.log.br`; Cloudflare e navegador foram marcados como funcionando. A falha ocorreu durante a solicitação transacional de OTP, não no carregamento inicial da Home.

Diagnóstico adicional do Traefik: os logs avisaram que não encontraram a rede `AtendoNet` para o contêiner `elolog_app.1` e fizeram fallback para `AtendoNet_v2`/IP interno `10.0.2.89`, porta 3000. A rota `elolog` para `gestor.atendo.log.br` foi publicada pelo Traefik em HTTPS, mas com a rede declarada incorretamente/ambígua. Esse fallback de rede é candidato principal ao 502 observado quando o Cloudflare faz proxy da solicitação de OTP.

Reteste após adicionar `traefik.swarm.network=AtendoNet_v2`: a Home/login continuam acessíveis, mas ao solicitar o OTP pelo navegador com Cloudflare proxied ativo a resposta continua sendo `502 Bad gateway` do Cloudflare, com `Host Error` em `gestor.atendo.log.br`. O aviso de rede do Traefik observado no intervalo passou a ser de `wacalls`, não de `elolog`, portanto a causa não foi eliminada pelo label de rede; ainda é necessário diagnosticar o encaminhamento da requisição POST do OTP/origin.

Teste externo sem credenciais: `GET https://off.atendo.log.br/` retornou 200 com página de backend; `POST https://off.atendo.log.br/` com JSON vazio retornou 404 `Cannot POST /`. Como o código do Atendo envia para `config.baseUrl` exatamente, uma configuração contendo apenas `https://off.atendo.log.br` aponta para rota inexistente. O contêiner expôs esse host como `WHATSAPP_API_URL`; a configuração persistida em segredo/banco pode ainda sobrescrever o valor, mas o endpoint completo precisa ser confirmado no painel/API.

Novo erro informado pelo usuário: ao sair do painel e tentar acessar novamente com o proxy Cloudflare ativo, foi exibida uma página Cloudflare `502 Bad gateway` para `gestor.atendo.log.br`, em 2026-08-27 14:16:48 UTC, Ray ID `a31bb2360d5e3359`. O host foi marcado como Error; navegador e Cloudflare como Working. O usuário pretende desativar temporariamente a nuvem laranja para recuperar o acesso.

Novo erro após o usuário desativar a nuvem laranja: a página ainda retornou Cloudflare `502 Bad gateway` para `gestor.atendo.log.br` em 2026-08-27 14:18:25 UTC, Ray ID `a31bb493f93b9aa6`. O host continuou marcado como Error. Isso sugere que a alteração DNS ainda não se propagou para o cliente, que o registro continua proxied em outra camada, ou que o erro está sendo gerado pelo origin/Traefik e apenas formatado pela Cloudflare.

Reteste no navegador após salvar a URL completa do canal e testar envio manual com sucesso: a Home/login abriu diretamente pelo origin, mas a solicitação de login OTP para `17988395429` retornou a mensagem segura `Não foi possível enviar o código OTP pelo WhatsApp. Verifique a configuração ou a sessão do canal e tente novamente.` em 2026-08-27 14:22. O erro não foi mais HTML Cloudflare/502 visível no frontend; o endpoint do Gestor respondeu sua mensagem JSON de falha, indicando que o gateway rejeitou ou não aceitou o payload específico do OTP.
