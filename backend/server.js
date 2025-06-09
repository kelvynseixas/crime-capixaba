const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite acesso de qualquer origem
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// --- DADOS DO JOGO ---
const SUSPECTS = ['Dra. Valéria Matos', 'Dona Zezé', 'Bruno "Tubarão"', 'Chef André Lemos', 'Lívia Paixão', 'Deputado Ricardo Neves'];
const WEAPONS = ['Panela de Barro', 'Remo de Stand Up Paddle', 'Corda de Navio', 'Casaca', 'Troféu de Regata', 'Garrafa de Cachaça Artesanal'];
const LOCATIONS = ['Convento da Penha', 'Terceira Ponte', 'Fábrica de Chocolates Garoto', 'Paneleiras de Goiabeiras', 'Cais do Porto de Vitória', 'Praça dos Namorados', 'Hortomercado', 'Catedral Metropolitana', 'Curva da Jurema'];

let games = {}; // Objeto para armazenar os estados dos jogos ativos

io.on('connection', (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  socket.on('createGame', ({ playerName }) => {
    const gameId = `GAME-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    socket.join(gameId);

    // Criar a solução secreta
    const solution = {
      suspect: SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)],
      weapon: WEAPONS[Math.floor(Math.random() * WEAPONS.length)],
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    };

    // Criar o baralho com as cartas restantes
    const allCards = [...SUSPECTS, ...WEAPONS, ...LOCATIONS];
    const deck = allCards.filter(card => card !== solution.suspect && card !== solution.weapon && card !== solution.location);
    deck.sort(() => Math.random() - 0.5); // Embaralhar

    games[gameId] = {
      id: gameId,
      players: [{ id: socket.id, name: playerName, cards: [], location: 'Entrada', active: true }],
      solution: solution,
      deck: deck,
      turn: 0,
      started: false,
      log: [`Jogo ${gameId} criado por ${playerName}.`]
    };

    socket.emit('gameCreated', { gameId, gameState: games[gameId] });
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = games[gameId];
    if (game && !game.started && game.players.length < 6) {
      socket.join(gameId);
      game.players.push({ id: socket.id, name: playerName, cards: [], location: 'Entrada', active: true });
      game.log.push(`${playerName} entrou no jogo.`);
      io.to(gameId).emit('updateState', game);
    } else {
      socket.emit('errorMsg', 'Não foi possível entrar no jogo. Sala cheia ou jogo já iniciado.');
    }
  });
  
  socket.on('startGame', ({ gameId }) => {
      const game = games[gameId];
      if(game && socket.id === game.players[0].id && !game.started){ // Só o host pode iniciar
          game.started = true;
          
          // Distribuir cartas
          let cardIndex = 0;
          while(cardIndex < game.deck.length){
              for(let i = 0; i < game.players.length && cardIndex < game.deck.length; i++){
                  game.players[i].cards.push(game.deck[cardIndex]);
                  cardIndex++;
              }
          }
          game.log.push(`O jogo começou! É a vez de ${game.players[0].name}.`);
          io.to(gameId).emit('updateState', game);
      }
  });

  socket.on('move', ({ gameId, location }) => {
    const game = games[gameId];
    if (game && game.players[game.turn].id === socket.id) {
      game.players[game.turn].location = location;
      game.log.push(`${game.players[game.turn].name} moveu-se para ${location}.`);
      io.to(gameId).emit('updateState', game);
    }
  });

  socket.on('makeSuggestion', ({ gameId, suggestion }) => {
    const game = games[gameId];
    if (game && game.players[game.turn].id === socket.id) {
      game.log.push(`${game.players[game.turn].name} sugere: Foi ${suggestion.suspect}, com ${suggestion.weapon}, em ${suggestion.location}.`);
      
      // Envia o palpite para todos, para que o processo de refutação comece no cliente
      io.to(gameId).emit('suggestionMade', { suggester: game.players[game.turn], suggestion });
      io.to(gameId).emit('updateState', game); // Atualiza o log
    }
  });

  socket.on('disproveSuggestion', ({ gameId, disproverId, card }) => {
      const game = games[gameId];
      const suggester = game.players[game.turn];
      const disprover = game.players.find(p => p.id === disproverId);
      
      game.log.push(`${disprover.name} refutou o palpite.`);
      // Envia a carta revelada APENAS para o jogador que fez o palpite
      io.to(suggester.id).emit('suggestionDisproved', { card, disproverName: disprover.name });
      io.to(gameId).emit('updateState', game); // Atualiza o log para todos
  });

  socket.on('endTurn', ({ gameId }) => {
    const game = games[gameId];
    if (game && game.players[game.turn].id === socket.id) {
      do {
        game.turn = (game.turn + 1) % game.players.length;
      } while (!game.players[game.turn].active); // Pula jogadores que já perderam
      
      game.log.push(`É a vez de ${game.players[game.turn].name}.`);
      io.to(gameId).emit('updateState', game);
    }
  });

  socket.on('makeAccusation', ({ gameId, accusation }) => {
    const game = games[gameId];
    const player = game.players[game.turn];
    if (game && player.id === socket.id) {
        const solution = game.solution;
        if (accusation.suspect === solution.suspect && accusation.weapon === solution.weapon && accusation.location === solution.location) {
            game.log.push(`FIM DE JOGO! ${player.name} acertou a acusação e venceu!`);
            io.to(gameId).emit('gameOver', { winner: player.name, solution: solution });
        } else {
            player.active = false; // Jogador perdeu
            game.log.push(`${player.name} fez uma acusação incorreta e está fora da disputa.`);
            // Passa o turno
            do {
                game.turn = (game.turn + 1) % game.players.length;
            } while (!game.players[game.turn].active);
            game.log.push(`É a vez de ${game.players[game.turn].name}.`);
            
            io.to(gameId).emit('updateState', game);
            socket.emit('playerLost', { accusation, solution }); // Informa ao jogador que ele perdeu
        }
    }
  });
  
  socket.on('chatMessage', ({ gameId, message }) => {
      const game = games[gameId];
      const player = game.players.find(p => p.id === socket.id);
      io.to(gameId).emit('newChatMessage', { sender: player.name, text: message });
  });

  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    // Encontrar o jogo em que o jogador estava e notificar os outros
    for (const gameId in games) {
        const game = games[gameId];
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex > -1) {
            const playerName = game.players[playerIndex].name;
            game.players.splice(playerIndex, 1);
            game.log.push(`${playerName} desconectou-se.`);
            if (game.players.length < 2 && game.started) {
                game.log.push('Jogo encerrado por falta de jogadores.');
            }
            io.to(gameId).emit('updateState', game);
            break;
        }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor 'Crime Capixaba' rodando na porta ${PORT}`);
});
