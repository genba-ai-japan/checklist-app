// =========================================================
// Data
// =========================================================
let schedules    = [];
let todos        = [];
let assignees    = [];
let scheduleNextId  = 1;
let todoNextId      = 1;
let assigneeNextId  = 1;

// Calendar state
let currentYear;
let currentMonth; // 0-based (0 = January)
let selectedDateStr = null;

// Pending modal state
let pendingDeleteScheduleId = null;
let pendingDeleteDate       = null;
let pendingDeleteAssigneeId = null;

// =========================================================
// LocalStorage
// =========================================================
const LS_SCHEDULES = 'genba-schedules';
const LS_TODOS     = 'genba-todos';
const LS_ASSIGNEES = 'genba-assignees';

function saveAll() {
  localStorage.setItem(LS_SCHEDULES, JSON.stringify({ schedules, scheduleNextId }));
  localStorage.setItem(LS_TODOS,     JSON.stringify({ todos, todoNextId }));
  localStorage.setItem(LS_ASSIGNEES, JSON.stringify({ assignees, assigneeNextId }));
}

function loadAll() {
  try {
    const sd = localStorage.getItem(LS_SCHEDULES);
    if (sd) {
      const d = JSON.parse(sd);
      schedules      = d.schedules      || [];
      scheduleNextId = d.scheduleNextId || 1;
    }
  } catch { schedules = []; }

  try {
    const td = localStorage.getItem(LS_TODOS);
    if (td) {
      const d = JSON.parse(td);
      todos      = d.todos      || [];
      todoNextId = d.todoNextId || 1;
    }
  } catch { todos = []; }

  try {
    const ad = localStorage.getItem(LS_ASSIGNEES);
    if (ad) {
      const d = JSON.parse(ad);
      assignees      = d.assignees      || [];
      assigneeNextId = d.assigneeNextId || 1;
    } else {
      // Initial sample assignees
      assignees = [
        { id: assigneeNextId++, name: '西本' },
        { id: assigneeNextId++, name: '田中' },
        { id: assigneeNextId++, name: '山本' },
      ];
    }
  } catch { assignees = []; }
}

// =========================================================
// Date utilities
// =========================================================
function parseDate(str) {
  // 'YYYY-MM-DD' -> local Date (avoids UTC-offset shift)
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function diffDays(origStr, targetStr) {
  const orig   = parseDate(origStr);
  const target = parseDate(targetStr);
  return Math.round((target - orig) / 86400000);
}

const DOW_JP = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateJP(str) {
  const d = parseDate(str);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DOW_JP[d.getDay()]}）`;
}

// =========================================================
// Schedule logic
// =========================================================
/**
 * Returns true when `schedule` should appear on `dateStr`.
 */
function scheduleAppearsOn(schedule, dateStr) {
  const { date: origStr, repeat, exceptions } = schedule;

  // Check exceptions first
  if (Array.isArray(exceptions) && exceptions.includes(dateStr)) return false;

  const diff = diffDays(origStr, dateStr);

  switch (repeat) {
    case 'none':
      return origStr === dateStr;

    case 'weekly':
      return diff >= 0 && diff % 7 === 0;

    case 'biweekly':
      return diff >= 0 && diff % 14 === 0;

    case 'monthly': {
      if (diff < 0) return false;
      const orig   = parseDate(origStr);
      const target = parseDate(dateStr);
      return target.getDate() === orig.getDate();
    }

    default:
      return false;
  }
}

function getSchedulesForDate(dateStr) {
  return schedules.filter(s => scheduleAppearsOn(s, dateStr));
}

/** Returns a Set of 'YYYY-MM-DD' strings that have at least one schedule in the given month. */
function getMarkedDatesInMonth(year, month) {
  const result      = new Set();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (schedules.some(s => scheduleAppearsOn(s, str))) {
      result.add(str);
    }
  }
  return result;
}

// =========================================================
// Calendar rendering
// =========================================================
function renderCalendar() {
  const grid  = document.getElementById('calendarGrid');
  const label = document.getElementById('monthLabel');

  label.textContent = `${currentYear}年${currentMonth + 1}月`;

  const daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const markedDates   = getMarkedDatesInMonth(currentYear, currentMonth);
  const today         = todayStr();

  grid.innerHTML = '';

  // Blank cells before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell cal-blank';
    grid.appendChild(blank);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow     = (firstDayOfWeek + d - 1) % 7;

    const cell = document.createElement('div');
    let cls = 'cal-cell';
    if (dow === 0) cls += ' cal-sun';
    if (dow === 6) cls += ' cal-sat';
    if (dateStr === today)            cls += ' cal-today';
    if (dateStr === selectedDateStr)  cls += ' cal-selected';
    cell.className       = cls;
    cell.dataset.date    = dateStr;

    const numSpan = document.createElement('span');
    numSpan.className   = 'cal-day-num';
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    if (markedDates.has(dateStr)) {
      const dot = document.createElement('span');
      dot.className = 'cal-dot';
      cell.appendChild(dot);
    }

    cell.addEventListener('click', () => selectDate(dateStr));
    grid.appendChild(cell);
  }
}

function selectDate(dateStr) {
  selectedDateStr = dateStr;

  document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('cal-selected'));
  const cell = document.querySelector(`.cal-cell[data-date="${dateStr}"]`);
  if (cell) cell.classList.add('cal-selected');

  renderScheduleSection();
}

// =========================================================
// Schedule section
// =========================================================
function renderScheduleSection() {
  const label    = document.getElementById('selectedDateLabel');
  const area     = document.getElementById('scheduleArea');
  const noDateMsg = document.getElementById('noDateMsg');
  const list     = document.getElementById('scheduleList');

  if (!selectedDateStr) {
    area.classList.add('hidden');
    noDateMsg.classList.remove('hidden');
    label.textContent = '⏱ 予定';
    return;
  }

  label.textContent = `⏱ ${formatDateJP(selectedDateStr)} の予定`;
  area.classList.remove('hidden');
  noDateMsg.classList.add('hidden');

  const daySchedules = getSchedulesForDate(selectedDateStr);
  list.innerHTML = '';

  if (daySchedules.length === 0) {
    const li = document.createElement('li');
    li.className    = 'empty-item';
    li.textContent  = '予定はありません';
    list.appendChild(li);
    return;
  }

  const REPEAT_LABELS = {
    weekly:   '毎週',
    biweekly: '2週ごと',
    monthly:  '毎月',
  };

  daySchedules.forEach(s => {
    const li  = document.createElement('li');
    li.className = 'schedule-item';

    const titleSpan = document.createElement('span');
    titleSpan.className   = 'schedule-title';
    titleSpan.textContent = s.title;

    li.appendChild(titleSpan);

    if (s.repeat !== 'none') {
      const badge = document.createElement('span');
      badge.className   = 'repeat-badge';
      badge.textContent = REPEAT_LABELS[s.repeat] || s.repeat;
      li.appendChild(badge);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon btn-del';
    delBtn.title     = '削除';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => openScheduleDeleteModal(s.id, s.repeat !== 'none'));
    li.appendChild(delBtn);

    list.appendChild(li);
  });
}

function addSchedule() {
  if (!selectedDateStr) return;

  const input     = document.getElementById('scheduleInput');
  const repeatSel = document.getElementById('repeatSelect');
  const title     = input.value.trim();

  if (!title) { input.focus(); return; }

  schedules.push({
    id:         scheduleNextId++,
    title,
    date:       selectedDateStr,
    repeat:     repeatSel.value,
    exceptions: [],
  });

  saveAll();
  input.value = '';
  renderCalendar();
  renderScheduleSection();
}

// =========================================================
// Schedule delete modal
// =========================================================
function openScheduleDeleteModal(scheduleId, isRepeat) {
  pendingDeleteScheduleId = scheduleId;
  pendingDeleteDate       = selectedDateStr;

  const modal  = document.getElementById('deleteModal');
  const msg    = document.getElementById('modalMsg');
  const btnOne = document.getElementById('modalDeleteOne');
  const btnAll = document.getElementById('modalDeleteAll');

  const s = schedules.find(s => s.id === scheduleId);
  msg.textContent = `「${s ? s.title : ''}」を削除しますか？`;

  if (isRepeat) {
    btnOne.classList.remove('hidden');
    btnAll.textContent = '繰り返し全体を削除';
  } else {
    btnOne.classList.add('hidden');
    btnAll.textContent = '削除する';
  }

  modal.classList.remove('hidden');
}

function closeScheduleDeleteModal() {
  document.getElementById('deleteModal').classList.add('hidden');
  pendingDeleteScheduleId = null;
  pendingDeleteDate       = null;
}

function deleteScheduleOne() {
  const s = schedules.find(s => s.id === pendingDeleteScheduleId);
  if (s) {
    if (!s.exceptions) s.exceptions = [];
    if (!s.exceptions.includes(pendingDeleteDate)) {
      s.exceptions.push(pendingDeleteDate);
    }
  }
  saveAll();
  closeScheduleDeleteModal();
  renderCalendar();
  renderScheduleSection();
}

function deleteScheduleAll() {
  schedules = schedules.filter(s => s.id !== pendingDeleteScheduleId);
  saveAll();
  closeScheduleDeleteModal();
  renderCalendar();
  renderScheduleSection();
}

// =========================================================
// Todo list
// =========================================================
function renderTodos() {
  const list      = document.getElementById('todoList');
  const filterSel = document.getElementById('filterAssignee');
  const filterVal = filterSel.value;

  let filtered = todos;

  if (filterVal === 'none') {
    filtered = todos.filter(t => !t.assigneeId);
  } else if (filterVal !== 'all') {
    const fid = Number(filterVal);
    filtered = todos.filter(t => t.assigneeId === fid);
  }

  list.innerHTML = '';

  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.className   = 'empty-item';
    li.textContent = 'タスクはありません';
    list.appendChild(li);
    return;
  }

  filtered.forEach(task => {
    const assignee = task.assigneeId ? assignees.find(a => a.id === task.assigneeId) : null;

    const li = document.createElement('li');
    li.className = 'todo-item' + (task.completed ? ' completed' : '');

    // Check button
    const checkBtn = document.createElement('button');
    checkBtn.className   = 'todo-check' + (task.completed ? ' checked' : '');
    checkBtn.title       = task.completed ? '未完了に戻す' : '完了にする';
    checkBtn.textContent = task.completed ? '✓' : '';
    checkBtn.addEventListener('click', () => toggleTodo(task.id));

    // Content
    const content = document.createElement('div');
    content.className = 'todo-content';

    const textSpan = document.createElement('span');
    textSpan.className   = 'todo-text';
    textSpan.textContent = task.text;
    content.appendChild(textSpan);

    if (assignee) {
      const badge = document.createElement('span');
      badge.className   = 'assignee-badge';
      badge.textContent = assignee.name;
      content.appendChild(badge);
    }

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className   = 'btn-icon btn-del';
    delBtn.title       = '削除';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => deleteTodo(task.id));

    li.appendChild(checkBtn);
    li.appendChild(content);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function addTodo() {
  const input      = document.getElementById('todoInput');
  const assigneeSel = document.getElementById('todoAssigneeSelect');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  const assigneeId = assigneeSel.value ? Number(assigneeSel.value) : null;

  todos.push({ id: todoNextId++, text, completed: false, assigneeId });
  saveAll();
  input.value = '';
  renderTodos();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) {
    t.completed = !t.completed;
    saveAll();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveAll();
  renderTodos();
}

// =========================================================
// Assignees
// =========================================================
function renderAssignees() {
  const list = document.getElementById('assigneeList');
  list.innerHTML = '';

  if (assignees.length === 0) {
    const li = document.createElement('li');
    li.className   = 'empty-item';
    li.textContent = '担当者が登録されていません';
    list.appendChild(li);
  } else {
    assignees.forEach(a => {
      const li = document.createElement('li');
      li.className = 'assignee-item';

      const nameSpan = document.createElement('span');
      nameSpan.className   = 'assignee-name';
      nameSpan.textContent = a.name;

      const delBtn = document.createElement('button');
      delBtn.className   = 'btn-icon btn-del';
      delBtn.title       = '削除';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => openAssigneeDeleteModal(a.id));

      li.appendChild(nameSpan);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  updateAssigneeDropdowns();
}

function addAssignee() {
  const input = document.getElementById('assigneeInput');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }

  if (assignees.some(a => a.name === name)) {
    alert(`「${name}」はすでに登録されています`);
    return;
  }

  assignees.push({ id: assigneeNextId++, name });
  saveAll();
  input.value = '';
  renderAssignees();
}

function openAssigneeDeleteModal(id) {
  pendingDeleteAssigneeId = id;
  const a      = assignees.find(a => a.id === id);
  const inUse  = todos.some(t => t.assigneeId === id);
  const msg    = document.getElementById('assigneeModalMsg');

  if (inUse) {
    msg.textContent = `「${a.name}」はタスクで使用されています。削除すると、該当タスクの担当者が「未設定」になります。削除しますか？`;
  } else {
    msg.textContent = `「${a.name}」を削除しますか？`;
  }

  document.getElementById('assigneeDeleteModal').classList.remove('hidden');
}

function closeAssigneeDeleteModal() {
  document.getElementById('assigneeDeleteModal').classList.add('hidden');
  pendingDeleteAssigneeId = null;
}

function confirmDeleteAssignee() {
  if (pendingDeleteAssigneeId === null) return;

  // Nullify linked tasks
  todos.forEach(t => {
    if (t.assigneeId === pendingDeleteAssigneeId) t.assigneeId = null;
  });

  assignees = assignees.filter(a => a.id !== pendingDeleteAssigneeId);
  saveAll();
  closeAssigneeDeleteModal();
  renderAssignees();
  renderTodos();
}

/** Rebuild both assignee dropdowns (todo form + filter). */
function updateAssigneeDropdowns() {
  // --- Todo assignee select ---
  const todoSel    = document.getElementById('todoAssigneeSelect');
  const prevTodo   = todoSel.value;
  todoSel.innerHTML = '';

  const noneOpt = document.createElement('option');
  noneOpt.value       = '';
  noneOpt.textContent = '未設定';
  todoSel.appendChild(noneOpt);

  assignees.forEach(a => {
    const opt = document.createElement('option');
    opt.value       = String(a.id);
    opt.textContent = a.name;
    todoSel.appendChild(opt);
  });

  if (Array.from(todoSel.options).some(o => o.value === prevTodo)) {
    todoSel.value = prevTodo;
  }

  // --- Filter select ---
  const filterSel  = document.getElementById('filterAssignee');
  const prevFilter = filterSel.value;
  filterSel.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value       = 'all';
  allOpt.textContent = 'すべて';
  filterSel.appendChild(allOpt);

  const filterNoneOpt = document.createElement('option');
  filterNoneOpt.value       = 'none';
  filterNoneOpt.textContent = '未設定';
  filterSel.appendChild(filterNoneOpt);

  assignees.forEach(a => {
    const opt = document.createElement('option');
    opt.value       = String(a.id);
    opt.textContent = a.name;
    filterSel.appendChild(opt);
  });

  if (Array.from(filterSel.options).some(o => o.value === prevFilter)) {
    filterSel.value = prevFilter;
  }
}

// =========================================================
// Init & event listeners
// =========================================================
function init() {
  const now = new Date();
  currentYear  = now.getFullYear();
  currentMonth = now.getMonth();

  loadAll();

  // ── Calendar navigation ──────────────────────────────
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDateStr = null;
    renderCalendar();
    renderScheduleSection();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDateStr = null;
    renderCalendar();
    renderScheduleSection();
  });

  // ── Schedule add ─────────────────────────────────────
  document.getElementById('addScheduleBtn').addEventListener('click', addSchedule);
  document.getElementById('scheduleInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addSchedule();
  });

  // ── Schedule delete modal ─────────────────────────────
  document.getElementById('modalDeleteOne').addEventListener('click', deleteScheduleOne);
  document.getElementById('modalDeleteAll').addEventListener('click', deleteScheduleAll);
  document.getElementById('modalCancel').addEventListener('click', closeScheduleDeleteModal);
  document.getElementById('deleteModal').addEventListener('click', e => {
    if (e.target.id === 'deleteModal') closeScheduleDeleteModal();
  });

  // ── Todo add ─────────────────────────────────────────
  document.getElementById('addTodoBtn').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
  });
  document.getElementById('filterAssignee').addEventListener('change', renderTodos);

  // ── Assignee add ──────────────────────────────────────
  document.getElementById('addAssigneeBtn').addEventListener('click', addAssignee);
  document.getElementById('assigneeInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addAssignee();
  });

  // ── Assignee delete modal ─────────────────────────────
  document.getElementById('assigneeModalConfirm').addEventListener('click', confirmDeleteAssignee);
  document.getElementById('assigneeModalCancel').addEventListener('click', closeAssigneeDeleteModal);
  document.getElementById('assigneeDeleteModal').addEventListener('click', e => {
    if (e.target.id === 'assigneeDeleteModal') closeAssigneeDeleteModal();
  });

  // ── Initial render ────────────────────────────────────
  renderCalendar();
  renderScheduleSection();
  renderAssignees();
  renderTodos();
}

init();
