# Referência externa usada no diagnóstico Cloudflare/Traefik

Fonte oficial: [Traefik & Docker Swarm](https://doc.traefik.io/traefik/reference/routing-configuration/other-providers/swarm/)

A documentação do provider Swarm do Traefik v3 informa que os labels devem ser associados ao serviço Swarm e que o label `traefik.swarm.network` sobrescreve a rede Docker usada para conectar ao contêiner/serviço.

Aplicação ao ambiente Atendo One: os logs do Traefik mostraram busca pela rede `AtendoNet`, enquanto o serviço `elolog_app` estava conectado à rede `AtendoNet_v2`. O label aplicado ao serviço foi `traefik.swarm.network=AtendoNet_v2`; o label legado `traefik.docker.network` foi removido.

A documentação também informa que, no Swarm, o label da porta do serviço é necessário para registrar a porta interna, e o serviço do Atendo One usa `traefik.http.services.elolog.loadbalancer.server.port=3000`.

Fonte de migração relacionada: [Traefik v3 migration — v3.2.2 Swarm Provider Label Updates](https://doc.traefik.io/traefik/migration/v3/)
