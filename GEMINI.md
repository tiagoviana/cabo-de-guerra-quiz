# Regras do Projeto: Cabo de Guerra Quiz (Tug of War Quiz)

## 1. Identidade e Escopo do Projeto
- **Nome:** Cabo de Guerra Quiz
- **Descrição:** Um jogo multiplayer em tempo real de perguntas e respostas com temática de cabo de guerra.
- **Linguagem Principal:** JavaScript (Node.js no backend, Vanilla JS no frontend).
- **Idioma Base:** Português do Brasil (pt-BR). Comentários, nomes de variáveis de domínio (ex: `esquerda`, `direita`, `pergunta`, `resposta`), e respostas aos usuários devem usar pt-BR.

## 2. Stack Tecnológico
- **Backend:** Node.js, Express.
- **Comunicação em Tempo Real:** Socket.io.
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla). Não use frameworks front-end (React, Vue, etc.) nem bibliotecas de CSS (Tailwind, Bootstrap) a menos que explicitamente solicitado.

## 3. Diretrizes de Código
- **Backend (`server.js`):**
  - Mantenha a lógica do WebSocket limpa e modular.
  - Utilize `rooms` para isolar partidas diferentes.
  - O estado do jogo deve ser a fonte da verdade (`rooms[code]`). Não confie no cliente para regras de negócio e validação.
  - Sempre verifique a existência da sala e se o jogo não terminou antes de processar uma jogada.

- **Frontend (`public/`):**
  - Todo o código do cliente vive na pasta `public/`.
  - Mantenha a separação de responsabilidades: `index.html` para estrutura, `style.css` para estilos, `app.js` para lógica e comunicação via Socket.io.
  - Use manipuladores de eventos assíncronos e atualizações reativas na interface quando o estado via socket mudar (`stateUpdate`).

- **Estilos (`style.css`):**
  - Priorize designs responsivos, acessíveis e lúdicos, já que é um jogo.
  - Animações (ex: puxar a corda do cabo de guerra) devem ser suaves.

## 4. Diretrizes de Comunicação e IA
- Responda de forma concisa e sempre em português, a menos que solicitado de outra forma.
- Se for implementar uma nova funcionalidade que impacte o estado do jogo (ex: novos tipos de perguntas, power-ups), sempre pense em como isso afeta a sincronização do Socket.io entre o Host e os Jogadores.
- Não altere a configuração do `package.json` a menos que estejamos adicionando uma nova dependência justificada.

## 5. Testes e Validação
- Ao adicionar novas lógicas de pontuação ou movimento do cabo de guerra, verifique os casos de limite da corda (`limiteVitoria`).
- Ao enviar código que afete o Socket.io, certifique-se de tratar adequadamente as desconexões e reconexões (se suportado no futuro).
