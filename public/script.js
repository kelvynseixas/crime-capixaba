/* script.js */
const socket = io();

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const nome = params.get('nome');
  const sala = params.get('sala');
  if (nome) {
    const inputNome = document.getElementById('nomeJogador');
    if (inputNome) inputNome.value = nome;
    socket.emit('novoJogador', { nome, sala });
  }
});

document.getElementById('rolarDado')?.addEventListener('click', () => {
  const resultado = Math.floor(Math.random() * 6) + 1;
  document.getElementById('resultadoDado').textContent = `Você tirou: ${resultado}`;
  socket.emit('dadoRolado', { resultado });
});

socket.on('dadoRolado', ({ jogador, resultado }) => {
  alert(`${jogador} tirou: ${resultado}`);
});

socket.on('boasVindas', (msg) => {
  alert(msg);
});

function enviarJogada() {
  alert("Essa função ainda será implementada.");
}

// Exemplo de desenho simples no canvas
const canvas = document.getElementById('canvasMapa');
if (canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(300, 300, 10, 0, Math.PI * 2);
  ctx.fill();
}

const canvas = document.getElementById('canvasMapa');
const ctx = canvas.getContext('2d');

// Cada jogador começa no canto inferior esquerdo
let jogador = {
  nome: new URLSearchParams(window.location.search).get("nome") || "Você",
  x: 0,
  y: 9,
  movimentosRestantes: 0
};

// Tamanho da "casa" do tabuleiro (grid 10x10)
const TAM = 60;

function desenharTabuleiro() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grade do tabuleiro
  ctx.strokeStyle = "#ccc";
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TAM, 0);
    ctx.lineTo(i * TAM, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * TAM);
    ctx.lineTo(canvas.width, i * TAM);
    ctx.stroke();
  }

  // Desenha o jogador
  ctx.fillStyle = "blue";
  ctx.fillRect(jogador.x * TAM + 10, jogador.y * TAM + 10, TAM - 20, TAM - 20);
}

// Inicializa o canvas
desenharTabuleiro();

// Substitui botão de rolar dado
document.getElementById('rolarDado').addEventListener('click', () => {
  const resultado = Math.floor(Math.random() * 6) + 1;
  jogador.movimentosRestantes = resultado;
  document.getElementById('resultadoDado').textContent = `Você tirou: ${resultado}. Movimentos restantes: ${resultado}`;
});

// Mover o jogador no grid
function mover(direcao) {
  if (jogador.movimentosRestantes <= 0) return;

  switch (direcao) {
    case 'cima':
      if (jogador.y > 0) jogador.y--;
      break;
    case 'baixo':
      if (jogador.y < 9) jogador.y++;
      break;
    case 'esquerda':
      if (jogador.x > 0) jogador.x--;
      break;
    case 'direita':
      if (jogador.x < 9) jogador.x++;
      break;
  }
  const personagensFixos = [
  { nome: "Chef Zé Moqueca", cor: "red", x: 0, y: 9 },
  { nome: "Luna, a Hippie da UFES", cor: "green", x: 2, y: 2 },
  { nome: "Cadu, Artesão da Praça", cor: "purple", x: 5, y: 5 },
  { nome: "Bia Banhista", cor: "orange", x: 9, y: 1 },
  { nome: "Seu 7, o Velho da Rua", cor: "brown", x: 4, y: 8 },
  { nome: "Dandara do Samba", cor: "pink", x: 8, y: 3 }
];

  jogador.movimentosRestantes--;
  document.getElementById('resultadoDado').textContent = `Movimentos restantes: ${jogador.movimentosRestantes}`;
  desenharTabuleiro();
}
