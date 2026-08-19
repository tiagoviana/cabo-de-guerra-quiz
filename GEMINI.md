# Regras do Projeto: Cabo de Guerra Quiz (Tug of War Quiz)

## 1. Identidade e Escopo do Projeto
- **Nome:** Cabo de Guerra Quiz
- **Descrição:** Um jogo multiplayer em tempo real de perguntas e respostas com temática de cabo de guerra. Voltado para uso em sala de aula (Professor vs Grupos de Alunos). Foi desenvolvido no contexto acadêmico (UFS/PPGLES).
- **Linguagem Principal:** JavaScript (Node.js no backend, Vanilla JS no frontend).
- **Idioma Base:** Português do Brasil (pt-BR). Comentários, nomes de variáveis de domínio (ex: `esquerda`, `direita`, `pergunta`, `resposta`, `professor`), e respostas aos usuários devem usar pt-BR.

## 2. Stack Tecnológico
- **Backend:** Node.js, Express.
- **Comunicação em Tempo Real:** Socket.io.
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla). Não use frameworks front-end (React, Vue, etc.) nem bibliotecas de CSS (Tailwind, Bootstrap) a menos que explicitamente solicitado.

## 3. Arquitetura e Mecânicas do Jogo
- **Papéis (Roles):** Existem três papéis fundamentais: `professor` (Host/Controlador do jogo), `esquerda` (Grupo 1) e `direita` (Grupo 2). Além do papel, os alunos fornecem o próprio **nome** ao entrar no jogo (`myName`).
- **Sala de Espera (Lobby):** Na tela de login, os alunos inserem o código e clicam em "Verificar Sala" para visualizar uma prévia de quem já está em cada grupo antes de escolher a equipe.
- **Respostas:** O jogo permite **uma resposta por jogador**, em vez de uma por grupo. Múltiplos alunos do mesmo grupo podem responder à mesma pergunta, somando pontos coletivamente.
- **Sistema de Rounds e Pontuação:** Ao invés de acabar na primeira vitória, o jogo possui **Rounds**. Quando a pontuação de uma equipe atinge o limite (ex: 100 pontos), a equipe ganha 1 Round e a corda e os pontos são resetados. O vencedor final da partida é quem tiver mais Rounds ao final de todas as perguntas (usando os pontos residuais como desempate).
- **Tipos de Perguntas Suportados:**
  - `multipla_escolha`: Com botões de opções.
  - `digitar`: Resposta exata digitada pelo aluno. A validação é flexível: ignora acentos, maiúsculas/minúsculas, pontuações e espaços extras.
  - `aberta`: Resposta em texto livre, avaliada manualmente pelo `professor` (Acertou/Errou). As respostas de todos os alunos são listadas, agrupadas e separadas visualmente pelas cores da equipe.
- **Gestão de Salas e Conexão:** Alunos que saem ou recarregam a página são removidos dinamicamente da interface dos demais. Se o professor sair da sala, o jogo é encerrado antecipadamente e o vencedor atual é declarado.
- **Áudio e Efeitos:** O projeto utiliza a Web Audio API nativa (`audioCtx.createOscillator`) para gerar sons de 'correct', 'wrong' e 'victory'.
- **Interface Gráfica (SVG e CSS):** O cabo de guerra é renderizado via SVG. A movimentação da corda é atualizada proporcionalmente aos pontos.

## 4. Diretrizes de Código
- **Backend (`server.js`):**
  - Mantenha a lógica do WebSocket limpa e modular, validando sempre entradas (ex: limites de index do array de perguntas, coerção de tipos).
  - Utilize `rooms` para isolar partidas diferentes.
  - O estado do jogo deve ser a fonte da verdade (`rooms[code]`). Não confie no cliente para regras de negócio.
  - O estado gerencia quem já respondeu (`answered`), as respostas abertas (`openAnswers`) e contabiliza o limite de vitórias (`rounds`).

- **Frontend (`public/`):**
  - O conteúdo base do quiz (`quizData`) é injetado, mas o professor pode usar a interface do Construtor de Quiz (Builder) para criar perguntas dinamicamente ou importar/exportar quizzes.
  - A interface reage ao evento `stateUpdate` do Socket.io usando `renderState(state)` de forma reativa.
  - Painéis de controle são exibidos apenas para o papel `professor`.

- **Estilos (`style.css`):**
  - As cores das equipes (`--cor-esq`, `--cor-dir`) são variáveis CSS dinâmicas baseadas nas configurações do quiz.
  - Animações e controles de UI devem ser amigáveis e minimalistas.

## 5. Diretrizes de Comunicação e IA
- Responda de forma concisa e sempre em português, a menos que solicitado de outra forma.
- Se for implementar uma nova funcionalidade, pense sempre em como ela afeta a sincronização do Socket.io entre o Host e os Jogadores (ex: como atualizar o `state`).
- Ao atualizar a interface no `app.js`, verifique se as alterações exigem tratamento diferenciado dependendo do `myRole` (ex: botões extras para o professor).

## 6. Testes e Validação
- Ao adicionar novas lógicas, trate adequadamente cenários de limite (ex: `state.currentQ < 0`), tipos de dados forjados no socket e fluxo de jogo interativo.
- Certifique-se de que modificações visuais não quebrem a responsividade dos elementos SVG ou dos cartões de layout.
