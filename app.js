let tasks = [];
let currentFilter = 'all';
let nextId = 1;

// Load from localStorage
function loadTasks() {
  try {
    const saved = localStorage.getItem('checklist-tasks');
    if (saved) {
      const data = JSON.parse(saved);
      tasks = data.tasks || [];
      nextId = data.nextId || 1;
    }
  } catch {
    tasks = [];
    nextId = 1;
  }
}

// Save to localStorage
function saveTasks() {
  localStorage.setItem('checklist-tasks', JSON.stringify({ tasks, nextId }));
}

function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.push({ id: nextId++, text, completed: false });
  saveTasks();
  input.value = '';
  input.focus();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function getFilteredTasks() {
  switch (currentFilter) {
    case 'active':    return tasks.filter(t => !t.completed);
    case 'completed': return tasks.filter(t => t.completed);
    default:          return tasks;
  }
}

function render() {
  const list = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const footer = document.getElementById('footer');
  const statsText = document.getElementById('stats-text');
  const progressFill = document.getElementById('progress-fill');
  const remainingCount = document.getElementById('remaining-count');

  const filtered = getFilteredTasks();
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = total - completedCount;

  // Stats
  statsText.textContent = `${completedCount} / ${total} 完了`;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  progressFill.style.width = pct + '%';

  // Remaining count
  remainingCount.textContent = `残り ${activeCount} 件`;

  // Show/hide footer
  footer.style.display = total > 0 ? 'flex' : 'none';

  // Build list
  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.innerHTML = `
        <div class="task-checkbox" onclick="toggleTask(${task.id})" title="完了にする"></div>
        <span class="task-text" onclick="toggleTask(${task.id})">${escapeHtml(task.text)}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})" title="削除">✕</button>
      `;
      list.appendChild(li);
    });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Enter key to add
document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// Init
loadTasks();
render();
