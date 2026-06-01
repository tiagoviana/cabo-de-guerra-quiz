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
        answered: { esquerda: false, direita: false },
        winner: null,
        isGameOver: false,
        showAnswer: false,
        players: { esquerda: [], direita: [] },
        openAnswers: { esquerda: null, direita: null } // NOVO: Guarda as respostas de texto livre
    };
}

io.on('connection', (socket) => {
    
    socket.on('createRoom', () => {
        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        rooms[roomCode] = createEmptyGameState();
        socket.join(roomCode);
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
            rooms[code].answered = { esquerda: false, direita: false };
            rooms[code].openAnswers = { esquerda: null, direita: null };
            rooms[code].showAnswer = false;
            io.to(code).emit('stateUpdate', rooms[code]);
        }
    });

    socket.on('nextQuestion', (code) => {
        const state = rooms[code];
        if (state && state.quiz) {
            if (state.currentQ < state.quiz.perguntas.length - 1) {
                state.currentQ++;
                state.answered = { esquerda: false, direita: false };
                state.openAnswers = { esquerda: null, direita: null }; // Limpa as respostas abertas
                state.showAnswer = false;
                io.to(code).emit('stateUpdate', state);
            } else {
                state.isGameOver = true;
                
                if (state.ropePos < 0) state.winner = 'esquerda';
                else if (state.ropePos > 0) state.winner = 'direita';
                else state.winner = 'empate';
                
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

    socket.on('submitAnswer', ({ code, team, answer }) => {
        const state = rooms[code];
        if (!state || state.winner || state.isGameOver || state.currentQ < 0) return;
        
        const q = state.quiz.perguntas[state.currentQ];
        if (state.answered[team]) return;
        
        // NOVO: Se for pergunta aberta, salva o texto e encerra a função aqui, sem som de erro/acerto.
        if (q.tipo === 'aberta') {
            state.openAnswers[team] = answer;
            state.answered[team] = true;
            io.to(code).emit('stateUpdate', state);
            return;
        }

        state.answered[team] = true;
        let isCorrect = false;

        if (q.tipo === 'multipla_escolha') {
            isCorrect = parseInt(answer) === q.respostaCorretaIndex;
        } else if (q.tipo === 'digitar') {
            const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            const normAnswer = normalize(answer);
            isCorrect = q.respostasAceitas.some(acc => normalize(acc) === normAnswer);
        }

        processAnswer(state, team, isCorrect, q.tipo !== 'aberta');
        io.to(code).emit('stateUpdate', state);
        io.to(code).emit('playSound', isCorrect ? 'correct' : 'wrong');
    });

    socket.on('manualGrade', ({ code, team, isCorrect }) => {
        const state = rooms[code];
        if (state && !state.winner && !state.isGameOver) {
            processAnswer(state, team, isCorrect, true);
            io.to(code).emit('stateUpdate', state);
            io.to(code).emit('playSound', isCorrect ? 'correct' : 'wrong');
        }
    });

    function processAnswer(state, team, isCorrect, moveRope) {
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

        if (state.ropePos <= -limit) {
            state.ropePos = -limit;
            state.winner = 'esquerda';
            state.isGameOver = true;
            io.to(code).emit('playSound', 'victory');
        } else if (state.ropePos >= limit) {
            state.ropePos = limit;
            state.winner = 'direita';
            state.isGameOver = true;
            io.to(code).emit('playSound', 'victory');
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});