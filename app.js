const screens = document.querySelectorAll('[data-screen]');
const navLinks = document.querySelectorAll('[data-navigate]');
const navButtons = document.querySelectorAll('[data-action]');
const bottomLinks = document.querySelectorAll('.nav-link');

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('screen-active', screen.dataset.screen === name);
  });

  bottomLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.navigate === name);
  });
}

function handleNavigation(event) {
  const target = event.target.closest('[data-navigate]');
  if (!target) return;

  const screen = target.dataset.navigate;
  if (screen) showScreen(screen);
}

navButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const action = event.currentTarget.dataset.action;
    if (action === 'open-menu') {
      alert('Menu lateral em breve.');
    }
  });
});

navLinks.forEach((button) => {
  button.addEventListener('click', handleNavigation);
});

bottomLinks.forEach((link) => {
  link.addEventListener('click', handleNavigation);
});

const forms = document.querySelectorAll('[data-form]');
forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const screen = form.dataset.form;
    if (screen === 'login') {
      showScreen('dashboard');
    } else if (screen === 'responsible-signup') {
      showScreen('child-signup');
    } else if (screen === 'child-signup') {
      showScreen('dashboard');
    } else if (screen === 'chat') {
      const input = form.querySelector('input');
      const message = input.value.trim();
      if (message) {
        addChatMessage('user', message);
        input.value = '';
        setTimeout(() => {
          addChatMessage('bot', `Legal! A Livoz ouviu: "${message}". Agora tente dizer uma palavra nova.`);
        }, 600);
      }
    }
  });
});

function addChatMessage(type, text) {
  const chatBox = document.querySelector('.chat-box');
  const message = document.createElement('div');
  message.className = `chat-message ${type}`;
  message.innerHTML = `<span>${text}</span>`;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

showScreen('opening');
