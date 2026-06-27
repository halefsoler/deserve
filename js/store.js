/* ============================================
   DESERVE — Estado + regras de negócio
   Persistência em localStorage; evidências
   (blobs) em IndexedDB via EvidenceDB.
   ============================================ */

(function () {
  const KEY = 'deserve-state-v1';

  const defaultState = () => ({
    onboarded: false,
    family: { name: '' },
    parentPin: '',
    children: [],     // {id, name, emoji, color, points}
    tasks: [],        // {id, title, emoji, points, childIds, evidence, recurrence, days, active, createdAt}
    submissions: [],  // {id, taskId, childId, date, status, evidenceType, evidenceKey, submittedAt, reviewedAt, parentComment, points}
    rewards: [],      // {id, title, emoji, cost, type, childIds, active}
    redemptions: [],  // {id, rewardId, childId, status:'pending'|'suggested'|'approved'|'rejected', requestedAt, reviewedAt, cost, title, emoji, desiredDate, parentDate, scheduledDate}
    session: null,    // {role: 'parent'} | {role:'child', childId}
    settings: { theme: 'auto', notify: false, appLock: false, parentStyle: 'equilibrado', skin: 'default' }, // skin: 'default'|'batman'|'superman'
    reminders: [],    // {id, taskId, childId, taskTitle, taskEmoji, delayMin, fireAt}
    skips: [],        // {id, taskId, childId, date} — missões recusadas pelo filho
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* estado corrompido → recomeça */ }
    return defaultState();
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const todayStr = (d = new Date()) => {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };
  const dateOffset = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return todayStr(d); };

  /* ---------- Regras de tarefas ---------- */

  /** A tarefa está prevista para a data dada? */
  function isTaskDueOn(task, dateStr) {
    if (!task.active) return false;
    const d = new Date(dateStr + 'T12:00:00');
    if (task.recurrence === 'daily') return true;
    if (task.recurrence === 'weekly') return (task.days || []).includes(d.getDay());
    if (task.recurrence === 'once') return !hasApprovedEver(task.id, null);
    return false;
  }

  function hasApprovedEver(taskId, childId) {
    return state.submissions.some(s => s.taskId === taskId &&
      (childId ? s.childId === childId : true) && s.status === 'approved');
  }

  function submissionFor(taskId, childId, dateStr) {
    return state.submissions.find(s =>
      s.taskId === taskId && s.childId === childId && s.date === dateStr) || null;
  }

  function skipFor(taskId, childId, dateStr) {
    return state.skips.find(s =>
      s.taskId === taskId && s.childId === childId && s.date === dateStr) || null;
  }

  /** Tarefas do dia para uma criança, com status de submissão. */
  function tasksForChildOn(childId, dateStr) {
    return state.tasks
      .filter(t => t.childIds.includes(childId) && isTaskDueOn(t, dateStr))
      .map(t => ({ task: t, submission: submissionFor(t.id, childId, dateStr) }));
  }

  /* ---------- Streak (dias consecutivos com tudo aprovado/enviado) ---------- */
  function streakFor(childId) {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const ds = dateOffset(-i);
      const due = tasksForChildOn(childId, ds);
      if (!due.length) { if (i === 0) continue; else continue; }
      const allDone = due.every(({ submission }) =>
        submission && (submission.status === 'approved' || submission.status === 'pending'));
      if (allDone) streak++;
      else { if (i === 0) continue; break; } // hoje incompleto não quebra ainda
    }
    return streak;
  }

  /* ---------- Analytics ---------- */
  function analyticsFor(childId, days = 7) {
    const series = [];
    let dueTotal = 0, doneTotal = 0, pointsEarned = 0;
    for (let i = days - 1; i >= 0; i--) {
      const ds = dateOffset(-i);
      const due = tasksForChildOn(childId, ds);
      const done = due.filter(({ submission }) => submission && submission.status === 'approved').length;
      dueTotal += due.length;
      doneTotal += done;
      series.push({ date: ds, due: due.length, done });
    }
    state.submissions.forEach(s => {
      if (s.childId === childId && s.status === 'approved' && s.date >= dateOffset(-(days - 1))) {
        pointsEarned += s.points || 0;
      }
    });
    const pending = state.submissions.filter(s => s.childId === childId && s.status === 'pending').length;
    const rejected = state.submissions.filter(s => s.childId === childId && s.status === 'rejected' && s.date >= dateOffset(-(days - 1))).length;
    return {
      series, dueTotal, doneTotal, pointsEarned, pending, rejected,
      rate: dueTotal ? Math.round((doneTotal / dueTotal) * 100) : 0,
      streak: streakFor(childId),
    };
  }

  /* ---------- Ações ---------- */
  const actions = {
    setupFamily({ familyName, pin, children }) {
      state.family.name = familyName;
      state.parentPin = pin;
      state.children = children.map(c => ({ id: uid(), points: 0, ...c }));
      state.onboarded = true;
      save();
    },

    addChild(c) { state.children.push({ id: uid(), points: 0, ...c }); save(); },
    updateChild(id, patch) {
      const c = state.children.find(x => x.id === id);
      if (c) Object.assign(c, patch);
      save();
    },

    addTask(t) {
      state.tasks.push({ id: uid(), active: true, createdAt: Date.now(), ...t });
      save();
    },
    updateTask(id, patch) {
      const t = state.tasks.find(x => x.id === id);
      if (t) Object.assign(t, patch);
      save();
    },
    deleteTask(id) {
      state.tasks = state.tasks.filter(t => t.id !== id);
      save();
    },

    submitTask({ taskId, childId, evidenceType, evidenceKey }) {
      const task = state.tasks.find(t => t.id === taskId);
      const sub = {
        id: uid(), taskId, childId,
        date: todayStr(),
        status: 'pending',
        evidenceType, evidenceKey: evidenceKey || null,
        submittedAt: Date.now(),
        points: task ? task.points : 0,
        taskTitle: task ? task.title : '',
        taskEmoji: task ? task.emoji : '✅',
      };
      state.submissions.push(sub);
      save();
      return sub;
    },

    reviewSubmission(subId, approve, comment) {
      const s = state.submissions.find(x => x.id === subId);
      if (!s || s.status !== 'pending') return;
      s.status = approve ? 'approved' : 'rejected';
      s.reviewedAt = Date.now();
      s.parentComment = comment || '';
      if (approve) {
        const child = state.children.find(c => c.id === s.childId);
        if (child) child.points += s.points;
      }
      save();
    },

    addReward(r) { state.rewards.push({ id: uid(), active: true, ...r }); save(); },
    updateReward(id, patch) {
      const r = state.rewards.find(x => x.id === id);
      if (r) Object.assign(r, patch);
      save();
    },
    deleteReward(id) { state.rewards = state.rewards.filter(r => r.id !== id); save(); },

    // desiredDate: 'YYYY-MM-DD' (data desejada pelo filho) ou null (agora)
    requestRedemption(rewardId, childId, desiredDate = null) {
      const reward = state.rewards.find(r => r.id === rewardId);
      const child = state.children.find(c => c.id === childId);
      if (!reward || !child || child.points < reward.cost) return null;
      // reserva os pontos imediatamente para evitar gasto duplo
      child.points -= reward.cost;
      const red = {
        id: uid(), rewardId, childId,
        status: 'pending', requestedAt: Date.now(),
        cost: reward.cost, title: reward.title, emoji: reward.emoji,
        desiredDate, parentDate: null, scheduledDate: null,
      };
      state.redemptions.push(red);
      save();
      return red;
    },

    // pais aprovam → agenda na data desejada (ou data sugerida já aceita)
    reviewRedemption(redId, approve) {
      const r = state.redemptions.find(x => x.id === redId);
      if (!r || (r.status !== 'pending' && r.status !== 'suggested')) return;
      r.status = approve ? 'approved' : 'rejected';
      r.reviewedAt = Date.now();
      if (approve) {
        r.scheduledDate = r.parentDate || r.desiredDate || null;
      } else {
        const child = state.children.find(c => c.id === r.childId);
        if (child) child.points += r.cost; // devolve os pontos
      }
      save();
    },

    // pais sugerem outra data → volta para o filho decidir
    suggestRedemptionDate(redId, date) {
      const r = state.redemptions.find(x => x.id === redId);
      if (!r) return;
      r.status = 'suggested';
      r.parentDate = date;
      save();
    },

    // filho cancela o pedido → devolve os pontos ao total e remove o pedido
    cancelRedemption(redId) {
      const r = state.redemptions.find(x => x.id === redId);
      if (!r || (r.status !== 'pending' && r.status !== 'suggested')) return;
      const child = state.children.find(c => c.id === r.childId);
      if (child) child.points += r.cost;
      state.redemptions = state.redemptions.filter(x => x.id !== redId);
      save();
    },

    // filho aceita a data sugerida pelos pais → aprovado e agendado
    acceptSuggestedDate(redId) {
      const r = state.redemptions.find(x => x.id === redId);
      if (!r || r.status !== 'suggested') return;
      r.status = 'approved';
      r.scheduledDate = r.parentDate;
      r.reviewedAt = Date.now();
      save();
    },

    setTheme(theme) {
      state.settings = state.settings || {};
      state.settings.theme = theme;
      save();
    },
    setNotify(on) {
      state.settings = state.settings || {};
      state.settings.notify = on;
      save();
    },
    setAppLock(on) {
      state.settings = state.settings || {};
      state.settings.appLock = on;
      save();
    },
    setParentStyle(style) {
      state.settings = state.settings || {};
      state.settings.parentStyle = style;
      save();
    },
    setSkin(skin) {
      state.settings = state.settings || {};
      state.settings.skin = skin;
      save();
    },

    declineTask({ taskId, childId }) {
      const date = todayStr();
      if (!skipFor(taskId, childId, date))
        state.skips.push({ id: uid(), taskId, childId, date });
      save();
    },
    undoDecline({ taskId, childId }) {
      const date = todayStr();
      state.skips = state.skips.filter(s =>
        !(s.taskId === taskId && s.childId === childId && s.date === date));
      save();
    },

    addReminder({ taskId, childId, delayMin }) {
      const task = state.tasks.find(t => t.id === taskId);
      const rem = {
        id: uid(), taskId, childId, delayMin,
        taskTitle: task ? task.title : '',
        taskEmoji: task ? task.emoji : '⏰',
        fireAt: Date.now() + delayMin * 60000,
      };
      state.reminders.push(rem); save();
      return rem;
    },
    removeReminder(id) {
      state.reminders = state.reminders.filter(r => r.id !== id); save();
    },

    login(session) { state.session = session; save(); },
    logout() { state.session = null; save(); },

    resetAll() {
      state = defaultState();
      save();
    },

    /* Dados de exemplo para explorar o app */
    seedDemo() {
      const theo = { id: uid(), name: 'Theo', emoji: '🦸', color: '#46b6ff', points: 70, age: 5, skin: 'superman' };
      const mia = { id: uid(), name: 'Mia', emoji: '🐞', color: '#ff5caa', points: 95, age: 7, skin: 'ladybug' };
      state.family.name = 'Família Demo';
      state.parentPin = state.parentPin || '1234';
      state.children = [theo, mia];
      state.tasks = [
        { id: uid(), title: 'Arrumar a cama', emoji: '🛏️', points: 10, childIds: [theo.id, mia.id], evidence: 'photo', recurrence: 'daily', days: [], period: 'manha', time: null, active: true, createdAt: Date.now() },
        { id: uid(), title: 'Escovar os dentes', emoji: '🪥', points: 5, childIds: [theo.id, mia.id], evidence: 'check', recurrence: 'daily', days: [], period: 'noite', time: null, active: true, createdAt: Date.now() },
        { id: uid(), title: 'Guardar os brinquedos', emoji: '🧸', points: 8, childIds: [theo.id], evidence: 'photo', recurrence: 'daily', days: [], period: 'tarde', time: null, active: true, createdAt: Date.now() },
        { id: uid(), title: 'Ler 20 minutos', emoji: '📚', points: 15, childIds: [mia.id], evidence: 'audio', recurrence: 'daily', days: [], period: null, time: '19:00', active: true, createdAt: Date.now() },
        { id: uid(), title: 'Lição de casa', emoji: '✏️', points: 20, childIds: [mia.id], evidence: 'photo', recurrence: 'weekly', days: [1, 2, 3, 4, 5], period: 'tarde', time: null, active: true, createdAt: Date.now() },
        { id: uid(), title: 'Tirar o lixo', emoji: '🗑️', points: 10, childIds: [theo.id], evidence: 'photo', recurrence: 'weekly', days: [1, 3, 5], period: null, time: null, active: true, createdAt: Date.now() },
      ];
      state.rewards = [
        { id: uid(), title: 'Mesada da semana (R$ 20)', emoji: '💰', cost: 100, type: 'mesada', childIds: [theo.id, mia.id], active: true },
        { id: uid(), title: '1h de videogame extra', emoji: '🎮', cost: 50, type: 'desejo', childIds: [theo.id, mia.id], active: true },
        { id: uid(), title: 'Sorvete no fim de semana', emoji: '🍦', cost: 40, type: 'compra', childIds: [theo.id, mia.id], active: true },
        { id: uid(), title: 'Passeio no parque', emoji: '🎡', cost: 150, type: 'desejo', childIds: [mia.id], active: true },
      ];
      // histórico dos últimos 7 dias para alimentar o analytics
      state.submissions = [];
      for (let i = 1; i <= 7; i++) {
        const ds = dateOffset(-i);
        state.tasks.forEach(t => {
          t.childIds.forEach(cid => {
            if (!isTaskDueOn(t, ds)) return;
            const roll = Math.random();
            if (roll < 0.72) {
              state.submissions.push({
                id: uid(), taskId: t.id, childId: cid, date: ds,
                status: 'approved', evidenceType: t.evidence, evidenceKey: null,
                submittedAt: Date.now() - i * 864e5, reviewedAt: Date.now() - i * 864e5 + 36e5,
                points: t.points, taskTitle: t.title, taskEmoji: t.emoji, parentComment: '',
              });
            } else if (roll < 0.8) {
              state.submissions.push({
                id: uid(), taskId: t.id, childId: cid, date: ds,
                status: 'rejected', evidenceType: t.evidence, evidenceKey: null,
                submittedAt: Date.now() - i * 864e5, reviewedAt: Date.now() - i * 864e5 + 36e5,
                points: t.points, taskTitle: t.title, taskEmoji: t.emoji,
                parentComment: 'Vamos caprichar mais amanhã! 💪',
              });
            }
          });
        });
      }
      // uma pendência de hoje para mostrar o fluxo de aprovação
      const t0 = state.tasks[1];
      state.submissions.push({
        id: uid(), taskId: t0.id, childId: mia.id, date: todayStr(),
        status: 'pending', evidenceType: 'check', evidenceKey: null,
        submittedAt: Date.now() - 30 * 60e3,
        points: t0.points, taskTitle: t0.title, taskEmoji: t0.emoji, parentComment: '',
      });
      state.onboarded = true;
      save();
    },
  };

  window.Store = {
    get state() { return state; },
    actions,
    helpers: { uid, todayStr, dateOffset, isTaskDueOn, tasksForChildOn, submissionFor, skipFor, streakFor, analyticsFor },
  };
})();
