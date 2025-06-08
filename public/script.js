const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const nome = urlParams.get("nome");
const sala = urlParams.get("sala");

const canvas = document.getElementById("canvasMapa");
const ctx = canvas.getContext("2d");

const TAM = 50; // Tamanho de cada célula no grid
const mapaLinhas = 12;
const mapaColunas = 12;

// Cores para até 6 personagens
const cores = ["red", "blue", "green", "purple", "orange", "brown"];

// Lista de personagens fixos (sempre no tabuleiro)
const personagens = [
  "Chef Zé Moqueca",
  "Luna, a Hippie da UFES",
  "Cadu, Artesão da Praça",
  "Bia Banhista",
  "Seu 7, o Velho da Rua",
  "Dandara do Samba"
];

// Posições iniciais dos personagens
const posicoesIniciais = [
  { x: 0, y: 0 },
  { x: 11, y: 0 },
  { x: 0, y: 11 },
  { x: 11, y: 11 },
  { x: 5, y: 0 },
  { x: 5, y: 11 }
];

let jogadores = {}; // { nome: { personagem, cor, x, y } }
let personagemDoJogador = null;

function desenharTabuleiro() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grade do mapa
  ctx.strokeStyle = "#ccc";
  for (let i = 0; i <= mapaColunas; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TAM, 0);
    ctx.lineTo(i * TAM, mapaLinhas * TAM);
    ctx.stroke();
  }
  for (let i = 0; i <= mapaLinhas; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * TAM);
    ctx.lineTo(mapaColunas * TAM, i * TAM);
    ctx.stroke();
  }

  // Desenhar todos os jogadores (personagens)
  for (const nome in jogadores) {
    const j = jogadores[nome];
    ctx.fillStyle = j.cor;
    ctx.beginPath();
    ctx.arc(j.x * TAM + TAM / 2, j.y * TAM + TAM / 2, TAM / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.fillText(j.personagem.split(",")[0], j.x * TAM + 2, j.y * TAM + TAM - 4);
  }
}

function moverJogador(distancia) {
  const jogador = jogadores[nome];
  if (!jogador) return;

  jogador.x = Math.max(0, Math.min(mapaColunas - 1, jogador.x + distancia));
  desenharTabuleiro();

  socket.emit("moverJogador", {
    sala,
    nome,
    x: jogador.x,
    y: jogador.y,
  });
}

document.getElementById("rolarDado").addEventListener("click", () => {
  const resultado = Math.floor(Math.random() * 6) + 1;
  document.getElementById("resultadoDado").textContent = `Você tirou: ${resultado}`;
  moverJogador(resultado);
});

socket.emit("entrarSala", { nome, sala });

socket.on("atualizarJogadores", (lista) => {
  jogadores = lista;
  desenharTabuleiro();
});
