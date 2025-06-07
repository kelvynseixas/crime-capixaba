const bodyParser = require('body-parser');
app.use(bodyParser.json());

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const jogadores = {};

app.use(express.static(path.join(__dirname, 'public'))); // pasta com index.html, style.css, script.js

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Quando jogador envia o nome
  socket.on('novoJogador', (nome) => {
    jogadores[socket.id] = nome;
    console.log(`Jogador registrado: ${nome}`);
    socket.emit('boasVindas', `Bem-vindo, ${nome}!`);
    socket.broadcast.emit('mensagem', `${nome} entrou na sala.`);
  });

  // Dado rolado
  socket.on('dadoRolado', ({ resultado }) => {
    const nome = jogadores[socket.id] || 'Jogador desconhecido';
    socket.broadcast.emit('dadoRolado', { jogador: nome, resultado });
  });

  // Quando jogador desconecta
  socket.on('disconnect', () => {
    const nome = jogadores[socket.id];
    delete jogadores[socket.id];
    console.log(`Jogador saiu: ${nome}`);
    socket.broadcast.emit('mensagem', `${nome || 'Um jogador'} saiu do jogo.`);
  });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
app.post('/webhook', (req, res) => {
    const exec = require('child_process').exec;
    exec('./deploy.sh', (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Erro: ${stderr}`);
            res.status(500).send('Erro no deploy');
            return;
        }
        console.log(`✅ Saída: ${stdout}`);
        res.send('Deploy feito com sucesso!');
    });
});
