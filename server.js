const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Serve os arquivos da pasta public
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Um jogador se conectou:', socket.id);

  socket.on('novoJogador', (nome) => {
    console.log(`Jogador entrou: ${nome}`);
    socket.emit('boasVindas', `Bem-vindo(a) ao Crime Capixaba, ${nome}!`);
  });

  socket.on('dadoRolado', ({ resultado }) => {
    console.log(`Dado rolado: ${resultado}`);
    // Aqui você pode emitir para todos, ou para uma sala específica
    socket.broadcast.emit('dadoRolado', {
      jogador: socket.id,
      resultado
    });
  });

  socket.on('disconnect', () => {
    console.log('Um jogador se desconectou:', socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
