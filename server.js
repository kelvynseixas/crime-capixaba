// server.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

const jogadores = {}; // { socket.id: { nome, personagemIndex, x, y } }

const personagensFixos = [
  { nome: "Chef Zé Moqueca", cor: "red", x: 0, y: 9 },
  { nome: "Luna, a Hippie da UFES", cor: "green", x: 2, y: 2 },
  { nome: "Cadu, Artesão da Praça", cor: "purple", x: 5, y: 5 },
  { nome: "Bia Banhista", cor: "orange", x: 9, y: 1 },
  { nome: "Seu 7, o Velho da Rua", cor: "brown", x: 4, y: 8 },
  { nome: "Dandara do Samba", cor: "pink", x: 8, y: 3 }
];

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Novo jogador conectado:", socket.id);

  socket.on("registrarJogador", (nome) => {
    const personagemIndex = Object.keys(jogadores).length % 6;

    jogadores[socket.id] = {
      nome,
      personagemIndex,
      x: personagensFixos[personagemIndex].x,
      y: personagensFixos[personagemIndex].y
    };

    io.emit("atualizarJogadores", jogadores);
  });

  socket.on("moverJogador", (direcao) => {
    const jogador = jogadores[socket.id];
    if (!jogador) return;

    switch (direcao) {
      case "cima":
        if (jogador.y > 0) jogador.y--;
        break;
      case "baixo":
        if (jogador.y < 9) jogador.y++;
        break;
      case "esquerda":
        if (jogador.x > 0) jogador.x--;
        break;
      case "direita":
        if (jogador.x < 9) jogador.x++;
        break;
    }

    io.emit("atualizarJogadores", jogadores);
  });

  socket.on("disconnect", () => {
    console.log("Jogador desconectado:", socket.id);
    delete jogadores[socket.id];
    io.emit("atualizarJogadores", jogadores);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
