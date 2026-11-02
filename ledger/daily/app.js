(function () {
  "use strict";

  var LEDGER_KEY = "monthEndLedger.v1";
  var SETTINGS_KEY = "dailySpend.settings.v1";
  var SOURCE_NAME = "每日快速記帳";
  var CURRENT_VERSION = "1.0.0";
  var DEFAULT_CATEGORY_NAMES = ["餐饮", "交通", "充值缴费", "医疗", "服饰", "家居", "数码电器", "订阅", "日用百货", "娱乐", "其他"];
  var DEFAULT_ACCOUNT_NAMES = ["支付宝", "微信", "建设银行储蓄卡", "现金"];
  var DEFAULT_SETTINGS = {
    monthlyBudget: 1650,
    safeBudget: 1900,
    foodCap: 610,
    waterCap: 91,
    transportCap: 602,
    lastCategory: "food",
    lastPay: "微信零錢"
  };
  var CATEGORY_DEFS = [
    { key: "ingredients", group: "food", name: "食材", id: "cat-食材", icon: "🥬", color: "#16835f", soft: "#e4f3ec", aliases: ["食材", "食品", "買菜", "买菜", "菜市場", "菜市场"], notes: ["菜市場", "超市", "水果", "糧油"] },
    { key: "water", group: "water", name: "飲水", id: "cat-飲水", icon: "💧", color: "#1685b7", soft: "#e4f2f8", aliases: ["飲水", "饮水", "買水", "买水", "水"], notes: ["瓶裝水", "桶裝水", "飲料"] },
    { key: "food", group: "food", name: "吃的", id: "cat-餐饮", icon: "🍚", color: "#d96a25", soft: "#fff0e6", aliases: ["餐飲", "餐饮", "吃的", "外食", "用餐"], notes: ["早餐", "午餐", "晚餐", "外賣", "零食"] },
    { key: "transport", group: "transport", name: "交通", id: "cat-交通", icon: "🚌", color: "#7560b6", soft: "#efebfa", aliases: ["交通", "交通費", "交通费", "出行"], notes: ["公交", "地鐵", "共享單車", "打車"] }
  ];
  var PAY_ACCOUNT_NAMES = {
    "微信零錢": "微信",
    "支付寶": "支付宝",
    "建設銀行儲蓄卡": "建设银行储蓄卡",
    "現金": "现金"
  };
  var refs = {
    todayLabel: byId("todayLabel"), todayTotal: byId("todayTotal"), todayMeta: byId("todayMeta"),
    paceDial: byId("paceDial"), pacePercent: byId("pacePercent"), monthSpent: byId("monthSpent"),
    monthBudget: byId("monthBudget"), monthLabel: byId("monthLabel"), monthProgress: byId("monthProgress"),
    budgetLeft: byId("budgetLeft"), dailyPace: byId("dailyPace"), expenseForm: byId("expenseForm"),
    entryCard: byId("entryCard"), entryTitle: byId("entryTitle"), amountInput: byId("amountInput"),
    amountError: byId("amountError"), categoryError: byId("categoryError"), categoryGrid: byId("categoryGrid"),
    noteInput: byId("noteInput"), quickNotes: byId("quickNotes"), dateInput: byId("dateInput"),
    payInput: byId("payInput"), saveButton: byId("saveButton"), saveButtonText: byId("saveButtonText"),
    cancelEditButton: byId("cancelEditButton"), adviceStatus: byId("adviceStatus"), adviceLead: byId("adviceLead"),
    adviceList: byId("adviceList"), trendChart: byId("trendChart"), trendTotal: byId("trendTotal"),
    categorySummaryList: byId("categorySummaryList"), categoryTotal: byId("categoryTotal"),
    historyList: byId("historyList"), historyTitle: byId("historyTitle"), exportButton: byId("exportButton"),
    settingsButton: byId("settingsButton"), settingsModal: byId("settingsModal"), closeSettingsButton: byId("closeSettingsButton"),
    settingsForm: byId("settingsForm"), monthlyBudgetInput: byId("monthlyBudgetInput"), safeBudgetInput: byId("safeBudgetInput"),
    foodCapInput: byId("foodCapInput"), waterCapInput: byId("waterCapInput"), transportCapInput: byId("transportCapInput"),
    exportSettingsButton: byId("exportSettingsButton"), installHelpButton: byId("installHelpButton"), installHelp: byId("installHelp"),
    installButton: byId("installButton"), changeMonthButton: byId("changeMonthButton"), monthModal: byId("monthModal"),
    closeMonthButton: byId("closeMonthButton"), monthInput: byId("monthInput"), previousMonthButton: byId("previousMonthButton"),
    currentMonthButton: byId("currentMonthButton"), toast: byId("toast"), toastText: byId("toastText"), undoButton: byId("undoButton")
  };
  var state;
  var categoryMap = {};
  var settings = loadSettings();
  var selectedMonth = currentMonthKey();
  var selectedCategory = settings.lastCategory || "food";
  var editingId = "";
  var toastTimer = 0;
  var undoHandler = null;
  var deferredInstallPrompt = null;

  initialize();

  function initialize() {
    refs.dateInput.value = todayString();
    refs.todayLabel.textContent = formatLongDate(todayString());
    selectCategory(selectedCategory, false);
    refs.payInput.value = settings.lastPay || "微信零錢";
    if (!refs.payInput.value) refs.payInput.value = "微信零錢";
    refreshData();
    bindEvents();
    registerServiceWorker();
    window.setInterval(checkDateRollover, 60000);
  }

  function byId(id) { return document.getElementById(id); }
  function num(value) { var n = Number(value); return Number.isFinite(n) ? n : 0; }
  function round2(value) { return Math.round((num(value) + Number.EPSILON) * 100) / 100; }
  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function normalizeName(value) { return String(value == null ? "" : value).toLowerCase().replace(/[\s\-_/（）()·.]+/g, ""); }
  function pad(value) { return String(value).padStart(2, "0"); }
  function uid(prefix) { return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function todayString() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function currentMonthKey() { return todayString().slice(0, 7); }
  function parseDate(text) {
    var p = String(text || "").slice(0, 10).split("-");
    if (p.length !== 3) return new Date(NaN);
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function dateString(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(text, count) { var d = parseDate(text); d.setDate(d.getDate() + count); return dateString(d); }
  function daysInMonth(month) { var p = month.split("-"); return new Date(Number(p[0]), Number(p[1]), 0).getDate(); }
  function shiftMonth(month, delta) { var p = month.split("-"); var d = new Date(Number(p[0]), Number(p[1]) - 1 + delta, 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function formatLongDate(text) {
    var d = parseDate(text);
    if (isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + weekdayName(d.getDay());
  }
  function weekdayName(day) { return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][day]; }
  function weekdayFromText(text) { return weekdayName(parseDate(text).getDay()); }
  function monthDisplay(month) {
    if (month === currentMonthKey()) return "本月";
    var p = month.split("-");
    return p[0] + "年" + Number(p[1]) + "月";
  }
  function money(value) {
    var n = round2(value);
    return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function percent(value, digits) {
    var n = Number.isFinite(Number(value)) ? Number(value) : 0;
    return n.toFixed(typeof digits === "number" ? digits : 0) + "%";
  }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (!saved || typeof saved !== "object") return Object.assign({}, DEFAULT_SETTINGS);
      return Object.assign({}, DEFAULT_SETTINGS, saved);
    } catch (error) { return Object.assign({}, DEFAULT_SETTINGS); }
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch (error) { showToast("設定暫時無法儲存，請檢查瀏覽器空間"); }
  }

  function createInitialState() {
    var categories = DEFAULT_CATEGORY_NAMES.map(function (name) { return { id: "cat-" + name, name: name, type: "expense" }; });
    categories.push({ id: "cat-課時費", name: "課時費", type: "income" });
    categories.push({ id: "cat-其他收入", name: "其他收入", type: "income" });
    var accounts = DEFAULT_ACCOUNT_NAMES.map(function (name) { return { id: "acc-" + name, name: name, type: name }; });
    return { version: 1, accounts: accounts, categories: categories, snapshots: [], summaries: [], transactions: [], amortizations: [], debts: [], recurring: [], incomeRules: [], plannedIncome: [], salaryReceived: {} };
  }

  function readLedger() {
    var parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(LEDGER_KEY) || "null"); }
    catch (error) { parsed = null; }
    if (!parsed || typeof parsed !== "object") parsed = createInitialState();
    if (!Array.isArray(parsed.accounts)) parsed.accounts = [];
    if (!Array.isArray(parsed.categories)) parsed.categories = [];
    if (!Array.isArray(parsed.snapshots)) parsed.snapshots = [];
    if (!Array.isArray(parsed.summaries)) parsed.summaries = [];
    if (!Array.isArray(parsed.transactions)) parsed.transactions = [];
    if (!Array.isArray(parsed.amortizations)) parsed.amortizations = [];
    if (!Array.isArray(parsed.debts)) parsed.debts = [];
    if (!Array.isArray(parsed.recurring)) parsed.recurring = [];
    if (!Array.isArray(parsed.incomeRules)) parsed.incomeRules = [];
    if (!Array.isArray(parsed.plannedIncome)) parsed.plannedIncome = [];
    if (!parsed.salaryReceived || typeof parsed.salaryReceived !== "object") parsed.salaryReceived = {};
    return parsed;
  }

  function ensureQuickCategories(ledger) {
    var map = {};
    CATEGORY_DEFS.forEach(function (def) {
      var found = ledger.categories.filter(function (category) { return category && category.id === def.id; })[0];
      if (!found) {
        var aliases = def.aliases.map(normalizeName);
        found = ledger.categories.filter(function (category) {
          return category && category.type === "expense" && aliases.indexOf(normalizeName(category.name)) >= 0;
        })[0];
      }
      if (!found) {
        found = { id: def.id, name: def.id === "cat-餐饮" ? "餐饮" : def.name, type: "expense" };
        ledger.categories.push(found);
      }
      map[def.key] = found.id;
    });
    return map;
  }

  function persistLedger(ledger) {
    try { localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)); return true; }
    catch (error) { showToast("儲存失敗：瀏覽器空間可能已滿，請先匯出備份"); return false; }
  }

  function groupTransactions(ledger, map, month) {
    var ids = CATEGORY_DEFS.map(function (def) { return map[def.key]; }).filter(Boolean);
    return ledger.transactions.filter(function (tx) {
      return tx && String(tx.dt || "").slice(0, 7) === month && ids.indexOf(tx.categoryId) >= 0 && tx.type !== "income" && tx.type !== "transfer-in" && tx.type !== "transfer-out";
    });
  }
  function defForCategoryId(id, map) { return CATEGORY_DEFS.filter(function (def) { return map[def.key] === id; })[0] || null; }
  function refreshData() { state = readLedger(); categoryMap = ensureQuickCategories(state); renderAll(); }
  function renderAll() {
    var currentMonth = currentMonthKey();
    var currentRows = groupTransactions(state, categoryMap, currentMonth);
    var monthRows = groupTransactions(state, categoryMap, selectedMonth);
    var todayRows = currentRows.filter(function (tx) { return tx.dt === todayString(); });
    var todaySpent = sumRows(todayRows);
    var monthSpent = sumRows(monthRows);
    var dim = daysInMonth(selectedMonth);
    var today = new Date();
    var dayOfMonth = selectedMonth === currentMonth ? today.getDate() : Math.min(today.getDate(), dim);
    var elapsed = selectedMonth < currentMonth ? dim : selectedMonth > currentMonth ? 1 : Math.max(1, dayOfMonth);
    var remainingDays = selectedMonth === currentMonth ? Math.max(1, dim - dayOfMonth + 1) : Math.max(1, dim - elapsed + 1);
    var budget = Math.max(1, num(settings.monthlyBudget));
    var safeBudget = Math.max(budget, num(settings.safeBudget));
    var remaining = budget - monthSpent;
    var adjustedDaily = remaining >= 0 ? remaining / remainingDays : 0;

    refs.todayTotal.textContent = money(todaySpent);
    refs.todayMeta.textContent = todayRows.length
      ? todayRows.length + " 筆 · 今日建議控制在 " + money(adjustedDaily) + " 內"
      : "今天還沒有支出，先記下第一筆";
    if (selectedMonth !== currentMonth) {
      refs.todayMeta.textContent = todayRows.length ? "今天 " + todayRows.length + " 筆，正在查看 " + monthDisplay(selectedMonth) : "今天還沒有支出";
    }
    var pace = budget > 0 ? (monthSpent / budget) * 100 : 0;
    refs.pacePercent.textContent = percent(pace);
    refs.paceDial.style.setProperty("--pace-angle", Math.min(360, pace * 3.6) + "deg");
    refs.paceDial.setAttribute("aria-label", "本月預算已使用 " + percent(pace, 1));
    refs.paceDial.style.background = pace > 100 ? "conic-gradient(#ff8f83 360deg, rgba(255,255,255,.15) 0)" : "";
    refs.monthSpent.textContent = money(monthSpent);
    refs.monthBudget.textContent = money(budget);
    refs.monthLabel.textContent = monthDisplay(selectedMonth);
    refs.monthProgress.style.width = Math.min(100, Math.max(0, pace)) + "%";
    refs.monthProgress.classList.toggle("over", monthSpent > safeBudget);
    refs.budgetLeft.textContent = remaining >= 0 ? "本月還可用 " + money(remaining) : "已超出 " + money(Math.abs(remaining));
    refs.dailyPace.textContent = "每日基準 " + money(budget / dim);
    refs.historyTitle.textContent = selectedMonth === currentMonth ? "本月生活支出" : monthDisplay(selectedMonth) + "生活支出";
    renderAdvice(monthRows, monthSpent, budget, safeBudget, elapsed, dim, todaySpent, adjustedDaily);
    renderTrend(monthRows);
    renderCategorySummary(monthRows, monthSpent, elapsed, dim);
    renderHistory(monthRows);
  }

  function sumRows(rows) { return rows.reduce(function (total, tx) { return total + num(tx.amount); }, 0); }

  function renderAdvice(rows, spent, budget, safeBudget, elapsed, dim, todaySpent, adjustedDaily) {
    var suggestions = [];
    var projection = rows.length ? spent / Math.max(1, elapsed) * dim : 0;
    var isCurrent = selectedMonth === currentMonthKey();
    var safe = true;
    var foodSpent = sumGroup(rows, "food");
    var waterSpent = sumGroup(rows, "water");
    var transportSpent = sumGroup(rows, "transport");
    var foodPace = proRata(settings.foodCap, elapsed, dim);
    var waterPace = proRata(settings.waterCap, elapsed, dim);
    var transportPace = proRata(settings.transportCap, elapsed, dim);
    var biggest = [
      { name: "食材＋吃的", amount: foodSpent, note: "優先檢查外賣、零食與重複買菜" },
      { name: "交通", amount: transportSpent, note: "可合併辦事路線，短途優先公交或單車" },
      { name: "飲水", amount: waterSpent, note: "可改帶水杯或箱購，減少臨時買水" }
    ].sort(function (a, b) { return b.amount - a.amount; })[0];

    if (!rows.length) {
      refs.adviceStatus.textContent = "起步";
      refs.adviceStatus.className = "advice-status";
      refs.adviceLead.textContent = "先連續記 3 天，再把花費節奏和 " + money(settings.monthlyBudget) + " 月預算比較。";
      suggestions.push("食材與吃的合計基準為 " + money(settings.foodCap) + "／月，平均每天約 " + money(num(settings.foodCap) / dim) + "。");
      suggestions.push("交通基準為 " + money(settings.transportCap) + "／月；每週約 " + money(num(settings.transportCap) * 12 / 52) + " 比較接近你的實際路線。");
      renderAdviceList(suggestions);
      return;
    }
    if (projection <= budget) {
      refs.adviceStatus.textContent = isCurrent ? "節奏平穩" : "預算內";
      refs.adviceStatus.className = "advice-status";
      refs.adviceLead.textContent = isCurrent
        ? "照目前速度，月底約 " + money(projection) + "，比標準預算少 " + money(budget - projection) + "。"
        : monthDisplay(selectedMonth) + "共花 " + money(spent) + "，在 " + money(budget) + " 標準預算內。";
      suggestions.push("目前最大類別是" + biggest.name + " " + money(biggest.amount) + "，仍可控；先守住每天約 " + money(adjustedDaily) + "。");
    } else if (projection <= safeBudget) {
      safe = false;
      refs.adviceStatus.textContent = "需要注意";
      refs.adviceStatus.className = "advice-status warn";
      refs.adviceLead.textContent = "照目前速度，月底約 " + money(projection) + "，會超出標準預算 " + money(projection - budget) + "，但仍在警戒線內。";
      suggestions.push("接下來每天控制在 " + money(adjustedDaily) + " 內；若某天已超過，隔天先減 " + money(Math.max(5, todaySpent - adjustedDaily)) + "。");
    } else {
      safe = false;
      refs.adviceStatus.textContent = "超出警戒";
      refs.adviceStatus.className = "advice-status alert";
      refs.adviceLead.textContent = "照目前速度，月底約 " + money(projection) + "，可能超過警戒上限 " + money(safeBudget) + "。";
      suggestions.push("先暫停非必要外賣、零食與打車，目標把剩餘每天壓在 " + money(Math.max(0, adjustedDaily)) + " 左右。");
    }
    if (elapsed >= 5 && foodSpent > foodPace * 1.15) {
      suggestions.push("食材＋吃的已花 " + money(foodSpent) + "，比同期基準多 " + money(foodSpent - foodPace) + "；先清冰箱，再用食材補足 2–3 餐。");
    } else if (waterSpent > waterPace * 1.3 && waterSpent > 8) {
      suggestions.push("飲水已花 " + money(waterSpent) + "；自備水杯或一次買 1.5L 大瓶，通常比每天買小瓶省。");
    } else if (transportSpent > transportPace * 1.15 && transportSpent > 20) {
      suggestions.push("交通已花 " + money(transportSpent) + "；把同日事項合併路線，短途優先公交或共享單車。");
    } else if (biggest.amount > 0 && !suggestions.some(function (text) { return text.indexOf(biggest.name) >= 0; })) {
      suggestions.push("最大類別是" + biggest.name + " " + money(biggest.amount) + "；" + biggest.note + "。");
    }
    if (rows.length / Math.max(1, elapsed) >= 3.5) {
      suggestions.push("平均每天約 " + (rows.length / Math.max(1, elapsed)).toFixed(1) + " 筆小額支出，集中在一次採買或一次外出，較不容易漏記和重複花費。");
    } else if (isCurrent && todaySpent > adjustedDaily * 1.35 && todaySpent > 10) {
      suggestions.push("今天已比建議節奏多 " + money(todaySpent - adjustedDaily) + "；下一筆先等 10 分鐘，確認是否真的需要。");
    } else if (safe) {
      suggestions.push("接下來每天約 " + money(adjustedDaily) + " 可以花；月底前至少留一次採買緩衝，避免最後幾天超支。");
    }
    renderAdviceList(suggestions.slice(0, 3));
  }

  function proRata(cap, elapsed, dim) { return num(cap) * Math.min(dim, elapsed) / dim; }
  function sumGroup(rows, group) {
    return rows.reduce(function (total, tx) {
      var def = defForCategoryId(tx.categoryId, categoryMap);
      return total + (def && def.group === group ? num(tx.amount) : 0);
    }, 0);
  }
  function renderAdviceList(items) { refs.adviceList.innerHTML = items.map(function (text) { return "<li>" + esc(text) + "</li>"; }).join(""); }
  function renderTrend(monthRows) {
    var current = currentMonthKey();
    var end, start;
    if (selectedMonth > current) { end = selectedMonth + "-01"; start = end; }
    else if (selectedMonth === current) { end = todayString(); start = addDays(end, -6); }
    else { end = selectedMonth + "-" + pad(daysInMonth(selectedMonth)); start = addDays(end, -6); }
    var totals = {};
    monthRows.forEach(function (tx) { totals[tx.dt] = (totals[tx.dt] || 0) + num(tx.amount); });
    var days = [];
    for (var i = 0; i < 7; i += 1) { var date = addDays(start, i); days.push({ date: date, amount: totals[date] || 0 }); }
    var max = Math.max.apply(null, days.map(function (day) { return day.amount; }).concat([1]));
    refs.trendTotal.textContent = money(days.reduce(function (total, day) { return total + day.amount; }, 0));
    refs.trendChart.innerHTML = days.map(function (day) {
      var height = day.amount > 0 ? Math.max(8, day.amount / max * 100) : 3;
      var value = day.amount > 0 ? money(day.amount) : "—";
      var isToday = day.date === todayString();
      return '<div class="trend-day' + (isToday ? " today" : "") + '" title="' + esc(formatLongDate(day.date) + " " + value) + '">' +
        '<div class="trend-bar-wrap"><span class="trend-bar" style="height:' + height.toFixed(1) + '%"></span></div>' +
        '<span class="trend-value">' + esc(value) + '</span>' +
        '<span class="trend-label">' + (isToday ? "今天" : weekdayFromText(day.date).replace("週", "")) + '</span></div>';
    }).join("");
  }

  function renderCategorySummary(rows, total, elapsed, dim) {
    var groups = [
      { key: "food", name: "食材＋吃的", icon: "🍚", color: "#d96a25", amount: sumGroup(rows, "food"), cap: num(settings.foodCap), capLabel: "合計基準" },
      { key: "water", name: "飲水", icon: "💧", color: "#1685b7", amount: sumGroup(rows, "water"), cap: num(settings.waterCap), capLabel: "月基準" },
      { key: "transport", name: "交通", icon: "🚌", color: "#7560b6", amount: sumGroup(rows, "transport"), cap: num(settings.transportCap), capLabel: "月基準" }
    ];
    refs.categoryTotal.textContent = money(total);
    refs.categorySummaryList.innerHTML = groups.map(function (group) {
      var width = group.cap > 0 ? Math.min(100, group.amount / group.cap * 100) : 0;
      var paceCap = proRata(group.cap, elapsed, dim);
      var paceText = group.amount > paceCap * 1.15 && elapsed >= 5 ? " · 偏快" : "";
      return '<div class="category-summary-row">' +
        '<div class="category-name"><span>' + group.icon + '</span><span>' + esc(group.name) + '<small class="category-cap">' + esc(group.capLabel) + " " + money(group.cap) + paceText + '</small></span></div>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + width.toFixed(1) + '%;--cat-color:' + group.color + '"></div></div>' +
        '<div class="category-amount">' + money(group.amount) + '</div></div>';
    }).join("");
  }

  function renderHistory(rows) {
    var sorted = rows.slice().sort(function (a, b) {
      var dateCompare = String(b.dt).localeCompare(String(a.dt));
      if (dateCompare) return dateCompare;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
    if (!sorted.length) {
      refs.historyList.innerHTML = '<div class="history-empty">' + esc(selectedMonth === currentMonthKey() ? "本月還沒有生活支出紀錄。從上方記下第一筆即可。" : monthDisplay(selectedMonth) + "沒有符合條件的支出。") + '</div>';
      return;
    }
    var grouped = {};
    sorted.forEach(function (tx) { if (!grouped[tx.dt]) grouped[tx.dt] = []; grouped[tx.dt].push(tx); });
    var dates = Object.keys(grouped).sort().reverse();
    var shown = 0, truncated = false;
    var html = dates.map(function (date) {
      if (shown >= 100) { truncated = true; return ""; }
      var dayRows = grouped[date].slice(0, Math.max(0, 100 - shown));
      if (dayRows.length < grouped[date].length) truncated = true;
      shown += dayRows.length;
      var open = date === todayString() || date === dates[0];
      return '<details class="day-group"' + (open ? " open" : "") + '>' +
        '<summary><span class="day-heading"><strong>' + esc(shortDate(date)) + '</strong><span>' + esc(weekdayFromText(date)) + '</span></span><span class="day-total">' + money(sumRows(dayRows)) + '</span></summary>' +
        '<div class="day-items">' + dayRows.map(renderExpenseItem).join("") + '</div></details>';
    }).join("");
    if (truncated) html += '<p class="storage-note">只顯示最近 100 筆；完整資料仍保存在資金管理頁。</p>';
    refs.historyList.innerHTML = html;
  }

  function shortDate(date) { var p = String(date).split("-"); return Number(p[1]) + "月" + Number(p[2]) + "日"; }

  function renderExpenseItem(tx) {
    var def = defForCategoryId(tx.categoryId, categoryMap);
    var categoryName = def ? def.name : "支出";
    var icon = def ? def.icon : "¥";
    var soft = def ? def.soft : "#eef2f0";
    var account = state.accounts.filter(function (item) { return item.id === tx.accountId; })[0];
    var meta = [];
    meta.push(tx.pay || (account ? account.name : ""));
    meta.push(tx.source || "手動記錄");
    var editable = tx.source === SOURCE_NAME;
    var title = tx.note || categoryName;
    return '<div class="expense-item"><span class="item-icon" style="--item-soft:' + soft + '">' + icon + '</span>' +
      '<div class="item-copy"><strong>' + esc(title) + '</strong><span>' + esc(categoryName + " · " + meta.join(" · ")) + '</span></div>' +
      '<span class="item-amount">−' + money(tx.amount) + '</span>' +
      (editable ? '<div class="item-actions"><button class="item-action" type="button" data-edit="' + esc(tx.id) + '" aria-label="編輯這筆" title="編輯">✎</button><button class="item-action" type="button" data-delete="' + esc(tx.id) + '" aria-label="刪除這筆" title="刪除">×</button></div>' : '<span class="item-locked">帳單</span>') +
      '</div>';
  }

  function updateTodayLabel() {
    var today = todayString();
    refs.todayLabel.textContent = formatLongDate(today);
    if (refs.dateInput && !editingId) refs.dateInput.value = today;
  }
  function checkDateRollover() {
    var previous = refs.dateInput.value;
    updateTodayLabel();
    if (previous && previous !== todayString() && !editingId) { selectedMonth = currentMonthKey(); renderAll(); }
  }
  function selectCategory(key, rerenderNotes) {
    var def = CATEGORY_DEFS.filter(function (item) { return item.key === key; })[0] || CATEGORY_DEFS[2];
    selectedCategory = def.key;
    Array.prototype.forEach.call(refs.categoryGrid.querySelectorAll("[data-category]"), function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-category") === def.key ? "true" : "false");
    });
    if (rerenderNotes !== false) renderQuickNotes(def);
    refs.categoryError.textContent = "";
    settings.lastCategory = def.key;
  }
  function renderQuickNotes(def) {
    refs.quickNotes.innerHTML = def.notes.map(function (note) {
      var active = refs.noteInput.value === note;
      return '<button type="button" data-note="' + esc(note) + '"' + (active ? ' class="active"' : "") + '>' + esc(note) + '</button>';
    }).join("");
  }
  function amountValue() { return round2(num(refs.amountInput.value)); }
  function setAmount(value) {
    refs.amountInput.value = value;
    refs.amountError.textContent = "";
    refs.amountInput.focus({ preventScroll: true });
  }

  function validateAndGetFormData() {
    refs.amountError.textContent = "";
    refs.categoryError.textContent = "";
    var amount = amountValue();
    if (!(amount > 0)) {
      refs.amountError.textContent = "請先輸入大於 0 的金額";
      refs.amountInput.focus();
      return null;
    }
    if (amount > 99999) {
      refs.amountError.textContent = "單筆金額請低於 ¥99,999";
      refs.amountInput.focus();
      return null;
    }
    if (!selectedCategory) {
      refs.categoryError.textContent = "請選擇一個分類";
      return null;
    }
    var date = refs.dateInput.value || todayString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(parseDate(date).getTime())) {
      showToast("日期格式不正確");
      refs.dateInput.focus();
      return null;
    }
    return { amount: amount, date: date, categoryKey: selectedCategory, note: refs.noteInput.value.trim().slice(0, 60), pay: refs.payInput.value || "微信零錢" };
  }

  function saveExpense() {
    var form = validateAndGetFormData();
    if (!form) return false;
    var ledger = readLedger();
    var map = ensureQuickCategories(ledger);
    var categoryId = map[form.categoryKey];
    var now = new Date().toISOString();
    var accountId = accountIdForPay(ledger, form.pay);
    if (editingId) {
      var oldTx = ledger.transactions.filter(function (tx) { return tx.id === editingId && tx.source === SOURCE_NAME; })[0];
      if (!oldTx) {
        showToast("找不到這筆紀錄，可能已在其他頁面刪除");
        cancelEdit();
        refreshData();
        return false;
      }
      adjustSummary(ledger, String(oldTx.dt).slice(0, 7), oldTx.categoryId, -num(oldTx.amount));
      oldTx.dt = form.date;
      oldTx.amount = form.amount;
      oldTx.categoryId = categoryId;
      oldTx.type = "expense";
      oldTx.accountId = accountId;
      oldTx.note = form.note;
      oldTx.pay = form.pay;
      oldTx.updatedAt = now;
      adjustSummary(ledger, form.date.slice(0, 7), categoryId, form.amount);
    } else {
      ledger.transactions.push({ id: uid("tx"), dt: form.date, amount: form.amount, type: "expense", categoryId: categoryId, accountId: accountId, note: form.note, source: SOURCE_NAME, pay: form.pay, createdAt: now });
      adjustSummary(ledger, form.date.slice(0, 7), categoryId, form.amount);
    }
    if (!persistLedger(ledger)) return false;
    settings.lastCategory = form.categoryKey;
    settings.lastPay = form.pay;
    saveSettings();
    selectedMonth = form.date.slice(0, 7);
    var wasEditing = Boolean(editingId);
    resetFormAfterSave(form.date);
    state = ledger;
    categoryMap = map;
    renderAll();
    showToast(wasEditing ? "已更新這筆支出" : "已記下 " + money(form.amount) + " · 今天共 " + money(todayTotalFromLedger()), null);
    vibrate(18);
    return true;
  }

  function todayTotalFromLedger() {
    if (!state) return 0;
    var map = ensureQuickCategories(state);
    return sumRows(groupTransactions(state, map, currentMonthKey()).filter(function (tx) { return tx.dt === todayString(); }));
  }

  function adjustSummary(ledger, month, categoryId, delta) {
    if (!month || !categoryId || Math.abs(num(delta)) < 0.001) return;
    var p = month.split("-");
    var row = ledger.summaries.filter(function (item) {
      return Number(item.year) === Number(p[0]) && Number(item.month) === Number(p[1]) && item.categoryId === categoryId;
    })[0];
    var next = round2((row ? num(row.amount) : 0) + num(delta));
    if (next <= 0.004) {
      if (row) ledger.summaries = ledger.summaries.filter(function (item) { return item !== row; });
      return;
    }
    if (!row) {
      row = { id: uid("sum"), year: Number(p[0]), month: Number(p[1]), categoryId: categoryId, amount: 0, note: SOURCE_NAME };
      ledger.summaries.push(row);
    }
    row.amount = next;
  }

  function accountIdForPay(ledger, pay) {
    var wanted = PAY_ACCOUNT_NAMES[pay];
    if (!wanted) return "";
    var account = ledger.accounts.filter(function (item) { return item.name === wanted; })[0];
    if (!account) {
      account = ledger.accounts.filter(function (item) {
        return normalizeName(item.name).indexOf(normalizeName(wanted)) >= 0 || normalizeName(wanted).indexOf(normalizeName(item.name)) >= 0;
      })[0];
    }
    return account ? account.id : "";
  }

  function resetFormAfterSave(date) {
    editingId = "";
    refs.amountInput.value = "";
    refs.noteInput.value = "";
    refs.dateInput.value = date || todayString();
    refs.entryTitle.textContent = "花了多少？";
    refs.saveButtonText.textContent = "記下這筆支出";
    refs.cancelEditButton.hidden = true;
    refs.amountError.textContent = "";
    refs.categoryError.textContent = "";
    var def = CATEGORY_DEFS.filter(function (item) { return item.key === selectedCategory; })[0];
    if (def) renderQuickNotes(def);
  }
  function startEdit(id) {
    var tx = state.transactions.filter(function (item) { return item.id === id; })[0];
    if (!tx || tx.source !== SOURCE_NAME) return;
    var def = defForCategoryId(tx.categoryId, categoryMap);
    if (!def) return;
    editingId = id;
    selectedMonth = String(tx.dt).slice(0, 7);
    refs.amountInput.value = num(tx.amount);
    refs.noteInput.value = tx.note || "";
    refs.dateInput.value = tx.dt;
    refs.payInput.value = tx.pay || settings.lastPay || "微信零錢";
    selectCategory(def.key, true);
    refs.entryTitle.textContent = "編輯這筆支出";
    refs.saveButtonText.textContent = "儲存修改";
    refs.cancelEditButton.hidden = false;
    refs.amountError.textContent = "";
    refs.categoryError.textContent = "";
    renderAll();
    refs.entryCard.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(function () { refs.amountInput.focus({ preventScroll: true }); }, 280);
  }

  function cancelEdit() {
    editingId = "";
    refs.entryTitle.textContent = "花了多少？";
    refs.saveButtonText.textContent = "記下這筆支出";
    refs.cancelEditButton.hidden = true;
    refs.amountInput.value = "";
    refs.noteInput.value = "";
    refs.dateInput.value = todayString();
    refs.amountError.textContent = "";
    refs.categoryError.textContent = "";
    var def = CATEGORY_DEFS.filter(function (item) { return item.key === selectedCategory; })[0];
    if (def) renderQuickNotes(def);
  }

  function deleteExpense(id) {
    var ledger = readLedger();
    var map = ensureQuickCategories(ledger);
    var tx = ledger.transactions.filter(function (item) { return item.id === id && item.source === SOURCE_NAME; })[0];
    if (!tx) return;
    adjustSummary(ledger, String(tx.dt).slice(0, 7), tx.categoryId, -num(tx.amount));
    ledger.transactions = ledger.transactions.filter(function (item) { return item.id !== id; });
    if (!persistLedger(ledger)) return;
    state = ledger;
    categoryMap = map;
    renderAll();
    var snapshot = JSON.parse(JSON.stringify(tx));
    showToast("已刪除 " + money(snapshot.amount), function () {
      var restoreLedger = readLedger();
      var restoreMap = ensureQuickCategories(restoreLedger);
      if (!restoreLedger.transactions.some(function (item) { return item.id === snapshot.id; })) {
        restoreLedger.transactions.push(snapshot);
        adjustSummary(restoreLedger, String(snapshot.dt).slice(0, 7), snapshot.categoryId, num(snapshot.amount));
        if (persistLedger(restoreLedger)) {
          state = restoreLedger;
          categoryMap = restoreMap;
          renderAll();
          showToast("已復原這筆支出");
        }
      }
    }, 6500);
    vibrate(12);
  }

  function exportCsv() {
    var rows = groupTransactions(state, categoryMap, selectedMonth).slice().sort(function (a, b) { return String(a.dt).localeCompare(String(b.dt)); });
    if (!rows.length) { showToast("這個月沒有可匯出的生活支出"); return; }
    var header = ["日期", "分類", "金額", "備註", "付款方式", "帳戶", "來源"];
    var lines = [header].concat(rows.map(function (tx) {
      var def = defForCategoryId(tx.categoryId, categoryMap);
      var account = state.accounts.filter(function (item) { return item.id === tx.accountId; })[0];
      return [tx.dt, def ? def.name : "支出", round2(tx.amount), tx.note || "", tx.pay || "", account ? account.name : "", tx.source || ""];
    })).map(function (row) {
      return row.map(function (cell) { return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    var blob = new Blob(["\ufeff" + lines], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "每日支出_" + selectedMonth + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast("已匯出 " + rows.length + " 筆支出");
  }

  function showToast(message, handler, duration) {
    window.clearTimeout(toastTimer);
    refs.toastText.textContent = message;
    undoHandler = typeof handler === "function" ? handler : null;
    refs.undoButton.hidden = !undoHandler;
    refs.toast.classList.add("show");
    toastTimer = window.setTimeout(function () {
      refs.toast.classList.remove("show");
      undoHandler = null;
      refs.undoButton.hidden = true;
    }, typeof duration === "number" ? duration : 2400);
  }
  function openSettings() {
    refs.monthlyBudgetInput.value = settings.monthlyBudget;
    refs.safeBudgetInput.value = settings.safeBudget;
    refs.foodCapInput.value = settings.foodCap;
    refs.waterCapInput.value = settings.waterCap;
    refs.transportCapInput.value = settings.transportCap;
    refs.installHelp.hidden = true;
    refs.settingsModal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeSettings() { refs.settingsModal.hidden = true; document.body.style.overflow = ""; }
  function openMonthModal() { refs.monthInput.value = selectedMonth; refs.monthModal.hidden = false; document.body.style.overflow = "hidden"; }
  function closeMonthModal() { refs.monthModal.hidden = true; document.body.style.overflow = ""; }
  function applyMonth(month) {
    if (!/^\d{4}-\d{2}$/.test(month || "")) return;
    selectedMonth = month;
    closeMonthModal();
    renderAll();
  }
  function saveSettingsFromForm(event) {
    event.preventDefault();
    var monthly = round2(refs.monthlyBudgetInput.value);
    var safe = round2(refs.safeBudgetInput.value);
    var food = round2(refs.foodCapInput.value);
    var water = round2(refs.waterCapInput.value);
    var transport = round2(refs.transportCapInput.value);
    if (!(monthly > 0) || !(safe > 0) || !(food > 0) || !(water > 0) || !(transport > 0)) {
      showToast("所有預算都需要大於 0");
      return;
    }
    settings.monthlyBudget = monthly;
    settings.safeBudget = Math.max(monthly, safe);
    settings.foodCap = food;
    settings.waterCap = water;
    settings.transportCap = transport;
    saveSettings();
    closeSettings();
    renderAll();
    showToast("預算設定已更新");
  }
  function bindEvents() {
    refs.expenseForm.addEventListener("submit", function (event) { event.preventDefault(); saveExpense(); });
    refs.categoryGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category]");
      if (button) selectCategory(button.getAttribute("data-category"), true);
    });
    refs.quickNotes.addEventListener("click", function (event) {
      var button = event.target.closest("[data-note]");
      if (!button) return;
      var note = button.getAttribute("data-note");
      refs.noteInput.value = refs.noteInput.value === note ? "" : note;
      renderQuickNotes(CATEGORY_DEFS.filter(function (def) { return def.key === selectedCategory; })[0]);
    });
    refs.noteInput.addEventListener("input", function () {
      var def = CATEGORY_DEFS.filter(function (item) { return item.key === selectedCategory; })[0];
      if (def) renderQuickNotes(def);
    });
    byId("quickAmounts").addEventListener("click", function (event) {
      var button = event.target.closest("[data-amount]");
      if (button) setAmount(button.getAttribute("data-amount"));
    });
    refs.amountInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); saveExpense(); }
    });
    refs.amountInput.addEventListener("input", function () { refs.amountError.textContent = ""; });
    refs.cancelEditButton.addEventListener("click", cancelEdit);
    refs.historyList.addEventListener("click", function (event) {
      var edit = event.target.closest("[data-edit]");
      if (edit) { startEdit(edit.getAttribute("data-edit")); return; }
      var remove = event.target.closest("[data-delete]");
      if (remove) deleteExpense(remove.getAttribute("data-delete"));
    });
    refs.exportButton.addEventListener("click", exportCsv);
    refs.exportSettingsButton.addEventListener("click", exportCsv);
    refs.undoButton.addEventListener("click", function () {
      if (!undoHandler) return;
      var handler = undoHandler;
      undoHandler = null;
      refs.undoButton.hidden = true;
      refs.toast.classList.remove("show");
      handler();
    });
    refs.settingsButton.addEventListener("click", openSettings);
    refs.closeSettingsButton.addEventListener("click", closeSettings);
    refs.settingsForm.addEventListener("submit", saveSettingsFromForm);
    refs.installHelpButton.addEventListener("click", function () { refs.installHelp.hidden = !refs.installHelp.hidden; });
    refs.changeMonthButton.addEventListener("click", openMonthModal);
    refs.closeMonthButton.addEventListener("click", closeMonthModal);
    refs.monthInput.addEventListener("change", function () { applyMonth(refs.monthInput.value); });
    refs.previousMonthButton.addEventListener("click", function () { applyMonth(shiftMonth(selectedMonth, -1)); });
    refs.currentMonthButton.addEventListener("click", function () { applyMonth(currentMonthKey()); });
    refs.settingsModal.addEventListener("click", function (event) { if (event.target === refs.settingsModal) closeSettings(); });
    refs.monthModal.addEventListener("click", function (event) { if (event.target === refs.monthModal) closeMonthModal(); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!refs.settingsModal.hidden) closeSettings();
      if (!refs.monthModal.hidden) closeMonthModal();
    });
    window.addEventListener("storage", function (event) {
      if (event.key === LEDGER_KEY) { refreshData(); showToast("已同步另一頁的記帳變更"); }
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshData(); });
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      refs.installButton.hidden = false;
    });
    refs.installButton.addEventListener("click", function () {
      if (!deferredInstallPrompt) { openSettings(); refs.installHelp.hidden = false; return; }
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function () { deferredInstallPrompt = null; refs.installButton.hidden = true; });
    });
    window.addEventListener("appinstalled", function () { refs.installButton.hidden = true; });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register("./sw.js").catch(function () {});
  }
  function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  window.DailySpend = {
    version: CURRENT_VERSION,
    add: function (amount, categoryKey, note, date, pay) {
      refs.amountInput.value = amount;
      selectCategory(categoryKey, true);
      refs.noteInput.value = note || "";
      refs.dateInput.value = date || todayString();
      refs.payInput.value = pay || "微信零錢";
      return saveExpense();
    },
    refresh: refreshData
  };
})();