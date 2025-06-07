const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

let salas = {};

io.on('connection', (socket) => {
  console.log('Novo jogador conectado');

  socket.on('entrarNaSala', ({ nome, sala }) => {
    socket.join(sala);
    if (!salas[sala]) salas[sala] = [];
    salas[sala].push({ id: socket.id, nome });

    io.to(sala).emit('atualizarJogadores', salas[sala]);
  });

  socket.on('jogada', ({ sala, jogada }) => {
    socket.to(sala).emit('jogadaRecebida', jogada);
  });

  socket.on('disconnect', () => {
    for (let sala in salas) {
      salas[sala] = salas[sala].filter(j => j.id !== socket.id);
      io.to(sala).emit('atualizarJogadores', salas[sala]);
    }
  });
});
