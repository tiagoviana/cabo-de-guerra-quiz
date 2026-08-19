const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

function createEmptyGameState() {
    return {
        quiz: null,
        ropePos: 0,
        currentQ: -1,
        scores: { esquerda: 0, direita: 0 },
        rounds: { esquerda: 0, direita: 0 },
        answered: { esquerda: [], direita: [] },
        winner: null,
        isGameOver: false,
        showAnswer: false,
        players: { esquerda: [], direita: [] },
        openAnswers: { esquerda: [], direita: [] } // Guarda as respostas de texto livre
    };
}

io.on('connection', (socket) => {
    
    socket.on('createRoom', () => {
        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        rooms[roomCode] = createEmptyGameState();
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.role = 'professor';
        socket.emit('roomCreated', roomCode);
    });

    socket.on('checkRoom', (code) => {
        if (rooms[code]) {
            socket.join(code);
            socket.emit('roomChecked', rooms[code]);
        } else {
            socket.emit('roomError', 'Sala não encontrada. Verifique o código.');
        }
    });

    socket.on('joinRoom', ({ code, role, name }) => {
        if (rooms[code]) {
            socket.join(code);
            socket.roomCode = code;
            socket.role = role;
            socket.playerName = name;
            
            if (name && (role === 'esquerda' || role === 'direita')) {
                if (!rooms[code].players[role].includes(name)) {
                    rooms[code].players[role].push(name);
                    io.to(code).emit('stateUpdate', rooms[code]);
                }
            }

            socket.emit('joined', { code, role, state: rooms[code] });
        } else {
            socket.emit('error', 'Sala não encontrada.');
        }
    });

    socket.on('loadQuiz', ({ code, quizData }) => {
        if (rooms[code]) {
            const currentPlayers = rooms[code].players;
            rooms[code] = createEmptyGameState();
            rooms[code].players = currentPlayers;
            rooms[code].quiz = quizData;
            io.to(code).emit('stateUpdate', rooms[code]);
        }
    });

    socket.on('startGame', (code) => {
        if (rooms[code] && rooms[code].quiz) {
            rooms[code].currentQ = 0;
            rooms[code].ropePos = 0;
            rooms[code].winner = null;
            rooms[code].isGameOver = false;
            rooms[code].scores = { esquerda: 0, direita: 0 };
            rooms[code].rounds = { esquerda: 0, direita: 0 };
            rooms[code].answered = { esquerda: [], direita: [] };
            rooms[code].openAnswers = { esquerda: [], direita: [] };
            rooms[code].showAnswer = false;
            io.to(code).emit('stateUpdate', rooms[code]);
        }
    });

    socket.on('nextQuestion', (code) => {
        const state = rooms[code];
        if (state && state.quiz) {
            if (state.currentQ < state.quiz.perguntas.length - 1) {
                state.currentQ++;
                state.answered = { esquerda: [], direita: [] };
                state.openAnswers = { esquerda: [], direita: [] }; // Limpa as respostas abertas
                state.showAnswer = false;
                io.to(code).emit('stateUpdate', state);
            } else {
                state.isGameOver = true;
                
                if (state.rounds.esquerda > state.rounds.direita) {
                    state.winner = 'esquerda';
                } else if (state.rounds.direita > state.rounds.esquerda) {
                    state.winner = 'direita';
                } else {
                    if (state.scores.esquerda > state.scores.direita) state.winner = 'esquerda';
                    else if (state.scores.direita > state.scores.esquerda) state.winner = 'direita';
                    else state.winner = 'empate';
                }
                
                io.to(code).emit('stateUpdate', state);
                if (state.winner !== 'empate') io.to(code).emit('playSound', 'victory');
            }
        }
    });

    socket.on('revealAnswer', (code) => {
        if (rooms[code]) {
            rooms[code].showAnswer = true;
            io.to(code).emit('stateUpdate', rooms[code]);
        }
    });

    socket.on('submitAnswer', ({ code, team, name, answer }) => {
        const state = rooms[code];
        if (!state || state.winner || state.isGameOver || state.currentQ < 0 || state.currentQ >= state.quiz.perguntas.length) return;
        
        const q = state.quiz.perguntas[state.currentQ];
        if (state.answered[team].includes(name)) return;
        
        // NOVO: Se for pergunta aberta, salva o texto e encerra a função aqui, sem som de erro/acerto.
        if (q.tipo === 'aberta') {
            state.openAnswers[team].push({ name, answer });
            state.answered[team].push(name);
            io.to(code).emit('stateUpdate', state);
            return;
        }

        state.answered[team].push(name);
        let isCorrect = false;

        if (q.tipo === 'multipla_escolha') {
            isCorrect = parseInt(answer) === q.respostaCorretaIndex;
        } else if (q.tipo === 'digitar') {
            const normalize = (str) => String(str || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .toLowerCase()
                .trim();
            const normAnswer = normalize(answer);
            
            if (Array.isArray(q.respostasAceitas)) {
                isCorrect = q.respostasAceitas.some(acc => normalize(acc) === normAnswer);
            } else {
                isCorrect = false;
            }
        }

        processAnswer(code, state, team, isCorrect, q.tipo !== 'aberta');
        io.to(code).emit('stateUpdate', state);
        io.to(code).emit('playSound', isCorrect ? 'correct' : 'wrong');
    });

    socket.on('manualGrade', ({ code, team, isCorrect }) => {
        const state = rooms[code];
        if (state && !state.winner && !state.isGameOver && state.currentQ >= 0 && state.currentQ < state.quiz.perguntas.length) {
            processAnswer(code, state, team, isCorrect, true);
            io.to(code).emit('stateUpdate', state);
            io.to(code).emit('playSound', isCorrect ? 'correct' : 'wrong');
        }
    });

    function processAnswer(code, state, team, isCorrect, moveRope) {
        if (!moveRope) return;
        
        const step = state.quiz.config.passoPorAcerto;
        const limit = state.quiz.config.limiteVitoria;
        const pullTarget = team === 'esquerda' ? -step : step;

        if (isCorrect) {
            state.ropePos += pullTarget;
            state.scores[team] += state.quiz.perguntas[state.currentQ].pontos;
        } else if (state.quiz.config.erroPuxaAdversario) {
            state.ropePos -= pullTarget;
        }

        if (state.ropePos < -limit) state.ropePos = -limit;
        if (state.ropePos > limit) state.ropePos = limit;

        const metaDePontos = limit;

        if (state.scores.esquerda >= metaDePontos) {
            state.rounds.esquerda++;
            state.scores.esquerda = 0;
            state.scores.direita = 0;
            state.ropePos = 0;
            io.to(code).emit('playSound', 'victory');
        } else if (state.scores.direita >= metaDePontos) {
            state.rounds.direita++;
            state.scores.esquerda = 0;
            state.scores.direita = 0;
            state.ropePos = 0;
            io.to(code).emit('playSound', 'victory');
        }
    }
    
    socket.on('disconnect', () => {
        const { roomCode, role, playerName } = socket;
        if (roomCode && rooms[roomCode]) {
            if (role === 'professor') {
                const state = rooms[roomCode];
                if (!state.isGameOver) {
                    state.isGameOver = true;
                    if (state.rounds.esquerda > state.rounds.direita) {
                        state.winner = 'esquerda';
                    } else if (state.rounds.direita > state.rounds.esquerda) {
                        state.winner = 'direita';
                    } else {
                        if (state.scores.esquerda > state.scores.direita) state.winner = 'esquerda';
                        else if (state.scores.direita > state.scores.esquerda) state.winner = 'direita';
                        else state.winner = 'empate';
                    }
                    io.to(roomCode).emit('stateUpdate', state);
                    if (state.winner !== 'empate') io.to(roomCode).emit('playSound', 'victory');
                }
            } else if (playerName && (role === 'esquerda' || role === 'direita')) {
                const playersList = rooms[roomCode].players[role];
                const index = playersList.indexOf(playerName);
                if (index !== -1) {
                    playersList.splice(index, 1);
                    io.to(roomCode).emit('stateUpdate', rooms[roomCode]);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});