// --- CONSTANTES E VARIÁVEIS GLOBAIS ---
const SUSPECTS = ['Dra. Valéria Matos', 'Dona Zezé', 'Bruno "Tubarão"', 'Chef André Lemos', 'Lívia Paixão', 'Deputado Ricardo Neves'];
const WEAPONS = ['Panela de Barro', 'Remo de Stand Up Paddle', 'Corda de Navio', 'Casaca', 'Troféu de Regata', 'Garrafa de Cachaça Artesanal'];
const LOCATIONS = ['Convento da Penha', 'Terceira Ponte', 'Fábrica de Chocolates Garoto', 'Paneleiras de Goiabeiras', 'Cais do Porto de Vitória', 'Praça dos Namorados', 'Hortomercado', 'Catedral Metropolitana', 'Curva da Jurema'];

let socket;
let myPlayerId;
let myPlayerName;
let currentGameState;

// --- ELEMENTOS DO DOM ---
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const playerNameInput = document.getElementById('playerName');
const gameIdInput = document.getElementById('gameIdInput');
const joinGameBtn = document.getElementById('joinGameBtn');
const errorMessage = document.getElementById('error-message');
const gameIdDisplay = document.getElementById('gameIdDisplay');
const turnInfo = document.getElementById('turn-info');
const board = document.getElementById('board');
const myCardsContainer = document.getElementById('my-cards');
const log = document.getElementById('log');
const notebook = document.getElementById('notebook');

// Botões de Controle
const startGameBtn = document.getElementById('startGameBtn');
const moveBtn = document.getElementById('moveBtn');
const suggestBtn = document.getElementById('suggestBtn');
const accuseBtn = document.getElementById('accuseBtn');
const endTurnBtn = document.getElementById('endTurnBtn');

// Modais
const modalBackdrop = document.getElementById('modal-backdrop');
const suggestionModal = document.getElementById('suggestion-modal');
const accusationModal = document.getElementById('accusation-modal');
const disproveModal = document.getElementById('disprove-modal');
const gameOverModal = document.getElementById('game-over-modal');

// --- LÓGICA DE INICIALIZAÇÃO ---

joinGameBtn.addEventListener('click', () => {
    myPlayerName = playerNameInput.value.trim();
    const gameId = gameIdInput.value.trim();

    if (!myPlayerName) {
        errorMessage.textContent = 'Por favor, insira seu nome.';
        return;
    }
    errorMessage.textContent = '';
    
    // ATENÇÃO: Substitua 'http://localhost:3000' pelo IP da sua VPS quando for para produção
    socket = io("http://157.180.81.252:3000"); 
    setupSocketListeners();

    if (gameId) {
        socket.emit('joinGame', { gameId, playerName: myPlayerName });
    } else {
        socket.emit('createGame', { playerName: myPlayerName });
    }
});

function setupSocketListeners() {
    socket.on('connect', () => {
        myPlayerId = socket.id;
        console.log('Conectado ao servidor com ID:', myPlayerId);
    });

    socket.on('gameCreated', ({ gameId, gameState }) => {
        switchToGameScreen();
        gameIdDisplay.textContent = gameId;
        updateGameState(gameState);
    });

    socket.on('updateState', (gameState) => {
        console.log("Estado recebido:", gameState);
        updateGameState(gameState);
    });
    
    socket.on('suggestionMade', ({ suggester, suggestion }) => {
        handleSuggestionDisproving(suggester, suggestion);
    });
    
    socket.on('suggestionDisproved', ({ card, disproverName }) => {
        alert(`${disproverName} mostrou-lhe a carta: ${card}`);
    });

    socket.on('gameOver', ({ winner, solution }) => {
        document.getElementById('game-over-title').textContent = `${winner} venceu o jogo!`;
        document.getElementById('game-over-text').textContent = `A solução era: ${solution.suspect} com a ${solution.weapon} no local ${solution.location}.`;
        showModal(gameOverModal);
    });
    
    socket.on('playerLost', ({ accusation, solution }) => {
        alert(`Sua acusação estava incorreta! A solução não era ${accusation.suspect}, ${accusation.weapon}, ${accusation.location}. Você não pode mais vencer, mas ainda participa para refutar palpites.`);
    });

    socket.on('errorMsg', (message) => {
        errorMessage.textContent = message;
        socket.disconnect();
    });
}

function switchToGameScreen() {
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    buildNotebook();
}

function updateGameState(gameState) {
    currentGameState = gameState;
    renderBoard();
    renderMyCards();
    renderLog();
    updateTurnInfo();
    updateControls();
}

// --- LÓGICA DE RENDERIZAÇÃO ---

function renderBoard() {
    board.innerHTML = '';
    const playerColors = ['#dc3545', '#007bff', '#28a745', '#ffc107', '#6f42c1', '#fd7e14'];
    
    LOCATIONS.forEach(location => {
        const locDiv = document.createElement('div');
        locDiv.className = 'location';
        locDiv.textContent = location;
        locDiv.dataset.location = location;

        const playersInLocation = currentGameState.players.filter(p => p.location === location);
        playersInLocation.forEach(p => {
            const playerIndex = currentGameState.players.findIndex(pl => pl.id === p.id);
            const token = document.createElement('span');
            token.className = 'player-token';
            token.style.backgroundColor = playerColors[playerIndex % playerColors.length];
            token.title = p.name;
            token.textContent = p.name.charAt(0);
            locDiv.prepend(token);
        });

        locDiv.addEventListener('click', () => handleMove(location));
        board.appendChild(locDiv);
    });
}

function renderMyCards() {
    myCardsContainer.innerHTML = '';
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    if (me && me.cards) {
        me.cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = card;
            myCardsContainer.appendChild(cardDiv);
        });
    }
}

function renderLog() {
    log.innerHTML = '';
    currentGameState.log.forEach(entry => {
        const p = document.createElement('p');
        p.textContent = entry;
        log.appendChild(p);
    });
    log.scrollTop = log.scrollHeight; // Auto-scroll
}

function updateTurnInfo() {
    if(!currentGameState.started) {
        turnInfo.textContent = `Aguardando o host (${currentGameState.players[0].name}) iniciar o jogo...`;
        return;
    }
    const currentPlayer = currentGameState.players[currentGameState.turn];
    if (currentPlayer.id === myPlayerId) {
        turnInfo.textContent = "É a sua vez!";
    } else {
        turnInfo.textContent = `É a vez de ${currentPlayer.name}.`;
    }
}

function updateControls() {
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    const isMyTurn = currentGameState.started && me && me.active && currentGameState.players[currentGameState.turn].id === myPlayerId;
    
    // Botão de Iniciar Jogo
    startGameBtn.classList.toggle('hidden', currentGameState.started || (me && currentGameState.players[0].id !== me.id));

    moveBtn.disabled = !isMyTurn;
    suggestBtn.disabled = !isMyTurn || !LOCATIONS.includes(me.location);
    accuseBtn.disabled = !isMyTorn;
    endTurnBtn.disabled = !isMyTurn;
}

function buildNotebook() {
    notebook.innerHTML = '';
    const createGroup = (title, items) => {
        let groupHtml = `<div class="notebook-group"><h4>${title}</h4>`;
        items.forEach(item => {
            groupHtml += `<label class="notebook-item"><input type="checkbox"> ${item}</label>`;
        });
        groupHtml += `</div>`;
        return groupHtml;
    };
    notebook.innerHTML += createGroup('Suspeitos', SUSPECTS);
    notebook.innerHTML += createGroup('Armas', WEAPONS);
    notebook.innerHTML += createGroup('Locais', LOCATIONS);
}

// --- LÓGICA DE AÇÕES DO JOGADOR ---

function handleMove(location) {
    if (moveBtn.disabled) return;
    socket.emit('move', { gameId: currentGameState.id, location });
}

startGameBtn.addEventListener('click', () => {
    socket.emit('startGame', { gameId: currentGameState.id });
});

suggestBtn.addEventListener('click', () => {
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    populateSelect('suggestion-suspect', SUSPECTS);
    populateSelect('suggestion-weapon', WEAPONS);
    document.getElementById('suggestion-location').textContent = me.location;
    showModal(suggestionModal);
});

accuseBtn.addEventListener('click', () => {
    populateSelect('accusation-suspect', SUSPECTS);
    populateSelect('accusation-weapon', WEAPONS);
    populateSelect('accusation-location', LOCATIONS);
    showModal(accusationModal);
});

endTurnBtn.addEventListener('click', () => {
    socket.emit('endTurn', { gameId: currentGameState.id });
});

// --- LÓGICA DOS MODAIS ---

function showModal(modal) {
    modalBackdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function hideModals() {
    modalBackdrop.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', hideModals));

document.getElementById('submitSuggestionBtn').addEventListener('click', () => {
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    const suggestion = {
        suspect: document.getElementById('suggestion-suspect').value,
        weapon: document.getElementById('suggestion-weapon').value,
        location: me.location
    };
    socket.emit('makeSuggestion', { gameId: currentGameState.id, suggestion });
    hideModals();
});

document.getElementById('submitAccusationBtn').addEventListener('click', () => {
    const accusation = {
        suspect: document.getElementById('accusation-suspect').value,
        weapon: document.getElementById('accusation-weapon').value,
        location: document.getElementById('accusation-location').value
    };
    socket.emit('makeAccusation', { gameId: currentGameState.id, accusation });
    hideModals();
});

function handleSuggestionDisproving(suggester, suggestion) {
    if (suggester.id === myPlayerId) return; // Não preciso refutar meu próprio palpite
    
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    const disprovingCards = me.cards.filter(card => 
        card === suggestion.suspect || card === suggestion.weapon || card === suggestion.location
    );

    if (disprovingCards.length > 0) {
        const disproveText = document.getElementById('disprove-text');
        const disproveCardsContainer = document.getElementById('disprove-cards');
        
        disproveText.textContent = `${suggester.name} sugeriu: ${suggestion.suspect}, ${suggestion.weapon}, ${suggestion.location}. Você pode refutar com:`;
        disproveCardsContainer.innerHTML = '';

        disprovingCards.forEach(card => {
            const btn = document.createElement('button');
            btn.textContent = card;
            btn.onclick = () => {
                socket.emit('disproveSuggestion', { gameId: currentGameState.id, disproverId: me.id, card: card });
                hideModals();
            };
            disproveCardsContainer.appendChild(btn);
        });
        showModal(disproveModal);
    }
}


function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}
