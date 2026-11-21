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
  ['Quer acrescentar algum detalhe?'],
  ['Quando você precisa do serviço?', ['Agora', 'Ainda hoje', 'Quero agendar']]
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
const reminder = document.querySelector('#chat-reminder');
const remindersShown = new Set();
let inactivityTimer;
let serviceName;
let questions;
let replies = [];

function showReminder(reason) {
  if (!questions || replies.length === questions.length || remindersShown.has(reason)) return;
  remindersShown.add(reason);
  (chat.open ? chat : document.body).append(reminder);
  reminder.hidden = false;
  if (chat.open) reminder.scrollIntoView({ block: 'nearest' });
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (chat.open && replies.length < questions.length && !remindersShown.has('idle')) {
    inactivityTimer = setTimeout(() => showReminder('idle'), 30000);
  }
}

function bubble(message, className) {
  const item = document.createElement('li');
  item.className = className;
  item.textContent = message;
  history.append(item);
}

function draw(moveFocus = true) {
  reminder.hidden = true;
  resetInactivityTimer();
  const step = replies.length;
  history.replaceChildren();
  bubble('Olá! Vou fazer algumas perguntas para agilizar seu atendimento.', 'bot');
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
    window.location.assign(whatsapp.href);
    return;
  }

  const [prompt, options] = questions[step];
  progress.textContent = 'Pergunta ' + (step + 1) + ' de ' + questions.length;
  question.textContent = prompt;
  question.tabIndex = -1;
  choices.replaceChildren();
  entry.hidden = Boolean(options);
  input.value = '';
  const optionalDetails = step === questions.length - 2;
  input.placeholder = optionalDetails ? 'Detalhes adicionais' : 'Digite sua resposta';
  input.required = !optionalDetails;
  form.querySelector('[type=submit]').textContent = optionalDetails ? 'Continuar' : 'OK';
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
    remindersShown.clear();
    draw(false);
    chat.showModal();
    resetInactivityTimer();
    question.focus();
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (entry.hidden) return;
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
input.addEventListener('input', resetInactivityTimer);
chat.addEventListener('close', () => {
  clearTimeout(inactivityTimer);
  reminder.hidden = true;
  showReminder('close');
});
document.querySelector('#dismiss-reminder').addEventListener('click', () => {
  reminder.hidden = true;
  if (chat.open) question.focus();
});
document.querySelector('#resume-chat').addEventListener('click', () => {
  reminder.hidden = true;
  if (!chat.open) chat.showModal();
  resetInactivityTimer();
  question.focus();
});

const video = document.querySelector('#fundo');
const motion = document.querySelector('#motion');
const audio = document.querySelector('#audio');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function syncVideoControls() {
  motion.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
  audio.textContent = video.muted ? 'Ouvir áudio original' : 'Silenciar vídeo';
}

async function playVideo(allowMutedFallback = false) {
  if (!video.hasAttribute('src')) video.src = 'chaveiro.mp4';
  try {
    await video.play();
  } catch (error) {
    if (allowMutedFallback && error.name === 'NotAllowedError' && !video.muted && video.paused) {
      video.muted = true;
      await playVideo();
    } else {
      syncVideoControls();
    }
  }
}

window.addEventListener('load', () => {
  motion.hidden = false;
  audio.hidden = false;
  syncVideoControls();
  if (!reducedMotion.matches && !navigator.connection?.saveData) playVideo(true);
}, { once: true });
motion.addEventListener('click', () => {
  if (video.paused) playVideo();
  else video.pause();
});
audio.addEventListener('click', () => {
  video.muted = !video.muted;
  if (!video.muted && video.paused) playVideo();
});
['play', 'pause', 'volumechange'].forEach(event => {
  video.addEventListener(event, syncVideoControls);
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) video.pause();
});

const demo = document.querySelector('#services-demo');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const demoObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    demo.classList.add('services-demo');
    demoObserver.disconnect();
  }, { threshold: 0.25 });
  demoObserver.observe(demo);
  document.querySelectorAll('[data-service]').forEach(card => {
    card.addEventListener('click', () => {
      demoObserver.disconnect();
      demo.classList.remove('services-demo');
    }, { once: true });
  });
}

const quickContact = document.querySelector('.quick-contact');
document.addEventListener('click', event => {
  if (quickContact.open && !quickContact.contains(event.target)) quickContact.open = false;
});
quickContact.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !quickContact.open) return;
  quickContact.open = false;
  quickContact.querySelector('summary').focus();
});
