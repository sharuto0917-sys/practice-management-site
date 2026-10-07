const STORAGE_KEY = 'bass-practice-manager-v1';

const defaultState = {
  players: [
    { id: crypto.randomUUID(), name: '青木', position: '中級者' },
    { id: crypto.randomUUID(), name: '山崎', position: '上級者' },
    { id: crypto.randomUUID(), name: '田村', position: '初心者' }
  ],
  selectedPlayerId: null,
  plans: [
    { id: crypto.randomUUID(), playerId: null, title: '5弦スケール', category: 'スケール', minutes: 30, done: false },
    { id: crypto.randomUUID(), playerId: null, title: 'リズム練習', category: 'リズム', minutes: 45, done: true },
    { id: crypto.randomUUID(), playerId: null, title: 'フレーズ練習', category: 'メロディ', minutes: 40, done: false }
  ],
  logs: [
    { id: crypto.randomUUID(), playerName: '青木', bpm: 96, minutes: 30, note: 'スケールの指使いを整理できた', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), playerName: '山崎', bpm: 120, minutes: 45, note: 'リズムが安定してきた', createdAt: new Date().toISOString() }
  ]
};

const els = {
  todayDate: document.getElementById('todayDate'),
  totalPlanned: document.getElementById('totalPlanned'),
  completedCount: document.getElementById('completedCount'),
  minutesCount: document.getElementById('minutesCount'),
  bpmCount: document.getElementById('bpmCount'),
  playerList: document.getElementById('playerList'),
  planList: document.getElementById('planList'),
  logList: document.getElementById('logList'),
  playerForm: document.getElementById('playerForm'),
  addPlayerButton: document.getElementById('addPlayerButton'),
  planForm: document.getElementById('planForm'),
  addPlanButton: document.getElementById('addPlanButton'),
  recordForm: document.getElementById('recordForm'),
  recordPlayerSelect: document.getElementById('recordPlayerSelect'),
  planPlayerSelect: document.getElementById('planPlayerSelect'),
  playerName: document.getElementById('playerName'),
  playerPosition: document.getElementById('playerPosition'),
  planTitle: document.getElementById('planTitle'),
  planCategory: document.getElementById('planCategory'),
  planMinutes: document.getElementById('planMinutes'),
  bpmInput: document.getElementById('bpmInput'),
  minutesInput: document.getElementById('minutesInput'),
  recordNote: document.getElementById('recordNote')
};

const state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const base = structuredClone(defaultState);
    const defaultPlayer = base.players[0];
    base.selectedPlayerId = defaultPlayer.id;
    base.plans[0].playerId = defaultPlayer.id;
    base.plans[1].playerId = defaultPlayer.id;
    base.plans[2].playerId = defaultPlayer.id;
    return base;
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to parse state:', error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate() {
  const now = new Date();
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(now);
}

function syncSelectedPlayer() {
  if (!state.selectedPlayerId && state.players.length > 0) {
    state.selectedPlayerId = state.players[0].id;
  }
}

function renderSummary() {
  const total = state.plans.length;
  const completed = state.plans.filter((plan) => plan.done).length;
  const minutes = state.logs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  const bpm = state.logs.length
    ? Math.round(state.logs.reduce((sum, log) => sum + Number(log.bpm || 0), 0) / state.logs.length)
    : 0;

  els.totalPlanned.textContent = String(total);
  els.completedCount.textContent = String(completed);
  els.minutesCount.textContent = String(minutes);
  els.bpmCount.textContent = String(bpm);
}

function renderPlayerList() {
  syncSelectedPlayer();
  const selectedId = state.selectedPlayerId;

  els.playerList.innerHTML = state.players
    .map(
      (player) => `
        <li class="player-item ${player.id === selectedId ? 'active' : ''}">
          <div>
            <strong>${player.name}</strong>
            <div class="plan-meta">${player.position || '未設定'}</div>
          </div>
          <div>
            <button type="button" data-player-select="${player.id}">選択</button>
          </div>
        </li>
      `
    )
    .join('');

  const options = state.players
    .map(
      (player) => `<option value="${player.id}" ${player.id === selectedId ? 'selected' : ''}>${player.name}</option>`
    )
    .join('');

  els.recordPlayerSelect.innerHTML = options || '<option value="">練習者なし</option>';
  els.planPlayerSelect.innerHTML = options || '<option value="">練習者なし</option>';

  if (!state.players.length) {
    els.recordPlayerSelect.innerHTML = '<option value="">練習者なし</option>';
    els.planPlayerSelect.innerHTML = '<option value="">練習者なし</option>';
  }
}

function renderPlans() {
  const selectedId = state.selectedPlayerId;
  const plans = state.plans.filter((plan) => !selectedId || plan.playerId === selectedId || !plan.playerId);

  if (!plans.length) {
    els.planList.innerHTML = '<li class="plan-item"><div>練習メニューはまだありません</div></li>';
    return;
  }

  els.planList.innerHTML = plans
    .map(
      (plan) => `
        <li class="plan-item">
          <div class="plan-main">
            <strong>${plan.title}</strong>
            <span class="plan-meta">${plan.category} / ${plan.minutes}分</span>
          </div>
          <button
            type="button"
            class="checkbox-button ${plan.done ? 'done' : 'pending'}"
            data-plan-toggle="${plan.id}"
          >
            ${plan.done ? '完了' : '未完了'}
          </button>
        </li>
      `
    )
    .join('');
}

function renderLogs() {
  if (!state.logs.length) {
    els.logList.innerHTML = '<li class="log-item">記録はまだありません</li>';
    return;
  }

  els.logList.innerHTML = [...state.logs]
    .slice()
    .reverse()
    .map(
      (log) => `
        <li class="log-item">
          <strong>${log.playerName}</strong>
          <div class="plan-meta">BPM: ${log.bpm} / 時間: ${log.minutes}分</div>
          <div>${log.note || 'コメントなし'}</div>
        </li>
      `
    )
    .join('');
}

function updateView() {
  renderSummary();
  renderPlayerList();
  renderPlans();
  renderLogs();
  els.todayDate.textContent = formatDate();
}

els.addPlayerButton.addEventListener('click', () => {
  els.playerForm.classList.toggle('hidden');
});

els.playerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = els.playerName.value.trim();
  const position = els.playerPosition.value.trim();

  if (!name) return;

  const newPlayer = {
    id: crypto.randomUUID(),
    name,
    position: position || '未設定'
  };

  state.players.push(newPlayer);
  state.selectedPlayerId = newPlayer.id;
  saveState();
  updateView();
  els.playerForm.reset();
  els.playerForm.classList.add('hidden');
});

els.addPlanButton.addEventListener('click', () => {
  els.planForm.classList.toggle('hidden');
});

els.planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const playerId = els.planPlayerSelect.value || state.selectedPlayerId;
  const title = els.planTitle.value.trim();
  const category = els.planCategory.value.trim();
  const minutes = Number(els.planMinutes.value || 0);

  if (!playerId || !title || !category || !minutes) return;

  state.plans.push({
    id: crypto.randomUUID(),
    playerId,
    title,
    category,
    minutes,
    done: false
  });

  saveState();
  updateView();
  els.planForm.reset();
  els.planForm.classList.add('hidden');
});

els.playerList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-player-select]');
  if (!button) return;

  state.selectedPlayerId = button.dataset.playerSelect;
  saveState();
  updateView();
});

els.planList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-plan-toggle]');
  if (!button) return;

  const plan = state.plans.find((item) => item.id === button.dataset.planToggle);
  if (!plan) return;

  plan.done = !plan.done;
  saveState();
  updateView();
});

els.recordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const playerId = els.recordPlayerSelect.value || state.selectedPlayerId;
  const player = state.players.find((item) => item.id === playerId);
  const bpm = Number(els.bpmInput.value || 0);
  const minutes = Number(els.minutesInput.value || 0);
  const note = els.recordNote.value.trim();

  if (!player) return;

  state.logs.push({
    id: crypto.randomUUID(),
    playerName: player.name,
    bpm,
    minutes,
    note: note || '記録入力',
    createdAt: new Date().toISOString()
  });

  saveState();
  updateView();
  els.recordForm.reset();
});

updateView();
