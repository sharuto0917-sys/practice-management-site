const STORAGE_KEY = 'baseball-practice-manager-v1';

const defaultState = {
  players: [
    { id: crypto.randomUUID(), name: '田中', position: '投手' },
    { id: crypto.randomUUID(), name: '佐藤', position: '捕手' },
    { id: crypto.randomUUID(), name: '山田', position: '外野手' }
  ],
  selectedPlayerId: null,
  plans: [
    { id: crypto.randomUUID(), playerId: null, title: 'キャッチボール', category: '投球', minutes: 30, done: false },
    { id: crypto.randomUUID(), playerId: null, title: 'バッティング', category: '打撃', minutes: 45, done: true },
    { id: crypto.randomUUID(), playerId: null, title: '守備練習', category: '守備', minutes: 40, done: false }
  ],
  logs: [
    { id: crypto.randomUUID(), playerName: '田中', pitch: 80, bat: 20, note: 'フォーム確認を実施', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), playerName: '山田', pitch: 0, bat: 15, note: 'コンタクト良好', createdAt: new Date().toISOString() }
  ]
};

const els = {
  todayDate: document.getElementById('todayDate'),
  totalPlanned: document.getElementById('totalPlanned'),
  completedCount: document.getElementById('completedCount'),
  pitchCount: document.getElementById('pitchCount'),
  batCount: document.getElementById('batCount'),
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
  pitchInput: document.getElementById('pitchInput'),
  batInput: document.getElementById('batInput'),
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

function getSelectedPlayer() {
  return state.players.find((player) => player.id === state.selectedPlayerId) || state.players[0];
}

function syncSelectedPlayer() {
  if (!state.selectedPlayerId && state.players.length > 0) {
    state.selectedPlayerId = state.players[0].id;
  }
}

function renderSummary() {
  const total = state.plans.length;
  const completed = state.plans.filter((plan) => plan.done).length;
  const pitchCount = state.logs.reduce((sum, log) => sum + Number(log.pitch || 0), 0);
  const batCount = state.logs.reduce((sum, log) => sum + Number(log.bat || 0), 0);

  els.totalPlanned.textContent = String(total);
  els.completedCount.textContent = String(completed);
  els.pitchCount.textContent = String(pitchCount);
  els.batCount.textContent = String(batCount);
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

  els.recordPlayerSelect.innerHTML = options || '<option value="">選手なし</option>';
  els.planPlayerSelect.innerHTML = options || '<option value="">選手なし</option>';

  if (!state.players.length) {
    els.recordPlayerSelect.innerHTML = '<option value="">選手なし</option>';
    els.planPlayerSelect.innerHTML = '<option value="">選手なし</option>';
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
          <div class="plan-meta">投球数: ${log.pitch} / 打席数: ${log.bat}</div>
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
  const pitch = Number(els.pitchInput.value || 0);
  const bat = Number(els.batInput.value || 0);
  const note = els.recordNote.value.trim();

  if (!player) return;

  state.logs.push({
    id: crypto.randomUUID(),
    playerName: player.name,
    pitch,
    bat,
    note: note || '記録入力',
    createdAt: new Date().toISOString()
  });

  saveState();
  updateView();
  els.recordForm.reset();
});

updateView();
