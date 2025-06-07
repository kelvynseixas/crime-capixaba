// Conecta ao servidor Socket.IO
const socket = io();

// Lida com envio do nome do jogador
document.getElementById('nomeJogador').addEventListener('change', () => {
  const nome = document.getElementById('nomeJogador').value.trim();
  if (nome !== '') {
    socket.emit('novoJogador', nome);
  }
});

// Lógica do botão de rolar o dado
document.getElementById('rolarDado').addEventListener('click', () => {
  const resultado = Math.floor(Math.random() * 6) + 1;
  document.getElementById('resultadoDado').textContent = `Você tirou: ${resultado}`;

  // (opcional) emitir para outros jogadores no futuro
  socket.emit('dadoRolado', { resultado });
});

// Listener para quando outro jogador rolar o dado
socket.on('dadoRolado', ({ jogador, resultado }) => {
  console.log(`${jogador} tirou: ${resultado}`);
  // Aqui podemos futuramente mostrar em uma área de log do jogo
});

// Listener para mensagens iniciais do servidor
socket.on('boasVindas', (msg) => {
  alert(msg);
});
