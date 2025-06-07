const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const jogadores = {};

// Middleware para JSON (substitui body-parser)
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', function (socket) {
  console.log('Novo jogador conectado: ' + socket.id);

  socket.on('novoJogador', function (nome) {
    jogadores[socket.id] = nome;
    console.log('Jogador registrado: ' + nome);
    socket.emit('boasVindas', 'Bem-vindo, ' + nome + '!');
    socket.broadcast.emit('mensagem', nome + ' entrou na sala.');
  });

  socket.on('dadoRolado', function (data) {
    const nome = jogadores[socket.id] || 'Jogador desconhecido';
    socket.broadcast.emit('dadoRolado', {
      jogador: nome,
      resultado: data.resultado
    });
  });

  socket.on('disconnect', function () {
    const nome = jogadores[socket.id];
    delete jogadores[socket.id];
    console.log('Jogador saiu: ' + nome);
    socket.broadcast.emit('mensagem', (nome || 'Um jogador') + ' saiu do jogo.');
  });
});

// Webhook de deploy
app.post('/webhook', function (req, res) {
  exec('./deploy.sh', function (err, stdout, stderr) {
    if (err) {
      console.error('❌ Erro: ' + stderr);
      res.status(500).send('Erro no deploy');
      return;
    }
    console.log('✅ Saída: ' + stdout);
    res.send('Deploy feito com sucesso!');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log('Servidor rodando em http://localhost:' + PORT);
});
