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
