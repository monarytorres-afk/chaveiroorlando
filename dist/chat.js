const services = {
  porta: [
    ['Que tipo de porta precisa de atendimento?', ['Residência', 'Comércio', 'Outro']],
    ['O que aconteceu com a porta ou a chave?', ['Porta travada', 'Chave perdida', 'Chave quebrou', 'Chave ficou dentro', 'Outro']]
  ],
  carro: [
    ['Qual é a marca, o modelo e o ano do veículo?'],
    ['Qual é o problema com a chave ou o veículo?', ['Chave ficou dentro', 'Perdi a chave', 'Chave ou controle com defeito', 'Outro']]
  ],
  fechadura: [
    ['Que serviço você precisa na fechadura?', ['Instalação', 'Troca', 'Reparo', 'Ainda não sei']],
    ['Qual é o tipo de fechadura?', ['Comum', 'Digital', 'Não sei']]
  ],
  copia: [
    ['Qual é o tipo de chave?', ['Residencial', 'Comercial', 'Automotiva', 'Outra']],
    ['Você tem a chave original?', ['Sim', 'Não']]
  ]
};
const common = [
  ['Em qual bairro e cidade você precisa de atendimento?'],
  ['Quando você precisa do serviço?', ['Agora', 'Ainda hoje', 'Quero agendar']],
  ['Quer acrescentar algum detalhe?']
];
const chat = document.querySelector('#chat');
const history = document.querySelector('#history');
const form = document.querySelector('#answer-form');
const question = document.querySelector('#question');
const choices = document.querySelector('#choices');
const input = document.querySelector('#answer');
const entry = document.querySelector('#text-entry');
const progress = document.querySelector('#progress');
const finish = document.querySelector('#finish');
const whatsapp = document.querySelector('#whatsapp');
const back = document.querySelector('#back');
let serviceName;
let questions;
let replies = [];

function bubble(message, className) {
  const item = document.createElement('li');
  item.className = className;
  item.textContent = message;
  history.append(item);
}

function draw(moveFocus = true) {
  const step = replies.length;
  history.replaceChildren();
  replies.forEach((reply, i) => {
    bubble(questions[i][0], 'bot');
    bubble(reply, 'user');
  });
  history.scrollTop = history.scrollHeight;
  const complete = step === questions.length;
  back.hidden = step === 0;
  finish.hidden = !complete;
  form.hidden = complete;

  if (complete) {
    progress.textContent = 'Pedido pronto';
    const transcript = replies.map((reply, i) => questions[i][0] + '\n' + reply);
    const message = ['Olá! Gostaria de atendimento.', 'Serviço: ' + serviceName, ...transcript].join('\n\n');
    whatsapp.href = 'https://wa.me/5511980124892?text=' + encodeURIComponent(message);
    whatsapp.focus();
    return;
  }

  const [prompt, options] = questions[step];
  progress.textContent = 'Pergunta ' + (step + 1) + ' de ' + questions.length;
  question.textContent = prompt;
  question.tabIndex = -1;
  choices.replaceChildren();
  entry.hidden = Boolean(options);
  input.value = '';
  input.placeholder = step === questions.length - 1 ? 'Detalhes adicionais' : 'Digite sua resposta';
  input.required = step !== questions.length - 1;
  if (options) {
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', prompt);
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option;
      button.addEventListener('click', () => {
        replies.push(option);
        draw();
      });
      choices.append(button);
    });
  }
  if (moveFocus) question.focus();
}

document.querySelectorAll('[data-service]').forEach(card => {
  card.addEventListener('click', () => {
    serviceName = card.querySelector('strong').textContent;
    questions = [...services[card.dataset.service], ...common];
    replies = [];
    document.querySelector('#chat-service').textContent = serviceName;
    draw(false);
    chat.showModal();
    question.focus();
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const reply = input.value.trim();
  if (!reply && input.required) {
    input.focus();
    return;
  }
  replies.push(reply || 'Sem detalhes adicionais.');
  draw();
});
back.addEventListener('click', () => {
  const previous = replies.pop();
  draw();
  if (!entry.hidden && previous !== 'Sem detalhes adicionais.') input.value = previous;
});
document.querySelector('#close').addEventListener('click', () => chat.close());

const video = document.querySelector('#fundo');
const motion = document.querySelector('#motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function startVideo() {
  if (reducedMotion.matches || navigator.connection?.saveData) return;
  video.src = 'chaveiro.mp4';
  video.play().then(() => { motion.hidden = false; }).catch(() => {});
}
window.addEventListener('load', startVideo, { once: true });
motion.addEventListener('click', () => {
  if (video.paused) {
    video.play().then(() => { motion.textContent = 'Pausar vídeo'; }).catch(() => {});
  } else {
    video.pause();
    motion.textContent = 'Reproduzir vídeo';
  }
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    video.pause();
    motion.textContent = 'Reproduzir vídeo';
  }
});
