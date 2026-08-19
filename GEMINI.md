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
- **Sala de Espera (Lobby):** Na tela de login, os alunos inserem o código e clicam em "Verificar Sala" para visualizar uma prévia (preview) de quem já está em cada grupo antes de escolher de qual equipe participar.
- **Respostas:** O jogo permite **uma resposta por jogador**, em vez de uma por grupo. Isso significa que múltiplos alunos de um mesmo grupo podem responder e pontuar na mesma rodada.
- **Tipos de Perguntas Suportados:**
  - `multipla_escolha`: Com botões de opções.
  - `digitar`: Resposta exata digitada pelo aluno (validação ignorando acentos e maiúsculas/minúsculas).
  - `aberta`: Resposta em texto livre, que exige a avaliação manual do `professor` (usando os botões de Acertou/Errou por equipe). As respostas de todos os alunos são listadas individualmente, agrupadas e separadas visualmente pelas cores da equipe.
- **Áudio e Efeitos:** O projeto utiliza a Web Audio API nativa (`audioCtx.createOscillator`) para gerar sons de 'correct', 'wrong' e 'victory'. Não importe arquivos de áudio externos a menos que solicitado.
- **Interface Gráfica (SVG e CSS):** O cabo de guerra e os personagens (bonecos palito) são renderizados nativamente via SVG (`<svg viewBox="...">`). A movimentação da corda é feita atualizando o `transform: translateX(...)` com base no estado do jogo.
- **Fim de Jogo e Créditos:** O jogo pode terminar com a vitória de uma equipe ou em um **empate**. O projeto conta com uma tela de Créditos ao final da partida e informações institucionais (logos, curso, autores) na tela de login.

## 4. Diretrizes de Código
- **Backend (`server.js`):**
  - Mantenha a lógica do WebSocket limpa e modular.
  - Utilize `rooms` para isolar partidas diferentes.
  - O estado do jogo deve ser a fonte da verdade (`rooms[code]`). Não confie no cliente para regras de negócio e validação.
  - O estado gerencia quem já respondeu em `answered` (array de nomes por grupo) e as respostas abertas em `openAnswers` (array de objetos `{ name, answer }`).

- **Frontend (`public/`):**
  - Mantenha a separação de responsabilidades: `index.html` para estrutura, `style.css` para estilos, `app.js` para lógica e comunicação via Socket.io.
  - A interface reage exclusivamente ao evento `stateUpdate` do Socket.io. A função `renderState(state)` centraliza a atualização da UI.
  - Painéis de controle são exibidos apenas para o papel `professor`.
  - O conteúdo do quiz (`quizData`) encontra-se fixado diretamente no `app.js` na versão atual.

- **Estilos (`style.css`):**
  - As cores das equipes são dinâmicas e configuradas via variáveis CSS (`--cor-esq`, `--cor-dir`), podendo ser sobrescritas pelo JSON do quiz.
  - Priorize designs responsivos e lúdicos. Animações de vitória e puxões de corda devem ser suaves (usando `transition` e `keyframes`).

## 5. Diretrizes de Comunicação e IA
- Responda de forma concisa e sempre em português, a menos que solicitado de outra forma.
- Se for implementar uma nova funcionalidade que impacte o estado do jogo (ex: novos tipos de perguntas, power-ups), sempre pense em como isso afeta a sincronização do Socket.io entre o Host e os Jogadores.
- Ao atualizar a interface no `app.js`, verifique se as alterações exigem tratamento diferenciado dependendo do `myRole` atual (`professor` vs aluno) ou se afetam a renderização de listas baseadas no `myName`.

## 6. Testes e Validação
- Ao adicionar novas lógicas de pontuação ou movimento do cabo de guerra, verifique os casos de limite da corda (`limiteVitoria`).
- Ao enviar código que afete o Socket.io, certifique-se de tratar adequadamente cenários de fluxo de jogo (ex: o que acontece se o aluno entra com a partida em andamento).
