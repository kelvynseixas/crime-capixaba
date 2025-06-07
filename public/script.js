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

const suspeitos = [
  "Chef Zé Moqueca",
  "Moça Hippie da UFES",
  "Vendedor de Artesanato",
  "Banhista da Curva",
  "Velho da Rua 7",
  "Passista do Sabão"
];

const lugares = [
  "Ilha das Caieiras",
  "UFES",
  "Praça dos Namorados",
  "Praia da Curva da Jurema",
  "Rua 7 Centro",
  "Sabão do Povo",
  "Shopping Vitória",
  "Aquaviário",
  "Aeroporto"
];

const armas = [
  "Moqueca envenenada",
  "Caderno ensanguentado",
  "Barra de ferro",
  "Canga de praia",
  "Cadeira de bar",
  "Pandeiro"
];

function preencherChecklist() {
  if (!document.getElementById('check-suspeitos')) return;

  const el = (id, itens) => {
    const ul = document.getElementById(id);
    itens.forEach(nome => {
      const li = document.createElement('li');
      li.innerHTML = `<label><input type="checkbox" /> ${nome}</label>`;
      ul.appendChild(li);
    });
  };

  el('check-suspeitos', suspeitos);
  el('check-lugares', lugares);
  el('check-armas', armas);

  preencherSelects();
}

function preencherSelects() {
  const addOptions = (id, lista) => {
    const sel = document.getElementById(id);
    lista.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      sel.appendChild(opt);
    });
  };
  addOptions('acusacaoSuspeito', suspeitos);
  addOptions('acusacaoLocal', lugares);
  addOptions('acusacaoArma', armas);
}

document.addEventListener('DOMContentLoaded', preencherChecklist);

const form = document.getElementById('acusacaoForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const suspeito = document.getElementById('acusacaoSuspeito').value;
    const local = document.getElementById('acusacaoLocal').value;
    const arma = document.getElementById('acusacaoArma').value;
    const acusacao = `${suspeito} no(a) ${local} com ${arma}`;
    document.getElementById('mensagem').textContent = `Você acusou: ${acusacao}`;
    // socket.emit('acusacaoFeita', { sala, suspeito, local, arma });
  });
}
