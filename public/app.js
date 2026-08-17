const socket = io();
let myRole = '';
let myCode = '';
let myName = '';
let currentState = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playArcadeSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'correct') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'victory') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        osc.frequency.setValueAtTime(1046.50, now + 0.45);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start(now); osc.stop(now + 1.5);
    }
}

const quizData = {
  "titulo": "English Quiz - Health & Steroids",
  "config": { "passoPorAcerto": 15, "limiteVitoria": 100, "erroPuxaAdversario": true },
  "times": {
    "esquerda": { "nome": "Grupo 1", "cor": "#203b66" }, 
    "direita": { "nome": "Grupo 2", "cor": "#f67b69" }
  },
  "perguntas": [
    { "id": 1, "tipo": "multipla_escolha", "enunciado": "These are common names for steroids, except:", "opcoes": ["juice", "gym candy", "roids", "gels"], "respostaCorretaIndex": 3, "pontos": 10 },
    { "id": 2, "tipo": "multipla_escolha", "enunciado": "Anabolic steroids are synthetic versions of which naturally occurring human hormone?", "opcoes": ["estrogen", "testosterone", "insulin", "adrenaline"], "respostaCorretaIndex": 1, "pontos": 10 },
    { "id": 3, "tipo": "digitar", "enunciado": "What is the visible effect of steroids on the skin?", "respostasAceitas": ["acne", "acnes"], "pontos": 10 },
    { "id": 4, "tipo": "digitar", "enunciado": "Name two serious internal organs damaged by steroids:", "respostasAceitas": ["heart and liver", "liver and heart", "heart, liver", "liver, heart"], "pontos": 10 },
    { "id": 5, "tipo": "multipla_escolha", "enunciado": "How do people misuse steroids?", "opcoes": ["By swallowing pills and using injections", "applying creams to the skin and drinking substances", "applying gels to the skin and using lotions for hair", "using injections and drinking substances"], "respostaCorretaIndex": 0, "pontos": 10 },
    { "id": 6, "tipo": "multipla_escolha", "enunciado": "Deeper voice and growth of facial hair happen in:", "opcoes": ["men", "women", "some men and most women", "women and men"], "respostaCorretaIndex": 1, "pontos": 10 },
    { "id": 7, "tipo": "multipla_escolha", "enunciado": "Anabolic steroids are synthetic (man-made) versions of which hormone?", "opcoes": ["progesterone", "insulin", "testosterone", "nandrolone"], "respostaCorretaIndex": 2, "pontos": 10 },
    { "id": 8, "tipo": "multipla_escolha", "enunciado": "All of these can happen to a man's body if he uses steroids, except:", "opcoes": ["Breast growth (gynecomastia)", "shrinking of the testicles", "hair loss", "blindness"], "respostaCorretaIndex": 3, "pontos": 10 },
    { "id": 9, "tipo": "multipla_escolha", "enunciado": "Steroids build muscle even if you don't work out.", "opcoes": ["true", "false", "true for women", "false only for men"], "respostaCorretaIndex": 1, "pontos": 10 },
    { "id": 10, "tipo": "digitar", "enunciado": "Steroids cause stunted growth because they make bones mature too fast and stop growing early. This can happen in:", "respostasAceitas": ["teenagers", "teens", "adolescents"], "pontos": 10 },
    { "id": 11, "tipo": "aberta", "enunciado": "Name a specific anabolic steroid used in bodybuilding.", "gabarito": "Nandrolone OR Oxandrolone OR Testosterone", "pontos": 10 },
    { "id": 12, "tipo": "multipla_escolha", "enunciado": "\"Roid Rage\" is not represented by:", "opcoes": ["Extreme aggression", "violent behavior", "severe mood swings", "heart attacks"], "respostaCorretaIndex": 3, "pontos": 10 },
    { "id": 13, "tipo": "multipla_escolha", "enunciado": "Anabolic steroids can _____ be used by doctors to treat health problems.", "opcoes": ["never", "sometimes", "rarely", "always"], "respostaCorretaIndex": 1, "pontos": 10 }
  ]
};

document.getElementById('btn-create-room').onclick = () => { socket.emit('createRoom'); };

document.getElementById('btn-check-room').onclick = () => {
    const code = document.getElementById('input-room-code').value.trim();
    if(code) socket.emit('checkRoom', code);
    else alert("Digite o código da sala primeiro.");
};

socket.on('roomChecked', (state) => {
    document.getElementById('preview-area').classList.remove('hidden');
    updatePreviewLists(state);
});

socket.on('roomError', (msg) => {
    alert(msg);
    document.getElementById('preview-area').classList.add('hidden');
});

function updatePreviewLists(state) {
    if(state && state.players) {
        document.getElementById('preview-esq').innerHTML = state.players.esquerda.map(n => `<li>${n}</li>`).join('');
        document.getElementById('preview-dir').innerHTML = state.players.direita.map(n => `<li>${n}</li>`).join('');
    }
}

function joinGame(team) {
    const code = document.getElementById('input-room-code').value.trim();
    const playerName = document.getElementById('input-player-name').value.trim();

    if (!playerName) { alert("Por favor, digite o seu nome para entrar na equipe."); return; }
    myName = playerName;
    socket.emit('joinRoom', { code, role: team, name: playerName });
}

document.getElementById('btn-start').onclick = () => socket.emit('startGame', myCode);
document.getElementById('btn-next').onclick = () => socket.emit('nextQuestion', myCode);
document.getElementById('btn-reveal').onclick = () => socket.emit('revealAnswer', myCode);

function sendManualGrade(team, isCorrect) {
    socket.emit('manualGrade', { code: myCode, team, isCorrect });
}

socket.on('roomCreated', (code) => {
    myRole = 'professor';
    myCode = code;
    showGameScreen();
    document.getElementById('prof-controls').classList.remove('hidden');
    
    document.documentElement.style.setProperty('--cor-esq', quizData.times.esquerda.cor);
    document.documentElement.style.setProperty('--cor-dir', quizData.times.direita.cor);
    document.getElementById('nome-esq').innerText = quizData.times.esquerda.nome;
    document.getElementById('nome-dir').innerText = quizData.times.direita.nome;
    
    socket.emit('loadQuiz', { code: myCode, quizData: quizData });
});

socket.on('joined', ({ code, role, state }) => {
    myRole = role;
    myCode = code;
    showGameScreen();
    
    if(state && state.quiz) {
        document.documentElement.style.setProperty('--cor-esq', state.quiz.times.esquerda.cor);
        document.documentElement.style.setProperty('--cor-dir', state.quiz.times.direita.cor);
        document.getElementById('nome-esq').innerText = state.quiz.times.esquerda.nome;
        document.getElementById('nome-dir').innerText = state.quiz.times.direita.nome;
    }
    
    renderState(state);
});

socket.on('stateUpdate', (state) => {
    if (myRole === '') { updatePreviewLists(state); return; }
    currentState = state;
    renderState(state);
});

socket.on('playSound', (type) => playArcadeSound(type));

function showGameScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    document.getElementById('display-room-code').innerText = myCode;
}

function renderState(state) {
    if(!state.quiz) return;
    
    document.getElementById('score-esq').innerText = state.scores.esquerda + ' pts';
    document.getElementById('score-dir').innerText = state.scores.direita + ' pts';

    if (state.players) {
        document.getElementById('list-esq').innerHTML = state.players.esquerda.map(n => `<li>${n}</li>`).join('');
        document.getElementById('list-dir').innerHTML = state.players.direita.map(n => `<li>${n}</li>`).join('');
    }

    const maxVisualOffset = 350; 
    const limit = state.quiz.config.limiteVitoria;
    const pxOffset = (state.ropePos / limit) * maxVisualOffset;
    document.getElementById('rope-group').style.transform = `translateX(${pxOffset}px)`;

    const banner = document.getElementById('victory-banner');
    if (state.isGameOver) {
        if (state.winner === 'empate') {
            banner.innerHTML = `FIM DE JOGO!<br/>EMPATE!`;
        } else {
            const teamName = state.quiz.times[state.winner].nome;
            banner.innerHTML = `FIM DE JOGO!<br/>${teamName.toUpperCase()} VENCEU!`;
        }
        banner.classList.remove('hidden');
    } else if (state.winner) {
        const teamName = state.quiz.times[state.winner].nome;
        banner.innerHTML = `${teamName.toUpperCase()} VENCEU!`;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }

    if (myRole === 'professor') {
        const btnNext = document.getElementById('btn-next');
        if (state.currentQ >= state.quiz.perguntas.length - 1) {
            btnNext.innerText = "Finalizar Jogo";
            btnNext.style.backgroundColor = "#eab308";
        } else {
            btnNext.innerText = "Próxima Pergunta";
            btnNext.style.backgroundColor = ""; 
        }
        
        if(state.isGameOver) {
            btnNext.classList.add('hidden');
        } else {
            btnNext.classList.remove('hidden');
        }
    }

    if (state.currentQ >= 0 && !state.isGameOver) {
        document.getElementById('active-question-area').classList.remove('hidden');
        renderQuestion(state);
    } else if (state.currentQ === -1) {
        document.getElementById('active-question-area').classList.remove('hidden');
        document.getElementById('q-enunciado').innerText = "Aguardando o professor iniciar o jogo...";
        document.getElementById('q-options').innerHTML = '';
        document.getElementById('q-gabarito').classList.add('hidden');
    } else if (state.isGameOver) {
        document.getElementById('q-enunciado').innerText = "Jogo Finalizado! Veja o placar final.";
        
        const creditsHTML = `
            <div style="grid-column: 1 / -1; margin-top: 1rem; padding: 2rem; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; text-align: left; max-width: 800px; margin-left: auto; margin-right: auto; line-height: 1.6; color: #334155; font-size: 1.2rem;">
                <h3 style="text-align: center; margin-top: 0; color: #0f172a; font-size: 1.8rem; margin-bottom: 20px;">Créditos</h3>
                <strong>Universidade:</strong> Universidade Federal de Sergipe (UFS)<br>
                <strong>Curso:</strong> Programa de Pós-Graduação em Letras (PPGLES)<br>
                <strong>Disciplina:</strong> Produção de materiais didáticos interculturais e multimodais<br>
                <strong>Professoras:</strong> Acacia Lima Santos e Maria Amália Vargas Façanha<br>
                <strong>Autores:</strong> Alysson Oliveira Barbosa, José Adelson da Silva Júnior e Tiago Viana de Souza
            </div>
        `;
        
        document.getElementById('q-options').innerHTML = creditsHTML;
        document.getElementById('q-gabarito').classList.add('hidden');
    }
}

function renderQuestion(state) {
    const q = state.quiz.perguntas[state.currentQ];
    document.getElementById('q-enunciado').innerText = `Q${state.currentQ + 1}. ${q.enunciado}`;
    
    const optsDiv = document.getElementById('q-options');
    optsDiv.innerHTML = '';
    
    const gabaritoDiv = document.getElementById('q-gabarito');
    gabaritoDiv.classList.add('hidden');

    if (q.tipo === 'multipla_escolha') {
        q.opcoes.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn-option';
            btn.innerText = opt;
            if (state.showAnswer && idx === q.respostaCorretaIndex) btn.classList.add('correct');
            
            btn.onclick = () => {
                if(myRole === 'esquerda' || myRole === 'direita') {
                    socket.emit('submitAnswer', { code: myCode, team: myRole, name: myName, answer: idx });
                } else if (myRole === 'professor') {
                    socket.emit('submitAnswer', { code: myCode, team: 'esquerda', name: 'Professor', answer: idx });
                    socket.emit('submitAnswer', { code: myCode, team: 'direita', name: 'Professor', answer: idx });
                }
            };
            optsDiv.appendChild(btn);
        });
    } else if (q.tipo === 'digitar') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Digite a resposta e dê Enter...';
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const team = myRole === 'professor' ? 'esquerda' : myRole;
                const name = myRole === 'professor' ? 'Professor' : myName;
                socket.emit('submitAnswer', { code: myCode, team: team, name: name, answer: input.value });
                input.value = '';
            }
        };
        optsDiv.appendChild(input);
        
        if(state.showAnswer) {
            gabaritoDiv.innerText = "Aceitas: " + q.respostasAceitas.join(", ");
            gabaritoDiv.classList.remove('hidden');
        }
    } else if (q.tipo === 'aberta') {
        // NOVO: Renderiza a UI das questões abertas
        const ansContainer = document.createElement('div');
        ansContainer.style.gridColumn = "1 / -1";
        ansContainer.style.display = "flex";
        ansContainer.style.gap = "15px";
        ansContainer.style.marginTop = "15px";
        ansContainer.style.width = "100%";

        const mapAnswers = (ansArray) => ansArray && ansArray.length > 0 
            ? ansArray.map(a => `<div style="margin-bottom:8px;"><b>${a.name}:</b> ${a.answer}</div>`).join('') 
            : '<span style="color:#94a3b8; font-style:italic;">Aguardando resposta...</span>';

        const ansEsq = mapAnswers(state.openAnswers?.esquerda);
        const ansDir = mapAnswers(state.openAnswers?.direita);

        ansContainer.innerHTML = `
            <div style="flex:1; padding: 15px; background: #f8fafc; border: 2px solid var(--cor-esq); border-radius: 8px; text-align: left;">
                <strong style="color: var(--cor-esq); display:block; margin-bottom: 5px;">Grupo 1 respondeu:</strong>
                <span style="font-size: 1.2rem; color: #0f172a;">${ansEsq}</span>
            </div>
            <div style="flex:1; padding: 15px; background: #f8fafc; border: 2px solid var(--cor-dir); border-radius: 8px; text-align: left;">
                <strong style="color: var(--cor-dir); display:block; margin-bottom: 5px;">Grupo 2 respondeu:</strong>
                <span style="font-size: 1.2rem; color: #0f172a;">${ansDir}</span>
            </div>
        `;

        if (myRole === 'professor') {
            optsDiv.appendChild(ansContainer);
            gabaritoDiv.innerText = "Gabarito: " + q.gabarito;
            gabaritoDiv.classList.remove('hidden');
        } else {
            if (state.answered[myRole].includes(myName)) {
                const msg = document.createElement('h3');
                msg.innerText = "Resposta enviada! Aguardando o professor avaliar.";
                msg.style.gridColumn = "1 / -1";
                msg.style.color = "#16a34a";
                optsDiv.appendChild(msg);
            } else {
                const input = document.createElement('textarea');
                input.placeholder = 'Digite a resposta do seu grupo e clique em Enviar...';
                input.style.gridColumn = "1 / -1";
                input.style.width = "100%";
                input.style.padding = "15px";
                input.style.fontSize = "1.2rem";
                input.style.borderRadius = "8px";
                input.style.border = "2px solid #cbd5e1";
                input.rows = 3;
                
                const btn = document.createElement('button');
                btn.innerText = "Enviar Resposta";
                btn.style.gridColumn = "1 / -1";
                btn.style.padding = "15px";
                btn.style.fontSize = "1.2rem";
                btn.style.backgroundColor = myRole === 'esquerda' ? 'var(--cor-esq)' : 'var(--cor-dir)';
                
                btn.onclick = () => {
                    if (input.value.trim() !== '') {
                        socket.emit('submitAnswer', { code: myCode, team: myRole, name: myName, answer: input.value });
                    }
                };

                optsDiv.appendChild(input);
                optsDiv.appendChild(btn);
            }
            
            optsDiv.appendChild(ansContainer);
            
            if (state.showAnswer) {
                gabaritoDiv.innerText = "Gabarito: " + q.gabarito;
                gabaritoDiv.classList.remove('hidden');
            }
        }
    }
}