(() => {
  'use strict';

  const STORAGE_KEY = 'qingyang-health-v1';
  const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐'];
  const VIEWS = ['today', 'weight', 'settings'];

  const state = {
    data: null,
    selectedDate: todayKey(),
    activeView: 'today',
    deferredInstallPrompt: null,
    toastTimer: null,
    updateBusy: false,
    lastFocusedElement: null
  };

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  init();

  function init() {
    state.data = loadData();
    state.selectedDate = todayKey();
    fillSettingsForm();
    bindEvents();
    renderAll();
    switchView(getInitialView(), false);
    registerServiceWorker();
  }

  function createInitialData(seedWeight) {
    const now = Date.now();
    return {
      version: 1,
      settings: {
        startWeight: 80,
        goalWeight: 70,
        targetDate: '2027-08-31',
        carbsPerKg: 3,
        proteinPerKg: 1.7,
        fatPerKg: 1,
        createdAt: new Date(now).toISOString()
      },
      weights: seedWeight === false ? [] : [{
        id: makeId(),
        date: todayKey(),
        weight: 80,
        note: '初始体重',
        createdAt: now
      }],
      meals: []
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = createInitialData(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.error('读取本地记录失败', error);
      return createInitialData(true);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (error) {
      console.error('保存失败', error);
      showToast('本地保存失败，请检查浏览器存储空间');
    }
  }

  function normalizeData(raw) {
    const source = raw && raw.data ? raw.data : raw;
    if (!source || typeof source !== 'object') {
      throw new Error('数据格式不正确');
    }

    const defaults = createInitialData(false);
    const sourceSettings = source.settings && typeof source.settings === 'object' ? source.settings : {};
    const settings = Object.assign({}, defaults.settings, sourceSettings);

    settings.startWeight = positiveNumber(settings.startWeight, defaults.settings.startWeight);
    settings.goalWeight = positiveNumber(settings.goalWeight, defaults.settings.goalWeight);
    settings.carbsPerKg = nonNegativeNumber(settings.carbsPerKg, defaults.settings.carbsPerKg);
    settings.proteinPerKg = nonNegativeNumber(settings.proteinPerKg, defaults.settings.proteinPerKg);
    settings.fatPerKg = nonNegativeNumber(settings.fatPerKg, defaults.settings.fatPerKg);
    settings.targetDate = isDateKey(settings.targetDate) ? settings.targetDate : defaults.settings.targetDate;

    const weights = Array.isArray(source.weights) ? source.weights.map((item, index) => {
      const weight = positiveNumber(item && item.weight, 0);
      const date = item && isDateKey(item.date) ? item.date : '';
      if (!weight || !date) return null;
      return {
        id: item.id ? String(item.id) : makeId() + '-' + index,
        date: date,
        weight: weight,
        note: item.note ? String(item.note).slice(0, 80) : '',
        createdAt: Number(item.createdAt) || Date.now() + index
      };
    }).filter(Boolean) : [];

    const meals = Array.isArray(source.meals) ? source.meals.map((item, index) => {
      const date = item && isDateKey(item.date) ? item.date : '';
      const food = item && item.food ? String(item.food).trim().slice(0, 300) : '';
      if (!date || !food) return null;
      return {
        id: item.id ? String(item.id) : makeId() + '-m' + index,
        date: date,
        type: MEAL_TYPES.indexOf(item.type) >= 0 ? item.type : '加餐',
        food: food,
        kcal: nonNegativeNumber(item.kcal, 0),
        protein: nonNegativeNumber(item.protein, 0),
        carbs: nonNegativeNumber(item.carbs, 0),
        fat: nonNegativeNumber(item.fat, 0),
        createdAt: Number(item.createdAt) || Date.now() + index
      };
    }).filter(Boolean) : [];

    return { version: 1, settings: settings, weights: weights, meals: meals };
  }

  function bindEvents() {
    $$('[data-view-target]').forEach((button) => {
      button.addEventListener('click', () => switchView(button.dataset.viewTarget));
    });

    $$('[data-open-weight]').forEach((button) => {
      button.addEventListener('click', () => openWeightModal());
    });

    $$('[data-open-meal]').forEach((button) => {
      button.addEventListener('click', () => openMealModal());
    });

    $$('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', closeModals);
    });

    $('#previousDayButton').addEventListener('click', () => {
      state.selectedDate = shiftDateKey(state.selectedDate, -1);
      renderDashboard();
    });

    $('#nextDayButton').addEventListener('click', () => {
      state.selectedDate = shiftDateKey(state.selectedDate, 1);
      renderDashboard();
    });

    $('#dashboardDate').addEventListener('change', (event) => {
      if (isDateKey(event.target.value)) {
        state.selectedDate = event.target.value;
        renderDashboard();
      }
    });

    $('#weightForm').addEventListener('submit', handleWeightSubmit);
    $('#mealForm').addEventListener('submit', handleMealSubmit);
    $('#settingsForm').addEventListener('submit', handleSettingsSubmit);

    $('#quickUpdateButton').addEventListener('click', checkForUpdates);
    $('#settingsUpdateButton').addEventListener('click', checkForUpdates);
    $('#installButton').addEventListener('click', handleInstall);
    $('#exportButton').addEventListener('click', exportBackup);
    $('#importButton').addEventListener('click', () => $('#importFileInput').click());
    $('#importFileInput').addEventListener('change', importBackup);
    $('#clearDataButton').addEventListener('click', clearAllData);

    $('#mealGroups').addEventListener('click', handleMealGroupClick);
    $('#weightHistory').addEventListener('click', handleWeightHistoryClick);

    window.addEventListener('hashchange', () => switchView(getInitialView(), false));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModals();
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
    });

    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      showToast('已添加到手机桌面');
    });

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          state.data = normalizeData(JSON.parse(event.newValue));
          fillSettingsForm();
          renderAll();
        } catch (error) {
          console.error('同步其他标签页数据失败', error);
        }
      }
    });
  }

  function renderAll() {
    renderDashboard();
    renderWeightView();
  }

  function renderDashboard() {
    const latest = getLatestWeightRecord();
    const previous = getPreviousWeightRecord(latest);
    const settings = state.data.settings;
    const targets = getMacroTargets();
    const selectedMeals = getMealsForDate(state.selectedDate);
    const totals = sumMeals(selectedMeals);

    const greeting = getGreetingPrefix();
    $('#greetingText').textContent = greeting + ' · ' + formatLongDate(todayKey());

    if (latest) {
      $('#latestWeight').textContent = latest.weight.toFixed(1);
      const remaining = Math.max(0, latest.weight - settings.goalWeight);
      $('#remainingText').textContent = remaining > 0 ? '还差 ' + formatOneDecimal(remaining) + ' kg' : '已达成目标';
      const progress = getGoalProgress(latest.weight, settings.startWeight, settings.goalWeight);
      $('#goalProgress').style.width = progress + '%';
    } else {
      $('#latestWeight').textContent = '--';
      $('#remainingText').textContent = '记录后查看进度';
      $('#goalProgress').style.width = '0%';
    }

    $('#goalWeightText').textContent = formatOneDecimal(settings.goalWeight);
    renderLatestTrend(latest, previous);

    $('#dateHeading').textContent = formatDateLabel(state.selectedDate);
    $('#dashboardDate').value = state.selectedDate;

    $('#dailyKcalText').textContent = Math.round(totals.kcal) + ' / ' + Math.round(targets.kcal) + ' kcal';
    $('#mealCountText').textContent = selectedMeals.length + ' 项记录';

    $('#proteinText').textContent = Math.round(totals.protein) + ' / ' + Math.round(targets.protein) + 'g';
    $('#carbsText').textContent = Math.round(totals.carbs) + ' / ' + Math.round(targets.carbs) + 'g';
    $('#fatText').textContent = Math.round(totals.fat) + ' / ' + Math.round(targets.fat) + 'g';

    setProgress('#proteinBar', totals.protein, targets.protein);
    setProgress('#carbsBar', totals.carbs, targets.carbs);
    setProgress('#fatBar', totals.fat, targets.fat);

    renderMealGroups(selectedMeals);
  }

  function renderLatestTrend(latest, previous) {
    const chip = $('#latestTrend');
    chip.classList.remove('is-up', 'is-down', 'is-neutral');

    if (!latest || !previous) {
      chip.classList.add('is-neutral');
      chip.textContent = '还没有趋势';
      return;
    }

    const difference = latest.weight - previous.weight;
    if (Math.abs(difference) < 0.05) {
      chip.classList.add('is-neutral');
      chip.textContent = '与上次持平';
    } else if (difference < 0) {
      chip.classList.add('is-down');
      chip.textContent = '↓ ' + Math.abs(difference).toFixed(1) + ' kg';
    } else {
      chip.classList.add('is-up');
      chip.textContent = '↑ ' + difference.toFixed(1) + ' kg';
    }
  }

  function renderMealGroups(meals) {
    const container = $('#mealGroups');
    if (!meals.length) {
      container.innerHTML = '<div class="empty-state">' +
        '<span class="empty-mark">＋</span>' +
        '<strong>这一天还没有饮食记录</strong>' +
        '<p>记下吃了什么，热量和营养素可以稍后再补。</p>' +
        '<button type="button" data-add-meal>添加第一项</button>' +
        '</div>';
      return;
    }

    const parts = [];
    MEAL_TYPES.forEach((type) => {
      const entries = meals.filter((meal) => meal.type === type);
      if (!entries.length) return;
      const groupKcal = entries.reduce((sum, meal) => sum + Number(meal.kcal || 0), 0);
      parts.push('<article class="meal-group" data-type="' + escapeHtml(type) + '">');
      parts.push('<div class="meal-group-head">');
      parts.push('<div class="meal-group-title">');
      parts.push('<span class="meal-icon">' + escapeHtml(type.slice(0, 1)) + '</span>');
      parts.push('<div><strong>' + escapeHtml(type) + '</strong><small>' + Math.round(groupKcal) + ' kcal</small></div>');
      parts.push('</div>');
      parts.push('<button class="delete-entry" type="button" data-add-meal aria-label="添加' + escapeHtml(type) + '记录" title="添加记录">＋</button>');
      parts.push('</div>');

      entries.forEach((meal) => {
        const tags = [];
        if (meal.kcal > 0) tags.push(Math.round(meal.kcal) + ' kcal');
        if (meal.protein > 0) tags.push('蛋白质 ' + formatOneDecimal(meal.protein) + 'g');
        if (meal.carbs > 0) tags.push('碳水 ' + formatOneDecimal(meal.carbs) + 'g');
        if (meal.fat > 0) tags.push('脂肪 ' + formatOneDecimal(meal.fat) + 'g');
        parts.push('<div class="meal-entry">');
        parts.push('<div class="meal-entry-main">');
        parts.push('<div class="meal-entry-copy"><p>' + escapeHtml(meal.food) + '</p>');
        if (tags.length) {
          parts.push('<div class="meal-tags">' + tags.map((tag) => '<span>' + escapeHtml(tag) + '</span>').join('') + '</div>');
        }
        parts.push('</div>');
        parts.push('<button class="delete-entry" type="button" data-delete-meal="' + escapeHtml(meal.id) + '" aria-label="删除这条饮食记录" title="删除">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V4.8h6V7M7.5 7l.8 12h7.4l.8-12M10 11v4.8M14 11v4.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>');
        parts.push('</div>');
        parts.push('</div>');
      });

      parts.push('</article>');
    });

    container.innerHTML = parts.join('');
  }

  function renderWeightView() {
    const latest = getLatestWeightRecord();
    const settings = state.data.settings;
    const records = getSortedWeightsDescending();

    $('#weightLatestStat').textContent = latest ? latest.weight.toFixed(1) : '--';
    $('#weightDateStat').textContent = latest ? formatHistoryDate(latest.date) : '还没有记录';
    $('#weightRemainingStat').textContent = latest ? formatOneDecimal(Math.max(0, latest.weight - settings.goalWeight)) : '--';
    $('#weightGoalStat').textContent = '目标 ' + formatOneDecimal(settings.goalWeight) + 'kg';
    $('#weightRecordCount').textContent = records.length + ' 条';

    renderWeightChart();
    renderWeightHistory(records);
  }

  function renderWeightHistory(records) {
    const container = $('#weightHistory');
    if (!records.length) {
      container.innerHTML = '<div class="empty-state">' +
        '<span class="empty-mark">↗</span>' +
        '<strong>还没有体重记录</strong>' +
        '<p>建议在相近时间、相同状态下称重。</p>' +
        '<button type="button" data-add-weight>记录第一次体重</button>' +
        '</div>';
      return;
    }

    container.innerHTML = records.map((record) => {
      return '<div class="weight-row">' +
        '<div class="weight-row-date"><strong>' + escapeHtml(formatHistoryDate(record.date)) + '</strong><small>' + escapeHtml(getWeekday(record.date)) + '</small></div>' +
        '<div class="weight-row-value"><b>' + record.weight.toFixed(1) + '</b><small>kg</small></div>' +
        '<div class="weight-row-note">' + escapeHtml(record.note || '') + '</div>' +
        '<button class="delete-entry" type="button" data-delete-weight="' + escapeHtml(record.id) + '" aria-label="删除这条体重记录" title="删除">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V4.8h6V7M7.5 7l.8 12h7.4l.8-12M10 11v4.8M14 11v4.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '</div>';
    }).join('');
  }

  function renderWeightChart() {
    const svg = $('#weightChart');
    const allRecords = getSortedWeightsAscending();
    const records = allRecords.slice(-30);
    const goal = Number(state.data.settings.goalWeight);

    if (!records.length) {
      svg.innerHTML = '<text x="180" y="92" text-anchor="middle" class="chart-axis-label">还没有体重记录</text>' +
        '<path class="chart-target-line" d="M20 150H340"></path>';
      return;
    }

    const width = 360;
    const height = 190;
    const padding = { left: 20, right: 18, top: 22, bottom: 30 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const values = records.map((record) => record.weight).concat([goal]);
    let minValue = Math.min.apply(null, values) - 1;
    let maxValue = Math.max.apply(null, values) + 1;
    if (maxValue - minValue < 3) {
      const middle = (maxValue + minValue) / 2;
      minValue = middle - 1.5;
      maxValue = middle + 1.5;
    }

    const xFor = (index) => {
      if (records.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (index / (records.length - 1)) * plotWidth;
    };
    const yFor = (value) => padding.top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;

    const parts = [];
    parts.push('<defs><linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#6ca88c" stop-opacity=".26"></stop>' +
      '<stop offset="100%" stop-color="#6ca88c" stop-opacity="0"></stop>' +
      '</linearGradient></defs>');

    for (let index = 0; index < 4; index += 1) {
      const ratio = index / 3;
      const y = padding.top + ratio * plotHeight;
      const value = maxValue - ratio * (maxValue - minValue);
      parts.push('<line class="chart-grid-line" x1="' + padding.left + '" y1="' + y.toFixed(1) + '" x2="' + (width - padding.right) + '" y2="' + y.toFixed(1) + '"></line>');
      parts.push('<text class="chart-axis-label" x="' + (padding.left + 2) + '" y="' + (y - 4).toFixed(1) + '">' + value.toFixed(1) + '</text>');
    }

    const targetY = yFor(goal).toFixed(1);
    parts.push('<line class="chart-target-line" x1="' + padding.left + '" y1="' + targetY + '" x2="' + (width - padding.right) + '" y2="' + targetY + '"></line>');
    parts.push('<text class="chart-axis-label" x="' + (width - padding.right - 54) + '" y="' + (Number(targetY) - 5).toFixed(1) + '">目标 ' + goal.toFixed(1) + '</text>');

    const pointStrings = records.map((record, index) => {
      return xFor(index).toFixed(1) + ',' + yFor(record.weight).toFixed(1);
    });
    const firstPoint = pointStrings[0].split(',');
    const lastPoint = pointStrings[pointStrings.length - 1].split(',');
    const bottom = (height - padding.bottom).toFixed(1);
    const areaPath = 'M' + pointStrings.join(' L') + ' L' + lastPoint[0] + ' ' + bottom + ' L' + firstPoint[0] + ' ' + bottom + ' Z';

    parts.push('<path class="chart-area" d="' + areaPath + '"></path>');
    parts.push('<path class="chart-line" d="M' + pointStrings.join(' L') + '"></path>');

    records.forEach((record, index) => {
      const isLast = index === records.length - 1;
      parts.push('<circle class="' + (isLast ? 'chart-point-last' : 'chart-point') + '" cx="' + xFor(index).toFixed(1) + '" cy="' + yFor(record.weight).toFixed(1) + '" r="' + (isLast ? 4.2 : 2.7) + '"></circle>');
    });

    const firstDate = formatChartDate(records[0].date);
    const lastDate = formatChartDate(records[records.length - 1].date);
    parts.push('<text class="chart-axis-label" x="' + padding.left + '" y="' + (height - 8) + '">' + escapeHtml(firstDate) + '</text>');
    if (records.length > 1) {
      parts.push('<text class="chart-axis-label" x="' + (width - padding.right) + '" y="' + (height - 8) + '" text-anchor="end">' + escapeHtml(lastDate) + '</text>');
    }

    svg.innerHTML = parts.join('');
  }

  function fillSettingsForm() {
    if (!state.data) return;
    const settings = state.data.settings;
    $('#settingStartWeight').value = settings.startWeight;
    $('#settingGoalWeight').value = settings.goalWeight;
    $('#settingTargetDate').value = settings.targetDate;
    $('#settingCarbsRatio').value = settings.carbsPerKg;
    $('#settingProteinRatio').value = settings.proteinPerKg;
    $('#settingFatRatio').value = settings.fatPerKg;
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    const startWeight = Number($('#settingStartWeight').value);
    const goalWeight = Number($('#settingGoalWeight').value);
    const targetDate = $('#settingTargetDate').value;
    const carbsPerKg = Number($('#settingCarbsRatio').value);
    const proteinPerKg = Number($('#settingProteinRatio').value);
    const fatPerKg = Number($('#settingFatRatio').value);

    if (!Number.isFinite(startWeight) || !Number.isFinite(goalWeight) || startWeight < 30 || goalWeight < 30) {
      showToast('请输入有效的起始体重和目标体重');
      return;
    }

    if (goalWeight >= startWeight) {
      showToast('目标体重需要低于起始体重');
      return;
    }

    if (!isDateKey(targetDate)) {
      showToast('请选择有效的目标日期');
      return;
    }

    const ratios = [carbsPerKg, proteinPerKg, fatPerKg];
    if (ratios.some((ratio) => !Number.isFinite(ratio) || ratio < 0)) {
      showToast('营养比例不能为负数');
      return;
    }

    state.data.settings = {
      startWeight: startWeight,
      goalWeight: goalWeight,
      targetDate: targetDate,
      carbsPerKg: carbsPerKg,
      proteinPerKg: proteinPerKg,
      fatPerKg: fatPerKg,
      createdAt: state.data.settings.createdAt || new Date().toISOString()
    };

    saveData();
    renderAll();
    showToast('目标设置已保存');
  }

  function handleWeightSubmit(event) {
    event.preventDefault();
    const date = $('#weightDateInput').value;
    const weight = Number($('#weightValueInput').value);
    const note = $('#weightNoteInput').value.trim();

    if (!isDateKey(date) || !Number.isFinite(weight) || weight < 30 || weight > 250) {
      showToast('请输入有效日期和体重');
      return;
    }

    state.data.weights.push({
      id: makeId(),
      date: date,
      weight: Math.round(weight * 10) / 10,
      note: note.slice(0, 80),
      createdAt: Date.now()
    });

    saveData();
    state.selectedDate = date;
    closeModals();
    renderAll();
    showToast('体重已记录');
  }

  function handleMealSubmit(event) {
    event.preventDefault();
    const date = $('#mealDateInput').value;
    const food = $('#mealFoodInput').value.trim();
    const checkedType = $('input[name="mealType"]:checked');
    const type = checkedType ? checkedType.value : '加餐';
    const protein = nonNegativeNumber($('#mealProteinInput').value, 0);
    const carbs = nonNegativeNumber($('#mealCarbsInput').value, 0);
    const fat = nonNegativeNumber($('#mealFatInput').value, 0);
    let kcal = nonNegativeNumber($('#mealKcalInput').value, 0);

    if (!isDateKey(date) || !food) {
      showToast('请填写日期和食物内容');
      return;
    }

    if (!kcal && (protein || carbs || fat)) {
      kcal = Math.round(protein * 4 + carbs * 4 + fat * 9);
    }

    state.data.meals.push({
      id: makeId(),
      date: date,
      type: type,
      food: food.slice(0, 300),
      kcal: kcal,
      protein: protein,
      carbs: carbs,
      fat: fat,
      createdAt: Date.now()
    });

    saveData();
    state.selectedDate = date;
    closeModals();
    renderAll();
    showToast('饮食记录已添加');
  }

  function handleMealGroupClick(event) {
    const addButton = event.target.closest('[data-add-meal]');
    if (addButton) {
      openMealModal();
      return;
    }

    const deleteButton = event.target.closest('[data-delete-meal]');
    if (!deleteButton) return;
    const id = deleteButton.dataset.deleteMeal;
    const entry = state.data.meals.find((meal) => meal.id === id);
    if (!entry) return;
    if (!window.confirm('确定删除这条饮食记录吗？')) return;
    state.data.meals = state.data.meals.filter((meal) => meal.id !== id);
    saveData();
    renderAll();
    showToast('已删除饮食记录');
  }

  function handleWeightHistoryClick(event) {
    const addButton = event.target.closest('[data-add-weight]');
    if (addButton) {
      openWeightModal();
      return;
    }

    const deleteButton = event.target.closest('[data-delete-weight]');
    if (!deleteButton) return;
    const id = deleteButton.dataset.deleteWeight;
    const entry = state.data.weights.find((record) => record.id === id);
    if (!entry) return;
    if (!window.confirm('确定删除这条体重记录吗？')) return;
    state.data.weights = state.data.weights.filter((record) => record.id !== id);
    saveData();
    renderAll();
    showToast('已删除体重记录');
  }

  function openWeightModal() {
    const latest = getLatestWeightRecord();
    $('#weightDateInput').value = state.selectedDate || todayKey();
    $('#weightValueInput').value = latest ? latest.weight.toFixed(1) : state.data.settings.startWeight;
    $('#weightNoteInput').value = '';
    openModal('weightModal', '#weightValueInput');
  }

  function openMealModal() {
    const form = $('#mealForm');
    form.reset();
    $('#mealDateInput').value = state.selectedDate || todayKey();
    $('#nutritionDetails').open = false;
    openModal('mealModal', '#mealFoodInput');
  }

  function openModal(id, focusSelector) {
    closeModals();
    state.lastFocusedElement = document.activeElement;
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      const focusTarget = focusSelector ? $(focusSelector, modal) : null;
      if (focusTarget) focusTarget.focus();
    }, 120);
  }

  function closeModals() {
    const openModals = $$('.modal.is-open');
    if (!openModals.length) return;
    openModals.forEach((modal) => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
      state.lastFocusedElement.focus();
    }
  }

  function switchView(view, updateHash) {
    const safeView = VIEWS.indexOf(view) >= 0 ? view : 'today';
    state.activeView = safeView;

    $$('[data-view-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.viewPanel === safeView);
    });

    $$('[data-view-target]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.viewTarget === safeView);
    });

    if (safeView === 'settings') fillSettingsForm();
    if (safeView === 'weight') renderWeightView();
    if (updateHash !== false && window.location.hash !== '#' + safeView) {
      window.history.replaceState(null, '', '#' + safeView);
    }
    window.scrollTo(0, 0);
  }

  function getInitialView() {
    const hash = window.location.hash.replace('#', '');
    return VIEWS.indexOf(hash) >= 0 ? hash : 'today';
  }

  function setProgress(selector, value, target) {
    const element = $(selector);
    if (!element) return;
    const ratio = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0;
    element.style.width = ratio + '%';
    element.classList.toggle('is-over', target > 0 && value > target);
  }

  function sumMeals(meals) {
    return meals.reduce((totals, meal) => {
      totals.kcal += Number(meal.kcal || 0);
      totals.protein += Number(meal.protein || 0);
      totals.carbs += Number(meal.carbs || 0);
      totals.fat += Number(meal.fat || 0);
      return totals;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function getMacroTargets() {
    const settings = state.data.settings;
    const latest = getLatestWeightRecord();
    const baseWeight = latest ? latest.weight : settings.startWeight;
    const protein = baseWeight * settings.proteinPerKg;
    const carbs = baseWeight * settings.carbsPerKg;
    const fat = baseWeight * settings.fatPerKg;
    return {
      weight: baseWeight,
      protein: protein,
      carbs: carbs,
      fat: fat,
      kcal: protein * 4 + carbs * 4 + fat * 9
    };
  }

  function getMealsForDate(date) {
    return state.data.meals
      .filter((meal) => meal.date === date)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function getSortedWeightsAscending() {
    return state.data.weights.slice().sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.createdAt - b.createdAt;
    });
  }

  function getSortedWeightsDescending() {
    return getSortedWeightsAscending().reverse();
  }

  function getLatestWeightRecord() {
    const records = getSortedWeightsAscending();
    return records.length ? records[records.length - 1] : null;
  }

  function getPreviousWeightRecord(latest) {
    if (!latest) return null;
    const records = getSortedWeightsAscending();
    const index = records.findIndex((record) => record.id === latest.id);
    return index > 0 ? records[index - 1] : null;
  }

  function getGoalProgress(current, start, goal) {
    const total = start - goal;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((start - current) / total) * 100));
  }

  function exportBackup() {
    const payload = JSON.stringify(state.data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '轻养记录备份-' + todayKey() + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('备份文件已生成');
  }

  async function importBackup(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const imported = normalizeData(JSON.parse(text));
      if (!window.confirm('导入会覆盖当前记录，确定继续吗？')) return;
      state.data = imported;
      state.selectedDate = todayKey();
      saveData();
      fillSettingsForm();
      renderAll();
      showToast('备份已导入');
    } catch (error) {
      console.error('导入失败', error);
      showToast('导入失败，请选择有效的备份文件');
    }
  }

  function clearAllData() {
    if (!window.confirm('会删除全部体重和饮食记录。建议先导出备份，确定清空吗？')) return;
    state.data = createInitialData(false);
    state.selectedDate = todayKey();
    saveData();
    fillSettingsForm();
    renderAll();
    showToast('全部记录已清空');
  }

  async function handleInstall() {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      return;
    }

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      showToast('在 Safari 中点“分享”，再选“添加到主屏幕”');
    } else {
      showToast('请使用浏览器菜单中的“添加到主屏幕”');
    }
  }

  async function checkForUpdates() {
    if (state.updateBusy) return;
    state.updateBusy = true;
    const quickButton = $('#quickUpdateButton');
    quickButton.classList.add('is-spinning');
    showToast('正在检查最新版本…');

    try {
      const probe = await fetch('./index.html?update=' + Date.now(), { cache: 'no-store' });
      if (!probe.ok) throw new Error('无法读取最新页面');

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames
        .filter((name) => name.indexOf('qingyang-') === 0)
        .map((name) => caches.delete(name)));

      showToast('已获取最新版本，正在刷新');
      window.setTimeout(() => {
        window.location.replace('./index.html?updated=' + Date.now());
      }, 500);
    } catch (error) {
      console.error('更新失败', error);
      showToast('更新失败，请检查网络后重试');
    } finally {
      state.updateBusy = false;
      quickButton.classList.remove('is-spinning');
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('离线缓存未启用', error);
      });
    });
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function getGreetingPrefix() {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseDateKey(key) {
    const parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
  }

  function shiftDateKey(key, amount) {
    const date = parseDateKey(key);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
  }

  function isDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDateKey(value).getTime());
  }

  function formatDateLabel(key) {
    if (key === todayKey()) return '今天';
    if (key === shiftDateKey(todayKey(), -1)) return '昨天';
    if (key === shiftDateKey(todayKey(), 1)) return '明天';
    return formatHistoryDate(key);
  }

  function formatLongDate(key) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }).format(parseDateKey(key));
  }

  function formatHistoryDate(key) {
    const date = parseDateKey(key);
    const currentYear = new Date().getFullYear();
    if (date.getFullYear() === currentYear) {
      return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(date);
    }
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date);
  }

  function formatChartDate(key) {
    const date = parseDateKey(key);
    return (date.getMonth() + 1) + '/' + date.getDate();
  }

  function getWeekday(key) {
    return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(parseDateKey(key));
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function nonNegativeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function formatOneDecimal(value) {
    return Number(value).toFixed(1).replace(/\.0$/, '');
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
