const socket = io();
let salaAtual = '';

function entrar() {
  const nome = document.getElementById('nome').value;
  const sala = document.getElementById('sala').value;
  salaAtual = sala;
  socket.emit('entrarNaSala', { nome, sala });
}

socket.on('atualizarJogadores', (jogadores) => {
  const ul = document.getElementById('jogadores');
  ul.innerHTML = '';
  jogadores.forEach(j => {
    const li = document.createElement('li');
    li.innerText = j.nome;
    ul.appendChild(li);
  });
});

function enviarJogada() {
  const jogada = prompt('Digite sua jogada:');
  socket.emit('jogada', { sala: salaAtual, jogada });
}

socket.on('jogadaRecebida', (jogada) => {
  alert("Jogada recebida: " + jogada);
});
