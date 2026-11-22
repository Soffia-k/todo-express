const TOKEN_KEY = 'todo_token';

const $ = (id) => document.getElementById(id);

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

function showError(msg) {
  $('error').textContent = msg || '';
}

async function api(path, opts = {}) {
  const headers = Object.assign(
    { 'Authorization': 'Bearer ' + getToken() },
    opts.headers || {}
  );
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
  return data;
}

async function loadAuthor() {
  try {
    const a = await api('/api/author/');
    $('author-info').textContent = 'Автор: ' + a.login + ' — ' + a.fullName;
    $('app-section').hidden = false;
  } catch (e) {
    showError('Ошибка авторизации: ' + e.message);
    $('app-section').hidden = true;
  }
}

async function loadTasks() {
  showError('');
  const runId = $('runid-input').value.trim();
  if (!runId) return showError('Укажите runId');
  try {
    const list = await api('/api/tasks/?runId=' + encodeURIComponent(runId));
    renderTasks(list);
  } catch (e) {
    showError('Ошибка загрузки: ' + e.message);
  }
}

function renderTasks(list) {
  const ul = $('tasks-list');
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'Нет дел';
    ul.appendChild(li);
    return;
  }
  for (const t of list) {
    const li = document.createElement('li');

    const title = document.createElement('span');
    title.textContent = t.title + (t.done ? ' ✓' : '');
    if (t.done) title.style.textDecoration = 'line-through';
    li.appendChild(title);

    li.appendChild(document.createTextNode(' '));

    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Переименовать';
    renameBtn.onclick = async () => {
      const next = prompt('Новое название:', t.title);
      if (next === null) return;
      try {
        await api('/api/tasks/' + t.id + '/', {
          method: 'PATCH',
          body: JSON.stringify({ title: next }),
        });
        loadTasks();
      } catch (e) { showError('Ошибка: ' + e.message); }
    };
    li.appendChild(renameBtn);

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = t.done ? 'Снять отметку' : 'Отметить';
    toggleBtn.onclick = async () => {
      try {
        await api('/api/tasks/' + t.id + '/', {
          method: 'PATCH',
          body: JSON.stringify({ done: !t.done }),
        });
        loadTasks();
      } catch (e) { showError('Ошибка: ' + e.message); }
    };
    li.appendChild(toggleBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Удалить';
    delBtn.onclick = async () => {
      if (!confirm('Удалить дело?')) return;
      try {
        await api('/api/tasks/' + t.id + '/', { method: 'DELETE' });
        loadTasks();
      } catch (e) { showError('Ошибка: ' + e.message); }
    };
    li.appendChild(delBtn);

    ul.appendChild(li);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('token-input').value = getToken();

  $('login-btn').onclick = () => {
    setToken($('token-input').value.trim());
    showError('');
    loadAuthor();
  };

  $('load-btn').onclick = loadTasks;

  $('create-form').onsubmit = async (ev) => {
    ev.preventDefault();
    showError('');
    const title = $('create-title').value.trim();
    const runId = $('create-runid').value.trim();
    if (!title) return showError('Название не может быть пустым');
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(runId)) {
      return showError('runId: 1–64 символа A-Z a-z 0-9 _ -');
    }
    try {
      await api('/api/tasks/', {
        method: 'POST',
        body: JSON.stringify({ title, runId }),
      });
      $('create-title').value = '';
      loadTasks();
    } catch (e) {
      showError('Ошибка: ' + e.message);
    }
  };

  if (getToken()) loadAuthor();
});