# Release v1.8.31 — Menu agrupado para usuários empresariais

Corrigido o menu desktop dos usuários empresariais e do modo demonstração. Antes, o Super Admin utilizava grupos suspensos com subtítulos, enquanto os demais usuários podiam receber itens soltos ou uma versão diferente do menu. Agora os usuários empresariais autorizados utilizam os grupos Operação, Gestão e Configurações, com subitens exibidos no menu suspenso.

A correção mantém as permissões existentes: usuários só visualizam as opções permitidas para seu perfil, e configurações administrativas continuam limitadas aos perfis autorizados. O menu móvel permanece com os mesmos grupos em formato vertical.

Validações: TypeScript sem erros, invariantes de navegação e testes de correções de menu aprovados.
