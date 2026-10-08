(function () {
  "use strict";

  var APP_VERSION = "1.5.0";
  var STORAGE_KEY = "danceFinance.v1";
  var SALARY_KEY = "danceClassLedger.v1";
  var EXPENSE_CATEGORIES = ["餐飲", "交通", "舞蹈與訓練", "房租水電", "日常用品", "通訊網路", "醫療", "購物", "娛樂", "美團消費", "人情往來", "手續費／利息", "還款", "其他"];
  var INCOME_CATEGORIES = ["其他收入", "補貼", "退款", "報銷", "禮金", "其他"];
  var ACCOUNTS = ["微信", "支付寶", "美團月付", "花唄", "借唄", "銀行卡", "信用卡", "現金", "其他"];
  var COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#facc15", "#34d399", "#fb7185", "#a78bfa", "#38bdf8", "#fb923c", "#2dd4bf", "#c084fc", "#f87171", "#60a5fa", "#a3e635"];
  var state = loadState();
  var editingTxId = null;
  var editingSavingsAccountId = null;
  var editingSavingsGoalId = null;
  var editingIncomePlanId = null;
  var editingDebtId = null;
  var editingRecurringId = null;

  var el = {
    monthPicker: document.getElementById("month-picker"),
    prevMonth: document.getElementById("prev-month"),
    nextMonth: document.getElementById("next-month"),
    metrics: document.getElementById("metrics"),
    salaryPanel: document.getElementById("salary-panel"),
    duePanel: document.getElementById("due-panel"),
    overviewHint: document.getElementById("overview-hint"),
    txForm: document.getElementById("tx-form"),
    txId: document.getElementById("tx-id"),
    txDate: document.getElementById("tx-date"),
    txAmount: document.getElementById("tx-amount"),
    txCategory: document.getElementById("tx-category"),
    txAccount: document.getElementById("tx-account"),
    txItem: document.getElementById("tx-item"),
    txStatus: document.getElementById("tx-status"),
    txDebt: document.getElementById("tx-debt"),
    txRecurring: document.getElementById("tx-recurring"),
    txIncomePlan: document.getElementById("tx-income-plan"),
    incomePlanList: document.getElementById("income-plan-list"),
    incomePlanFormWrap: document.getElementById("income-plan-form-wrap"),
    incomePlanForm: document.getElementById("income-plan-form"),
    incomePlanFormTitle: document.getElementById("income-plan-form-title"),
    incomePlanId: document.getElementById("income-plan-id"),
    incomePlanName: document.getElementById("income-plan-name"),
    incomePlanAmount: document.getElementById("income-plan-amount"),
    incomePlanStart: document.getElementById("income-plan-start"),
    incomePlanActive: document.getElementById("income-plan-active"),
    incomePlanNote: document.getElementById("income-plan-note"),
    incomePlanReset: document.getElementById("income-plan-reset"),
    showIncomePlanForm: document.getElementById("show-income-plan-form"),
    savingsTotal: document.getElementById("savings-total"),
    savingsSummary: document.getElementById("savings-summary"),
    savingsList: document.getElementById("savings-list"),
    savingsAccountFormWrap: document.getElementById("savings-account-form-wrap"),
    savingsAccountForm: document.getElementById("savings-account-form"),
    savingsAccountFormTitle: document.getElementById("savings-account-form-title"),
    savingsAccountId: document.getElementById("savings-account-id"),
    savingsAccountName: document.getElementById("savings-account-name"),
    savingsAccountType: document.getElementById("savings-account-type"),
    savingsAccountBalance: document.getElementById("savings-account-balance"),
    savingsAccountNote: document.getElementById("savings-account-note"),
    savingsAccountReset: document.getElementById("savings-account-reset"),
    showSavingsAccountForm: document.getElementById("show-savings-account-form"),
    savingsMovementFormWrap: document.getElementById("savings-movement-form-wrap"),
    savingsMovementForm: document.getElementById("savings-movement-form"),
    savingsMovementTitle: document.getElementById("savings-movement-title"),
    savingsMovementId: document.getElementById("savings-movement-id"),
    savingsMovementAccount: document.getElementById("savings-movement-account"),
    savingsMovementAction: document.getElementById("savings-movement-action"),
    savingsMovementAmount: document.getElementById("savings-movement-amount"),
    savingsMovementDate: document.getElementById("savings-movement-date"),
    savingsMovementNote: document.getElementById("savings-movement-note"),
    savingsMovementReset: document.getElementById("savings-movement-reset"),
    savingsGoalList: document.getElementById("savings-goal-list"),
    savingsGoalFormWrap: document.getElementById("savings-goal-form-wrap"),
    savingsGoalForm: document.getElementById("savings-goal-form"),
    savingsGoalFormTitle: document.getElementById("savings-goal-form-title"),
    savingsGoalId: document.getElementById("savings-goal-id"),
    savingsGoalName: document.getElementById("savings-goal-name"),
    savingsGoalAccount: document.getElementById("savings-goal-account"),
    savingsGoalCurrent: document.getElementById("savings-goal-current"),
    savingsGoalTarget: document.getElementById("savings-goal-target"),
    savingsGoalDate: document.getElementById("savings-goal-date"),
    savingsGoalActive: document.getElementById("savings-goal-active"),
    savingsGoalNote: document.getElementById("savings-goal-note"),
    savingsGoalReset: document.getElementById("savings-goal-reset"),
    showSavingsGoalForm: document.getElementById("show-savings-goal-form"),
    savingsHistory: document.getElementById("savings-history"),
    txNote: document.getElementById("tx-note"),
    txReset: document.getElementById("tx-reset"),
    txHint: document.getElementById("tx-hint"),
    entryMode: document.getElementById("entry-mode"),
    entry: document.getElementById("entry"),
    debtTotal: document.getElementById("debt-total"),
    debtProgress: document.getElementById("debt-progress"),
    debtSummary: document.getElementById("debt-summary"),
    debtList: document.getElementById("debt-list"),
    debtFormWrap: document.getElementById("debt-form-wrap"),
    debtForm: document.getElementById("debt-form"),
    debtFormTitle: document.getElementById("debt-form-title"),
    debtId: document.getElementById("debt-id"),
    debtPlatform: document.getElementById("debt-platform"),
    debtName: document.getElementById("debt-name"),
    debtBalance: document.getElementById("debt-balance"),
    debtMonthly: document.getElementById("debt-monthly"),
    debtDueDay: document.getElementById("debt-due-day"),
    debtRepaymentType: document.getElementById("debt-repayment-type"),
    debtFirstMonth: document.getElementById("debt-first-month"),
    debtInstallmentMonths: document.getElementById("debt-installment-months"),
    debtInstallmentField: document.getElementById("debt-installment-field"),
    debtMonthlyLabel: document.getElementById("debt-monthly-label"),
    debtDueDayLabel: document.getElementById("debt-due-day-label"),
    debtPlanHint: document.getElementById("debt-plan-hint"),
    debtCustomScheduleField: document.getElementById("debt-custom-schedule-field"),
    debtScheduleList: document.getElementById("debt-schedule-list"),
    debtAddSchedule: document.getElementById("debt-add-schedule"),
    debtRate: document.getElementById("debt-rate"),
    debtNote: document.getElementById("debt-note"),
    debtReset: document.getElementById("debt-reset"),
    showDebtForm: document.getElementById("show-debt-form"),
    recurringList: document.getElementById("recurring-list"),
    recurringFormWrap: document.getElementById("recurring-form-wrap"),
    recurringForm: document.getElementById("recurring-form"),
    recurringFormTitle: document.getElementById("recurring-form-title"),
    recurringId: document.getElementById("recurring-id"),
    recurringName: document.getElementById("recurring-name"),
    recurringAmount: document.getElementById("recurring-amount"),
    recurringCategory: document.getElementById("recurring-category"),
    recurringAccount: document.getElementById("recurring-account"),
    recurringDueDay: document.getElementById("recurring-due-day"),
    recurringCycleMonths: document.getElementById("recurring-cycle-months"),
    recurringFirstMonth: document.getElementById("recurring-first-month"),
    recurringActive: document.getElementById("recurring-active"),
    recurringNote: document.getElementById("recurring-note"),
    recurringReset: document.getElementById("recurring-reset"),
    showRecurringForm: document.getElementById("show-recurring-form"),
    budgetMonthLabel: document.getElementById("budget-month-label"),
    budgetList: document.getElementById("budget-list"),
    categoryChart: document.getElementById("category-chart"),
    accountChart: document.getElementById("account-chart"),
    trendChart: document.getElementById("trend-chart"),
    filterType: document.getElementById("filter-type"),
    filterCategory: document.getElementById("filter-category"),
    filterSearch: document.getElementById("filter-search"),
    recordsTable: document.getElementById("records-table"),
    exportMonthCsv: document.getElementById("export-month-csv"),
    exportAllCsv: document.getElementById("export-all-csv"),
    exportJson: document.getElementById("export-json"),
    importJson: document.getElementById("import-json"),
    printReport: document.getElementById("print-report"),
    manualUpdate: document.getElementById("manual-update"),
    toast: document.getElementById("toast")
  };

  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }
  function esc(value) {
    return String(value === null || typeof value === "undefined" ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function numberOrZero(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
  function numberOrNull(value) {
    if (value === "" || value === null || typeof value === "undefined") return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function money(value) {
    var number = numberOrZero(value);
    return "¥" + number.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function decimal(value) {
    var rounded = Math.round(numberOrZero(value) * 100) / 100;
    return String(rounded).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }
  function pad(value) { return String(value).padStart(2, "0"); }
  function todayText() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function monthText() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }
  function monthLabel(month) {
    var parts = String(month || monthText()).split("-");
    return parts[0] + "年" + Number(parts[1]) + "月";
  }
  function shiftMonth(month, amount) {
    var parts = String(month || monthText()).split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1 + amount, 1);
    return date.getFullYear() + "-" + pad(date.getMonth() + 1);
  }
  function daysInMonth(month) {
    var parts = String(month).split("-");
    return new Date(Number(parts[0]), Number(parts[1]), 0).getDate();
  }
  function dateForMonthDay(month, day) {
    var safeDay = Math.max(1, Math.min(daysInMonth(month), Number(day) || 1));
    return month + "-" + pad(safeDay);
  }
  function addDays(dateText, amount) {
    var parts = String(dateText).split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() + amount);
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { el.toast.classList.remove("show"); }, 2400);
  }
  function defaultState() {
    return { version: 1, transactions: [], debts: [], recurring: [], incomePlans: [], savingsAccounts: [], savingsGoals: [], savingsHistory: [], budgets: {}, lastUpdated: "" };
  }
  function loadState() {
    var fallback = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      parsed.version = 1;
      parsed.transactions = Array.isArray(parsed.transactions) ? parsed.transactions.filter(function (item) { return item && item.id && item.date; }) : [];
      parsed.debts = Array.isArray(parsed.debts) ? parsed.debts.filter(function (item) { return item && item.id; }) : [];
      parsed.recurring = Array.isArray(parsed.recurring) ? parsed.recurring.filter(function (item) { return item && item.id; }) : [];
      parsed.incomePlans = Array.isArray(parsed.incomePlans) ? parsed.incomePlans.filter(function (item) { return item && item.id; }) : [];
      parsed.savingsAccounts = Array.isArray(parsed.savingsAccounts) ? parsed.savingsAccounts.filter(function (item) { return item && item.id; }) : [];
      parsed.savingsGoals = Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals.filter(function (item) { return item && item.id; }) : [];
      parsed.savingsHistory = Array.isArray(parsed.savingsHistory) ? parsed.savingsHistory.filter(function (item) { return item && item.id; }) : [];
      parsed.budgets = parsed.budgets && typeof parsed.budgets === "object" ? parsed.budgets : {};
      parsed.lastUpdated = parsed.lastUpdated || "";
      return parsed;
    } catch (error) {
      console.warn("無法讀取資金資料", error);
      return fallback;
    }
  }
  function saveState() {
    state.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      el.overviewHint.textContent = "已自動保存 · 最近更新 " + new Date(state.lastUpdated).toLocaleString("zh-CN", { hour12: false });
    } catch (error) {
      console.warn("無法儲存資金資料", error);
      showToast("瀏覽器無法儲存，請先匯出 JSON 備份");
    }
  }
  function txType() {
    var checked = document.querySelector('input[name="tx-type"]:checked');
    return checked ? checked.value : "expense";
  }
  function categoriesForType(type) {
    return type === "income" ? INCOME_CATEGORIES.slice() : EXPENSE_CATEGORIES.slice();
  }
  function findDebt(id) {
    for (var i = 0; i < state.debts.length; i++) if (state.debts[i].id === id) return state.debts[i];
    return null;
  }
  function findIncomePlan(id) {
    for (var i = 0; i < state.incomePlans.length; i++) if (state.incomePlans[i].id === id) return state.incomePlans[i];
    return null;
  }

  function findSavingsAccount(id) {
    for (var i = 0; i < state.savingsAccounts.length; i++) if (state.savingsAccounts[i].id === id) return state.savingsAccounts[i];
    return null;
  }
  function findSavingsGoal(id) {
    for (var i = 0; i < state.savingsGoals.length; i++) if (state.savingsGoals[i].id === id) return state.savingsGoals[i];
    return null;
  }
  function savingsTotal() {
    return state.savingsAccounts.reduce(function (sum, account) { return sum + Math.max(0, numberOrZero(account.balance)); }, 0);
  }
  function savingsGoalCurrent(goal) {
    var account = goal.accountId ? findSavingsAccount(goal.accountId) : null;
    return account ? numberOrZero(account.balance) : numberOrZero(goal.currentAmount);
  }
  function savingsGoalCountdown(goal) {
    var current = savingsGoalCurrent(goal);
    var target = numberOrZero(goal.targetAmount);
    var remaining = Math.max(0, target - current);
    var today = new Date(todayText() + "T12:00:00");
    var deadline = new Date(String(goal.targetDate || todayText()) + "T12:00:00");
    var days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    var months = Math.max(1, Math.ceil(Math.max(0, days) / 30));
    return { current: current, target: target, remaining: remaining, days: days, months: months, perMonth: remaining / months, perDay: days > 0 ? remaining / days : remaining };
  }

  function findRecurring(id) {
    for (var i = 0; i < state.recurring.length; i++) if (state.recurring[i].id === id) return state.recurring[i];
    return null;
  }
  function platformAccount(platform) {
    var name = String(platform || "");
    if (name.indexOf("美團") >= 0) return "美團月付";
    if (name.indexOf("花唄") >= 0) return "花唄";
    if (name.indexOf("借唄") >= 0) return "借唄";
    if (name.indexOf("信用卡") >= 0) return "信用卡";
    return "其他";
  }
  function salaryState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(SALARY_KEY) || "{}");
      return parsed && Array.isArray(parsed.records) ? parsed : { records: [], rates: {}, payDays: {} };
    } catch (error) {
      return { records: [], rates: {}, payDays: {} };
    }
  }
  function salaryForMonth(paymentMonth) {
    var ledger = salaryState();
    var sourceMonth = shiftMonth(paymentMonth, -1);
    var total = 0;
    var classes = 0;
    var missingClasses = 0;
    var map = {};
    ledger.records.forEach(function (record) {
      if (!record || String(record.date || "").slice(0, 7) !== sourceMonth) return;
      if (record.status !== "completed" && record.status !== "substitute") return;
      var institution = record.institution || "未填機構";
      var count = numberOrZero(record.count);
      var rate = numberOrNull(record.rate);
      if (rate === null && ledger.rates && ledger.rates[institution] !== undefined) rate = numberOrNull(ledger.rates[institution]);
      if (!map[institution]) map[institution] = { institution: institution, classes: 0, missingClasses: 0, total: 0 };
      map[institution].classes += count;
      classes += count;
      if (rate === null) {
        missingClasses += count;
        map[institution].missingClasses += count;
      } else {
        total += rate * count;
        map[institution].total += rate * count;
      }
    });
    var byInstitution = Object.keys(map).map(function (key) {
      var payDay = ledger.payDays && ledger.payDays[key] !== undefined ? numberOrNull(ledger.payDays[key]) : null;
      return {
        institution: key,
        classes: map[key].classes,
        missingClasses: map[key].missingClasses,
        total: map[key].total,
        payDay: payDay,
        payDate: dateForMonthDay(paymentMonth, payDay || 1)
      };
    }).sort(function (a, b) { return b.total - a.total || a.institution.localeCompare(b.institution, "zh-Hant"); });
    return {
      month: paymentMonth,
      paymentMonth: paymentMonth,
      sourceMonth: sourceMonth,
      total: total,
      classes: classes,
      missingClasses: missingClasses,
      institutionCount: byInstitution.length,
      byInstitution: byInstitution
    };
  }

  function transactionsForMonth(month) {
    return state.transactions.filter(function (item) { return String(item.date || "").slice(0, 7) === month; });
  }
  function paidExpensesForMonth(month) {
    return transactionsForMonth(month).filter(function (item) { return item.type === "expense" && item.status === "paid"; });
  }
  function paidIncomeForMonth(month) {
    return transactionsForMonth(month).filter(function (item) { return item.type === "income" && item.status === "paid"; });
  }
  function incomePlansForMonth(month) {
    return state.incomePlans.filter(function (plan) { return plan.active !== false && (!plan.startMonth || plan.startMonth <= month); });
  }
  function linkedIncomePlanAmount(planId, month) {
    return paidIncomeForMonth(month).filter(function (item) { return item.incomePlanId === planId; }).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
  }
  function incomePlanPendingTotal(month) {
    return incomePlansForMonth(month).reduce(function (sum, plan) {
      return sum + Math.max(0, numberOrZero(plan.amount) - linkedIncomePlanAmount(plan.id, month));
    }, 0);
  }

  function linkedPaidDebtAmount(debtId, month) {
    return paidExpensesForMonth(month).filter(function (item) { return item.debtId === debtId; }).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
  }
  function linkedPaidRecurringAmount(recurringId, month) {
    return paidExpensesForMonth(month).filter(function (item) { return item.recurringId === recurringId; }).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
  }
  function debtPlanType(debt) {
    var value = debt && debt.repaymentType;
    return value === "next_month" || value === "installment" || value === "custom" ? value : "monthly";
  }
  function debtPlanLabel(debt) {
    var type = debtPlanType(debt);
    if (type === "next_month") return "次月一次";
    if (type === "installment") return "分期還款";
    if (type === "custom") return "每月金額不同";
    return "每月固定";
  }
  function debtScheduleEntries(debt) {
    if (!debt || !Array.isArray(debt.schedule)) return [];
    return debt.schedule.filter(function (entry) {
      return entry && /^\d{4}-\d{2}$/.test(entry.month || "") && numberOrZero(entry.amount) > 0;
    }).map(function (entry) {
      return { month: entry.month, amount: numberOrZero(entry.amount) };
    }).sort(function (a, b) { return a.month.localeCompare(b.month); });
  }
  function debtEndMonth(debt) {
    var type = debtPlanType(debt);
    if (type === "custom") {
      var entries = debtScheduleEntries(debt);
      return entries.length ? entries[entries.length - 1].month : "";
    }
    var first = debt && debt.firstDueMonth;
    if (!first || type !== "installment") return "";
    return shiftMonth(first, Math.max(1, Number(debt.installmentMonths) || 1) - 1);
  }
  function debtScheduleIncludes(debt, month) {
    var type = debtPlanType(debt);
    if (type === "custom") {
      return debtScheduleEntries(debt).some(function (entry) { return entry.month === month; });
    }
    var first = debt && debt.firstDueMonth;
    if (!first) return type === "monthly";
    if (month < first) return false;
    if (type === "next_month") return true;
    if (type === "installment") return month <= debtEndMonth(debt);
    return true;
  }
  function debtScheduledAmount(debt, month) {
    if (debtPlanType(debt) === "custom") {
      var matches = debtScheduleEntries(debt).filter(function (entry) { return entry.month === month; });
      return matches.length ? matches[0].amount : 0;
    }
    return debtScheduleIncludes(debt, month) ? numberOrZero(debt.monthlyDue) : 0;
  }
  function debtScheduleText(debt) {
    var type = debtPlanType(debt);
    var first = debt && debt.firstDueMonth;
    if (type === "custom") {
      var entries = debtScheduleEntries(debt);
      if (!entries.length) return "每月金額不同 · 尚未設定還款計劃";
      return "每月金額不同 · " + entries.length + " 期 · " + monthLabel(entries[0].month) + "至" + monthLabel(entries[entries.length - 1].month);
    }
    if (!first) return "每月固定 · 未設定首次月份";
    if (type === "next_month") return "次月一次 · " + monthLabel(first) + " " + Number(debt.dueDay || 1) + " 日";
    if (type === "installment") return "分 " + Math.max(1, Number(debt.installmentMonths) || 1) + " 期 · " + monthLabel(first) + "至" + monthLabel(debtEndMonth(debt));
    return "每月固定 · " + monthLabel(first) + "起";
  }  function recurringCycleMonths(item) {
    return Math.min(24, Math.max(1, Number(item && item.cycleMonths) || 1));
  }
  function recurringMonthIndex(month) {
    var parts = String(month || "").split("-");
    return Number(parts[0]) * 12 + Number(parts[1]) - 1;
  }
  function recurringScheduleIncludes(item, month) {
    if (!item || !item.active) return false;
    var first = item.firstDueMonth;
    if (!first) return true;
    if (month < first) return false;
    return (recurringMonthIndex(month) - recurringMonthIndex(first)) % recurringCycleMonths(item) === 0;
  }
  function recurringScheduleText(item) {
    var cycle = recurringCycleMonths(item);
    var first = item && item.firstDueMonth;
    var cycleText = cycle === 1 ? "每月一次" : "每 " + cycle + " 個月一次";
    return first ? cycleText + " · 首次 " + monthLabel(first) : cycleText + " · 未設定首次月份";
  }

  function dueItemsForMonth(month) {
    var items = [];
    state.debts.forEach(function (debt) {
      if (numberOrZero(debt.balance) <= 0) return;
      var dueAmount = debtScheduledAmount(debt, month);
      if (dueAmount <= 0) return;
      var paid = linkedPaidDebtAmount(debt.id, month);
      var remaining = Math.max(0, dueAmount - paid);
      if (remaining > 0) {
        items.push({ id: debt.id, type: "debt", name: debt.name || debt.platform, platform: debt.platform, date: dateForMonthDay(month, debt.dueDay), amount: remaining, paid: paid, target: dueAmount });
      }
    });    state.recurring.forEach(function (item) {
      if (!item.active || numberOrZero(item.amount) <= 0) return;
      if (!recurringScheduleIncludes(item, month)) return;
      var paid = linkedPaidRecurringAmount(item.id, month);
      var remaining = Math.max(0, numberOrZero(item.amount) - paid);
      if (remaining > 0) {
        items.push({ id: item.id, type: "recurring", name: item.name, platform: item.account, date: dateForMonthDay(month, item.dueDay), amount: remaining, paid: paid, target: numberOrZero(item.amount) });
      }
    });
    return items.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  }
  function dueStatus(item) {
    if (item.paid >= item.target && item.target > 0) return { key: "good", label: "已繳清" };
    var today = todayText();
    if (item.date < today) return { key: "bad", label: "已逾期" };
    if (item.date <= addDays(today, 3)) return { key: "warn", label: "即將到期" };
    return { key: "muted", label: "待繳" };
  }
  function optionHtml(values, selected, prefix) {
    return values.map(function (value) {
      return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? " selected" : "") + ">" + esc((prefix || "") + value) + "</option>";
    }).join("");
  }
  function setSelectOptions(select, values, selected, prefix) {
    var keep = selected === undefined ? select.value : selected;
    select.innerHTML = optionHtml(values, keep, prefix);
    if (keep && values.indexOf(keep) < 0) {
      select.value = values[0] || "";
    }
  }
  function renderCategoryOptions(type, preferred) {
    setSelectOptions(el.txCategory, categoriesForType(type), preferred);
  }
  function renderOptions() {
    renderCategoryOptions(txType());
    setSelectOptions(el.txAccount, ACCOUNTS, el.txAccount.value || "微信");
    el.txDebt.innerHTML = '<option value="">不連動</option>' + state.debts.map(function (debt) {
      return '<option value="' + esc(debt.id) + '">' + esc(debt.name || debt.platform) + " · " + esc(debtPlanLabel(debt)) + (debtPlanType(debt) === "custom" ? " " + debtScheduleEntries(debt).length + " 期" : " " + money(debt.monthlyDue)) + "</option>";
    }).join("");
    el.txRecurring.innerHTML = '<option value="">不連動</option>' + state.recurring.map(function (item) {
      return '<option value="' + esc(item.id) + '">' + esc(item.name) + " · " + esc(recurringScheduleText(item)) + " " + money(item.amount) + "</option>";
    }).join("");
    el.txIncomePlan.innerHTML = '<option value="">不連動</option>' + state.incomePlans.map(function (plan) {
      return '<option value="' + esc(plan.id) + '">' + esc(plan.name) + " · " + money(plan.amount) + "/月</option>";
    }).join("");
    setSelectOptions(el.recurringCategory, EXPENSE_CATEGORIES, el.recurringCategory.value || "房租水電");
    setSelectOptions(el.recurringAccount, ACCOUNTS, el.recurringAccount.value || "銀行卡");
    var filterValues = ["全部分類"].concat(EXPENSE_CATEGORIES, INCOME_CATEGORIES);
    var currentFilter = el.filterCategory.value || "全部分類";
    el.filterCategory.innerHTML = filterValues.map(function (value) {
      var actual = value === "全部分類" ? "" : value;
      return '<option value="' + esc(actual) + '"' + (currentFilter === actual ? " selected" : "") + ">" + esc(value) + "</option>";
    }).join("");
  }
  function resetTxForm() {
    editingTxId = null;
    el.txForm.reset();
    if (el.entry) el.entry.open = false;
    el.txId.value = "";
    el.txDate.value = todayText();
    document.querySelector('input[name="tx-type"][value="expense"]').checked = true;
    renderCategoryOptions("expense", "餐飲");
    el.txAccount.value = "微信";
    el.txStatus.value = "paid";
    el.txDebt.value = "";
    el.txRecurring.value = "";
    el.txIncomePlan.value = "";
    el.entryMode.textContent = "新增模式";
    el.entryMode.className = "pill muted";
    el.txHint.textContent = "";
  }
  function fillTxForm(tx) {
    editingTxId = tx.id;
    if (el.entry) el.entry.open = true;
    el.txId.value = tx.id;
    var radio = document.querySelector('input[name="tx-type"][value="' + tx.type + '"]');
    if (radio) radio.checked = true;
    renderCategoryOptions(tx.type, tx.category);
    el.txDate.value = tx.date;
    el.txAmount.value = tx.amount;
    el.txCategory.value = tx.category;
    el.txAccount.value = tx.account;
    el.txItem.value = tx.item || "";
    el.txStatus.value = tx.status || "paid";
    el.txDebt.value = tx.debtId || "";
    el.txRecurring.value = tx.recurringId || "";
    el.txIncomePlan.value = tx.incomePlanId || "";
    el.txNote.value = tx.note || "";
    el.entryMode.textContent = "編輯模式";
    el.entryMode.className = "pill warn";
    el.txHint.textContent = "正在修改既有記錄；儲存後會更新統計。";
    if (el.entry) el.entry.open = true;
    el.entry.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function adjustDebtBalance(debtId, delta) {
    if (!debtId) return;
    var debt = findDebt(debtId);
    if (!debt) return;
    debt.balance = numberOrZero(debt.balance) + numberOrZero(delta);
    debt.updatedAt = new Date().toISOString();
  }
  function saveTransaction(event) {
    event.preventDefault();
    var type = txType();
    var amount = numberOrNull(el.txAmount.value);
    if (amount === null || amount <= 0) return showToast("請輸入大於 0 的金額");
    if (!el.txDate.value) return showToast("請選擇日期");
    var tx = {
      id: editingTxId || uid("tx"),
      date: el.txDate.value,
      type: type,
      category: el.txCategory.value,
      account: el.txAccount.value,
      item: el.txItem.value.trim() || el.txCategory.value,
      amount: amount,
      status: type === "income" ? "paid" : el.txStatus.value,
      debtId: type === "expense" ? (el.txDebt.value || "") : "",
      recurringId: type === "expense" ? (el.txRecurring.value || "") : "",
      incomePlanId: type === "income" ? (el.txIncomePlan.value || "") : "",
      note: el.txNote.value.trim(),
      createdAt: editingTxId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (tx.incomePlanId) {
      tx.category = "其他收入";
      tx.status = "paid";
    }
    if (tx.debtId) {
      tx.category = "還款";
      tx.status = "paid";
    }
    var index = -1;
    for (var i = 0; i < state.transactions.length; i++) if (state.transactions[i].id === editingTxId) index = i;
    if (index >= 0) {
      var old = state.transactions[index];
      if (old.status === "paid" && old.type === "expense" && old.debtId) adjustDebtBalance(old.debtId, numberOrZero(old.amount));
      tx.createdAt = old.createdAt || new Date().toISOString();
      state.transactions[index] = tx;
    } else {
      state.transactions.push(tx);
    }
    if (tx.status === "paid" && tx.type === "expense" && tx.debtId) adjustDebtBalance(tx.debtId, -numberOrZero(tx.amount));
    saveState();
    renderAll();
    resetTxForm();
    showToast(index >= 0 ? "記錄已更新" : "記錄已儲存");
  }

  function renderMetrics(month) {
    var salary = salaryForMonth(month);
    var otherIncome = paidIncomeForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
    var incomeCount = paidIncomeForMonth(month).length;
    var pendingIncome = incomePlanPendingTotal(month);
    var totalIncome = salary.total + otherIncome;
    var expenses = paidExpensesForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
    var dueRemaining = dueItemsForMonth(month).reduce(function (sum, item) { return sum + item.amount; }, 0);
    var available = totalIncome - expenses - dueRemaining;
    var expectedAvailable = available + pendingIncome;
    el.metrics.innerHTML =
      '<div class="metric"><span>本月入賬</span><strong class="amount-income">' + money(totalIncome) + '</strong><small>舞蹈薪資 ' + money(salary.total) + ' · 其他收入 ' + money(otherIncome) + '（' + incomeCount + ' 筆）</small></div>' +
      '<div class="metric"><span>待入賬收入</span><strong>' + money(pendingIncome) + '</strong><small>' + (pendingIncome ? '計劃收入尚未確認到賬' : '目前沒有待入賬收入') + '</small></div>' +
      '<div class="metric"><span>已支付支出</span><strong class="amount-expense">' + money(expenses) + '</strong><small>不含待支付與未完成項目</small></div>' +
      '<div class="metric"><span>本月尚待繳</span><strong class="amount-income">' + money(dueRemaining) + '</strong><small>欠款還款＋週期性支出</small></div>' +
      '<div class="metric"><span>可用結餘</span><strong style="color:' + (available >= 0 ? "var(--green)" : "var(--red)") + '">' + money(available) + '</strong><small>' + (pendingIncome ? '待入賬全部到賬後：' + money(expectedAvailable) : '本月入賬－支出－待繳') + '</small></div>';
  }
  function renderSalary(month) {
    var salary = salaryForMonth(month);
    var connected = salary.classes > 0 || salary.total > 0 || salary.missingClasses > 0;
    var detail = connected ? '<span class="pill good">次月入帳已連動</span>' : '<span class="pill muted">本月無薪資紀錄</span>';
    var breakdown = salary.byInstitution.slice(0, 4).map(function (item) {
      return '<span class="badge">' + esc(item.institution) + " " + money(item.total) + (item.missingClasses ? " · " + decimal(item.missingClasses) + "堂未設薪資" : "") + '</span>';
    }).join("");
    if (salary.byInstitution.length > 4) breakdown += '<span class="badge">另有 ' + (salary.byInstitution.length - 4) + ' 個機構</span>';
    var missing = salary.missingClasses
      ? '<p class="helper" style="color:var(--yellow)">有 ' + decimal(salary.missingClasses) + ' 堂已完成／代課尚未設定機構薪資，請回上課紀錄補上每節薪資。</p>'
      : '<p class="helper">薪資依課堂日期自動延後一個月入帳；例如 9 月課堂會列入 10 月收入。</p>';
    el.salaryPanel.innerHTML = '<div class="inline-actions" style="justify-content:space-between;align-items:center;gap:12px"><div><strong>舞蹈薪資連動</strong><div class="helper">' + monthLabel(month) + ' 入帳 · 課堂來源 ' + monthLabel(salary.sourceMonth) + ' · ' + money(salary.total) + '／' + decimal(salary.classes) + ' 堂</div><div style="margin-top:7px">' + (breakdown || '<span class="helper">本月沒有次月入帳薪資。</span>') + '</div></div><div class="inline-actions">' + detail + '<button id="sync-salary" class="btn small" type="button">重新同步</button></div></div>' + missing;
  }
  function renderDue(month) {
    var items = dueItemsForMonth(month);
    var salary = salaryForMonth(month);
    var expense = paidExpensesForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
    var available = salary.total + paidIncomeForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0) - expense - items.reduce(function (sum, item) { return sum + item.amount; }, 0);
    var rows = items.map(function (item) {
      var status = dueStatus(item);
      return '<div class="due-row"><div class="due-main"><strong>' + esc(item.name) + '</strong><span>' + esc(item.platform || "") + " · " + monthLabel(month) + " " + Number(item.date.slice(-2)) + " 日 · 已繳 " + money(item.paid) + "</span></div><div class=\"due-value\"><span class=\"pill " + status.key + "\">" + status.label + "</span><div style=\"margin-top:5px;color:" + (item.amount ? "var(--yellow)" : "var(--green)") + ";font-weight:800\">" + money(item.amount) + "</div></div></div>";
    }).join("");
    if (!rows) rows = '<div class="empty">這個月目前沒有待繳項目；已繳清或尚未設定還款／週期性支出。</div>';
    el.duePanel.innerHTML = '<div class="inline-actions" style="justify-content:space-between;align-items:center"><div><strong>本月待繳清單</strong><div class="helper">依付款日排序，金額已扣除本月已登記的還款或週期性支出。</div></div><div style="text-align:right"><strong class="' + (items.length ? "amount-income" : "") + '">' + money(items.reduce(function (sum, item) { return sum + item.amount; }, 0)) + '</strong><div class="helper">待繳總額</div></div></div><div class="status-timeline section">' + rows + '</div><p class="helper">目前預估可用結餘：<strong style="color:' + (available >= 0 ? "var(--green)" : "var(--red)") + '">' + money(available) + '</strong>。此數字會隨你記錄支出或收入即時更新。</p>';
  }

  function renderDebts(month) {
    var total = state.debts.reduce(function (sum, debt) { return sum + Math.max(0, numberOrZero(debt.balance)); }, 0);
    var scheduledMonthly = state.debts.reduce(function (sum, debt) { return sum + debtScheduledAmount(debt, month); }, 0);
    var paid = state.debts.reduce(function (sum, debt) { return sum + linkedPaidDebtAmount(debt.id, month); }, 0);
    el.debtTotal.textContent = money(total);
    var rate = scheduledMonthly > 0 ? Math.min(100, paid / scheduledMonthly * 100) : (state.debts.length ? 100 : 0);
    el.debtProgress.className = "progress" + (rate >= 100 ? "" : rate > 70 ? " warn" : "");
    el.debtProgress.innerHTML = '<i style="width:' + Math.min(100, rate).toFixed(1) + '%"></i>';
    el.debtSummary.textContent = state.debts.length ? monthLabel(month) + "排定應還 " + money(scheduledMonthly) + "；本月已登記 " + money(paid) + "。" : "尚未設定欠款帳戶。";
    if (!state.debts.length) {
      el.debtList.innerHTML = '<div class="empty">還沒有欠款帳戶。點右上角「新增帳戶」開始記錄美團月付、花唄、借唄或借款。</div>';
      return;
    }
    el.debtList.innerHTML = state.debts.slice().sort(function (a, b) { return numberOrZero(b.balance) - numberOrZero(a.balance); }).map(function (debt) {
      var paidThisMonth = linkedPaidDebtAmount(debt.id, month);
      var due = debtScheduledAmount(debt, month);
      var remaining = Math.max(0, due - paidThisMonth);
      var scheduled = due > 0;
      var entries = debtPlanType(debt) === "custom" ? debtScheduleEntries(debt) : [];
      var future = debtPlanType(debt) === "custom" ? entries.length > 0 && month < entries[0].month : debt.firstDueMonth && month < debt.firstDueMonth;
      var status = numberOrZero(debt.balance) <= 0
        ? '<span class="pill good">已還清</span>'
        : !scheduled
          ? '<span class="pill muted">' + (future ? "未到還款期" : debtPlanType(debt) === "custom" ? "本月無需還款" : "超出分期期數") + '</span>'
          : remaining <= 0
            ? '<span class="pill good">本月已繳</span>'
            : '<span class="pill warn">待還 ' + money(remaining) + '</span>';
      var amountLabel = debtPlanType(debt) === "custom" ? "本期應還" : debtPlanType(debt) === "next_month" ? "本期應還" : debtPlanType(debt) === "installment" ? "每期應還" : "每月應還";
      var amountText = debtPlanType(debt) === "custom" ? (scheduled ? amountLabel + " " + money(due) : "本月依計劃不需還款") : amountLabel + " " + money(debt.monthlyDue);
      return '<article class="debt-card"><div class="debt-top"><div><h3>' + esc(debt.name || debt.platform) + '</h3><div class="helper">' + esc(debt.platform || "其他") + " · " + esc(debtPlanLabel(debt)) + '</div></div>' + status + '</div><div class="debt-balance">' + money(debt.balance) + '</div><div class="debt-meta">目前欠款' + (numberOrZero(debt.balance) < 0 ? "（多付）" : "") + '<br>' + esc(debtScheduleText(debt)) + '<br>' + amountText + (debt.annualRate !== undefined && debt.annualRate !== "" && debt.annualRate !== null ? " · 年利率 " + decimal(debt.annualRate) + "%" : "") + (debt.note ? "<br>" + esc(debt.note) : "") + '</div><div class="progress ' + (remaining <= 0 || !scheduled ? "" : "warn") + '"><i style="width:' + (scheduled && due > 0 ? Math.min(100, paidThisMonth / due * 100) : 0) + '%"></i></div><div class="debt-actions"><button class="btn small primary" data-pay-debt="' + esc(debt.id) + '" type="button">' + (scheduled ? "登記還款" : "提前還款") + '</button><button class="btn small" data-edit-debt="' + esc(debt.id) + '" type="button">編輯</button><button class="btn small danger" data-delete-debt="' + esc(debt.id) + '" type="button">刪除</button></div></article>';
    }).join("");
  }
  function debtScheduleRowHtml(month, amount) {
    return '<div class="schedule-row"><input class="form-control" type="month" data-schedule-month value="' + esc(month || "") + '" aria-label="還款月份"><input class="form-control" type="number" min="0.01" step="0.01" inputmode="decimal" data-schedule-amount value="' + (amount === undefined || amount === null ? "" : esc(amount)) + '" placeholder="應還金額" aria-label="應還金額"><button class="btn small danger" type="button" data-remove-schedule>刪除</button></div>';
  }
  function renderDebtScheduleRows(entries) {
    var rows = Array.isArray(entries) && entries.length ? entries : [{ month: el.debtFirstMonth.value || monthText(), amount: el.debtMonthly.value || "" }];
    el.debtScheduleList.innerHTML = rows.map(function (entry) { return debtScheduleRowHtml(entry.month, entry.amount); }).join("");
  }
  function readDebtScheduleRows() {
    return Array.prototype.map.call(el.debtScheduleList.querySelectorAll(".schedule-row"), function (row) {
      return {
        month: row.querySelector("[data-schedule-month]").value,
        amount: numberOrNull(row.querySelector("[data-schedule-amount]").value)
      };
    }).filter(function (entry) { return entry.month || entry.amount !== null; });
  }
  function addDebtScheduleRow() {
    var rows = readDebtScheduleRows();
    var last = rows.length ? rows[rows.length - 1] : null;
    var month = last && /^\d{4}-\d{2}$/.test(last.month || "") ? shiftMonth(last.month, 1) : (el.debtFirstMonth.value || monthText());
    var amount = last && last.amount !== null ? last.amount : (el.debtMonthly.value || "");
    el.debtScheduleList.insertAdjacentHTML("beforeend", debtScheduleRowHtml(month, amount));
  }
  function updateDebtPlanFields() {
    var type = el.debtRepaymentType.value;
    var firstField = el.debtFirstMonth.parentElement;
    var monthlyField = el.debtMonthly.parentElement;
    if (type === "custom") {
      el.debtInstallmentField.classList.add("hidden");
      el.debtCustomScheduleField.classList.remove("hidden");
      firstField.classList.add("hidden");
      monthlyField.classList.add("hidden");
      el.debtFirstMonth.required = false;
      el.debtMonthly.required = false;
      el.debtInstallmentMonths.value = "1";
      el.debtDueDayLabel.textContent = "每月還款日";
      el.debtPlanHint.textContent = "請逐月填寫應還金額；沒有列出的月份不會列入待繳。";
      if (!el.debtScheduleList.children.length) renderDebtScheduleRows([{ month: shiftMonth(monthText(), 1), amount: "" }]);
    } else {
      el.debtCustomScheduleField.classList.add("hidden");
      firstField.classList.remove("hidden");
      monthlyField.classList.remove("hidden");
      el.debtFirstMonth.required = true;
      el.debtMonthly.required = true;
      if (type === "next_month") {
        el.debtInstallmentField.classList.add("hidden");
        el.debtInstallmentMonths.value = "1";
        el.debtMonthlyLabel.textContent = "次月應還（¥）";
        el.debtDueDayLabel.textContent = "還款日";
        el.debtPlanHint.textContent = "次月一次會從首次還款月份開始列入待繳；若未繳清，之後仍會提醒剩餘金額。";
      } else if (type === "installment") {
        el.debtInstallmentField.classList.remove("hidden");
        if (!el.debtInstallmentMonths.value || Number(el.debtInstallmentMonths.value) < 1) el.debtInstallmentMonths.value = "1";
        el.debtMonthlyLabel.textContent = "每期應還（¥）";
        el.debtDueDayLabel.textContent = "每期扣款日";
        el.debtPlanHint.textContent = "分期會從首次還款月份起，在指定期數內按月列入待繳。";
      } else {
        el.debtInstallmentField.classList.add("hidden");
        el.debtMonthlyLabel.textContent = "每月應還（¥）";
        el.debtDueDayLabel.textContent = "每月還款日";
        el.debtPlanHint.textContent = "每月固定會從首次還款月份開始，持續到欠款還清。";
      }
    }
  }
  function resetDebtForm() {
    editingDebtId = null;
    el.debtForm.reset();
    el.debtId.value = "";
    el.debtPlatform.value = "美團月付";
    el.debtBalance.value = "";
    el.debtMonthly.value = "";
    el.debtDueDay.value = "10";
    el.debtRate.value = "";
    el.debtRepaymentType.value = "monthly";
    el.debtFirstMonth.value = shiftMonth(monthText(), 1);
    el.debtInstallmentMonths.value = "1";
    el.debtScheduleList.innerHTML = "";
    updateDebtPlanFields();
    el.debtFormTitle.textContent = "新增欠款帳戶";
    el.debtFormWrap.open = false;
  }

  function fillDebtForm(debt) {
    editingDebtId = debt.id;
    el.debtId.value = debt.id;
    el.debtPlatform.value = debt.platform || "其他";
    el.debtName.value = debt.name || "";
    el.debtBalance.value = debt.balance;
    el.debtMonthly.value = debt.monthlyDue;
    el.debtDueDay.value = debt.dueDay || 10;
    el.debtRepaymentType.value = debtPlanType(debt);
    el.debtFirstMonth.value = debt.firstDueMonth || monthText();
    el.debtInstallmentMonths.value = Math.max(1, Number(debt.installmentMonths) || 1);
    el.debtRate.value = debt.annualRate === undefined ? "" : debt.annualRate;
    el.debtNote.value = debt.note || "";
    el.debtScheduleList.innerHTML = "";
    if (debtPlanType(debt) === "custom") renderDebtScheduleRows(debtScheduleEntries(debt));
    updateDebtPlanFields();
    el.debtFormTitle.textContent = "編輯欠款帳戶";
    el.debtFormWrap.open = true;
    el.debtFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveDebt(event) {
    event.preventDefault();
    var type = el.debtRepaymentType.value;
    var balance = numberOrNull(el.debtBalance.value);
    var monthly = numberOrNull(el.debtMonthly.value);
    var day = Number(el.debtDueDay.value);
    var firstMonth = el.debtFirstMonth.value;
    var installmentMonths = type === "installment" ? Number(el.debtInstallmentMonths.value) : 1;
    var schedule = [];
    if (balance === null || balance < 0) return showToast("請輸入有效的目前欠款");
    if (!(day >= 1 && day <= 31)) return showToast("還款日需為 1 至 31");
    if (type === "custom") {
      schedule = readDebtScheduleRows().map(function (entry) { return { month: entry.month, amount: entry.amount === null ? 0 : entry.amount }; }).filter(function (entry) { return entry.month || entry.amount > 0; });
      if (!schedule.length) return showToast("請至少新增一期還款計劃");
      var seen = {};
      for (var s = 0; s < schedule.length; s++) {
        if (!/^\d{4}-\d{2}$/.test(schedule[s].month || "") || schedule[s].amount <= 0) return showToast("請完整填寫每一期的月份與金額");
        if (seen[schedule[s].month]) return showToast(monthLabel(schedule[s].month) + " 有重複的還款計劃");
        seen[schedule[s].month] = true;
      }
      schedule.sort(function (a, b) { return a.month.localeCompare(b.month); });
      monthly = schedule[0].amount;
      firstMonth = schedule[0].month;
      installmentMonths = schedule.length;
    } else {
      if (monthly === null || monthly < 0) return showToast("請輸入有效的應還金額");
      if (type !== "monthly" && monthly <= 0) return showToast("次月一次與分期還款必須填寫應還金額");
      if (!/^\d{4}-\d{2}$/.test(firstMonth)) return showToast("請選擇首次還款月份");
      if (!(installmentMonths >= 1 && installmentMonths <= 120)) return showToast("分期期數需為 1 至 120");
    }
    var debt = {
      id: editingDebtId || uid("debt"),
      platform: el.debtPlatform.value,
      name: el.debtName.value.trim() || el.debtPlatform.value,
      balance: balance,
      monthlyDue: monthly,
      dueDay: day,
      repaymentType: type,
      firstDueMonth: firstMonth,
      installmentMonths: installmentMonths,
      schedule: type === "custom" ? schedule : [],
      annualRate: el.debtRate.value === "" ? "" : numberOrZero(el.debtRate.value),
      note: el.debtNote.value.trim(),
      updatedAt: new Date().toISOString()
    };
    var index = -1;
    for (var i = 0; i < state.debts.length; i++) if (state.debts[i].id === editingDebtId) index = i;
    if (index >= 0) state.debts[index] = debt; else state.debts.push(debt);
    saveState();
    renderOptions();
    renderAll();
    resetDebtForm();
    showToast(index >= 0 ? "欠款帳戶已更新" : "欠款帳戶已新增");
  }

  function registerDebtPayment(id) {
    var debt = findDebt(id);
    if (!debt) return;
    var month = el.monthPicker.value || monthText();
    var paid = linkedPaidDebtAmount(id, month);
    var dueAmount = debtScheduledAmount(debt, month);
    var remaining = Math.max(0, dueAmount - paid);
    resetTxForm();
    el.txDate.value = debtScheduleIncludes(debt, month) ? dateForMonthDay(month, debt.dueDay) : todayText();
    document.querySelector('input[name="tx-type"][value="expense"]').checked = true;
    renderCategoryOptions("expense", "還款");
    el.txAmount.value = remaining > 0 ? remaining : (dueAmount || numberOrZero(debt.monthlyDue));
    el.txCategory.value = "還款";
    el.txAccount.value = platformAccount(debt.platform);
    el.txItem.value = (debt.name || debt.platform) + " 還款";
    el.txDebt.value = debt.id;
    el.txStatus.value = "paid";
    el.txNote.value = debtPlanLabel(debt) + " · " + monthLabel(month);
    el.txHint.textContent = "已帶入還款資料，儲存後會同步扣除欠款餘額。";
    if (el.entry) el.entry.open = true;
    el.entry.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function deleteDebt(id) {
    var debt = findDebt(id);
    if (!debt || !window.confirm("確定刪除「" + (debt.name || debt.platform) + "」嗎？既有交易會保留，但不再連動此帳戶。")) return;
    state.transactions.forEach(function (item) { if (item.debtId === id) item.debtId = ""; });
    state.debts = state.debts.filter(function (item) { return item.id !== id; });
    saveState();
    renderOptions();
    renderAll();
    resetDebtForm();
    showToast("欠款帳戶已刪除");
  }

  function renderIncomePlans(month) {
    if (!state.incomePlans.length) {
      el.incomePlanList.innerHTML = '<div class="empty">尚未設定每月收入計劃。日期不固定也可以，先設定每月預計金額與開始月份。</div>';
      return;
    }
    el.incomePlanList.innerHTML = state.incomePlans.slice().sort(function (a, b) { return String(a.startMonth || "").localeCompare(String(b.startMonth || "")); }).map(function (plan) {
      var activeForMonth = plan.active !== false && (!plan.startMonth || plan.startMonth <= month);
      var received = linkedIncomePlanAmount(plan.id, month);
      var remaining = Math.max(0, numberOrZero(plan.amount) - received);
      var status = !plan.active
        ? '<span class="pill muted">停用</span>'
        : !activeForMonth
          ? '<span class="pill muted">未到開始月份</span>'
          : remaining <= 0
            ? '<span class="pill good">本月已入帳</span>'
            : '<span class="pill warn">待入帳 ' + money(remaining) + '</span>';
      return '<article class="debt-card"><div class="debt-top"><div><h3>' + esc(plan.name) + '</h3><div class="helper">' + monthLabel(plan.startMonth || monthText()) + '起 · 日期不固定</div></div>' + status + '</div><div class="debt-balance">' + money(plan.amount) + '</div><div class="debt-meta">每月預計收入<br>本月已登記 ' + money(received) + (plan.note ? "<br>" + esc(plan.note) : "") + '</div><div class="debt-actions">' + (plan.active !== false ? '<button class="btn small primary" data-receive-income="' + esc(plan.id) + '" type="button">確認到賬</button>' : "") + '<button class="btn small" data-edit-income-plan="' + esc(plan.id) + '" type="button">編輯</button><button class="btn small danger" data-delete-income-plan="' + esc(plan.id) + '" type="button">刪除</button></div></article>';
    }).join("");
  }

  function resetIncomePlanForm() {
    editingIncomePlanId = null;
    el.incomePlanForm.reset();
    el.incomePlanId.value = "";
    el.incomePlanStart.value = el.monthPicker.value || monthText();
    el.incomePlanActive.value = "true";
    el.incomePlanFormTitle.textContent = "新增每月收入";
    el.incomePlanFormWrap.open = false;
  }

  function fillIncomePlanForm(plan) {
    editingIncomePlanId = plan.id;
    el.incomePlanId.value = plan.id;
    el.incomePlanName.value = plan.name || "";
    el.incomePlanAmount.value = plan.amount;
    el.incomePlanStart.value = plan.startMonth || monthText();
    el.incomePlanActive.value = plan.active === false ? "false" : "true";
    el.incomePlanNote.value = plan.note || "";
    el.incomePlanFormTitle.textContent = "編輯每月收入";
    el.incomePlanFormWrap.open = true;
    el.incomePlanFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveIncomePlan(event) {
    event.preventDefault();
    var amount = numberOrNull(el.incomePlanAmount.value);
    var startMonth = el.incomePlanStart.value;
    if (!el.incomePlanName.value.trim()) return showToast("請輸入收入名稱");
    if (amount === null || amount <= 0) return showToast("請輸入大於 0 的每月預計收入");
    if (!/^\d{4}-\d{2}$/.test(startMonth)) return showToast("請選擇開始月份");
    var plan = {
      id: editingIncomePlanId || uid("income"),
      name: el.incomePlanName.value.trim(),
      amount: amount,
      startMonth: startMonth,
      active: el.incomePlanActive.value === "true",
      note: el.incomePlanNote.value.trim(),
      updatedAt: new Date().toISOString()
    };
    var index = -1;
    for (var i = 0; i < state.incomePlans.length; i++) if (state.incomePlans[i].id === editingIncomePlanId) index = i;
    if (index >= 0) state.incomePlans[index] = plan; else state.incomePlans.push(plan);
    saveState();
    renderOptions();
    renderAll();
    resetIncomePlanForm();
    showToast(index >= 0 ? "收入計劃已更新" : "收入計劃已新增");
  }

  function registerIncomePlan(id) {
    var plan = findIncomePlan(id);
    if (!plan) return;
    var month = el.monthPicker.value || monthText();
    var received = linkedIncomePlanAmount(id, month);
    var amount = Math.max(0, numberOrZero(plan.amount) - received);
    if (amount <= 0) return showToast("這筆收入本月已經確認入賬");
    var date = month === monthText() ? todayText() : dateForMonthDay(month, 1);
    state.transactions.push({ id: uid("tx"), date: date, type: "income", category: "其他收入", account: "銀行卡", item: plan.name + "（" + monthLabel(month) + "）", amount: amount, status: "paid", debtId: "", recurringId: "", incomePlanId: plan.id, note: "每月收入計劃 · 已確認到賬", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    saveState(); renderAll(); showToast("已確認到賬，自動轉入本月入賬");
  }
  function deleteIncomePlan(id) {
    var plan = findIncomePlan(id);
    if (!plan || !window.confirm("確定刪除「" + plan.name + "」嗎？既有收入記錄會保留，但不再連動此計劃。")) return;
    state.transactions.forEach(function (tx) { if (tx.incomePlanId === id) tx.incomePlanId = ""; });
    state.incomePlans = state.incomePlans.filter(function (item) { return item.id !== id; });
    saveState();
    renderOptions();
    renderAll();
    resetIncomePlanForm();
    showToast("收入計劃已刪除");
  }
  function renderSavings() {
    var total = savingsTotal();
    el.savingsTotal.textContent = money(total);
    el.savingsSummary.textContent = state.savingsAccounts.length ? state.savingsAccounts.length + " 個存款帳戶 · 合計 " + money(total) : "尚未設定存款帳戶。";
    var movementValue = el.savingsMovementAccount.value;
    el.savingsMovementAccount.innerHTML = state.savingsAccounts.length ? state.savingsAccounts.map(function (account) {
      return '<option value="' + esc(account.id) + '">' + esc(account.name) + " · " + money(account.balance) + "</option>";
    }).join("") : '<option value="">請先新增存款帳戶</option>';
    if (movementValue && el.savingsMovementAccount.querySelector('option[value="' + movementValue + '"]')) el.savingsMovementAccount.value = movementValue;
    var goalValue = el.savingsGoalAccount.value;
    el.savingsGoalAccount.innerHTML = '<option value="">不連動，手動填目前金額</option>' + state.savingsAccounts.map(function (account) {
      return '<option value="' + esc(account.id) + '">' + esc(account.name) + " · " + money(account.balance) + "</option>";
    }).join("");
    if (goalValue && el.savingsGoalAccount.querySelector('option[value="' + goalValue + '"]')) el.savingsGoalAccount.value = goalValue;
    if (!state.savingsAccounts.length) {
      el.savingsList.innerHTML = '<div class="empty">尚未設定存款帳戶。可記錄銀行卡、支付寶、微信、現金或定期存款。</div>';
    } else {
      el.savingsList.innerHTML = state.savingsAccounts.slice().sort(function (a, b) { return numberOrZero(b.balance) - numberOrZero(a.balance); }).map(function (account) {
        return '<article class="debt-card"><div class="debt-top"><div><h3>' + esc(account.name) + '</h3><div class="helper">' + esc(account.type || "其他") + '</div></div><span class="pill good">存款</span></div><div class="debt-balance">' + money(account.balance) + '</div><div class="debt-meta">最近更新 ' + esc(account.updatedAt ? account.updatedAt.slice(0, 10) : todayText()) + (account.note ? "<br>" + esc(account.note) : "") + '</div><div class="debt-actions"><button class="btn small primary" data-savings-deposit="' + esc(account.id) + '" type="button">存入</button><button class="btn small" data-savings-withdraw="' + esc(account.id) + '" type="button">取出</button><button class="btn small" data-edit-savings-account="' + esc(account.id) + '" type="button">編輯</button><button class="btn small danger" data-delete-savings-account="' + esc(account.id) + '" type="button">刪除</button></div></article>';
      }).join("");
    }
    renderSavingsGoals();
    renderSavingsHistory();
  }
  function renderSavingsGoals() {
    if (!state.savingsGoals.length) {
      el.savingsGoalList.innerHTML = '<div class="empty">尚未設定存款目標。設定目標金額與日期後，會顯示倒數、完成進度和每月需存金額。</div>';
      return;
    }
    el.savingsGoalList.innerHTML = state.savingsGoals.slice().sort(function (a, b) { return String(a.targetDate || "").localeCompare(String(b.targetDate || "")); }).map(function (goal) {
      var calc = savingsGoalCountdown(goal);
      var percent = calc.target > 0 ? calc.current / calc.target * 100 : 0;
      var status = goal.active === false ? '<span class="pill muted">停用</span>' : calc.remaining <= 0 ? '<span class="pill good">已達成</span>' : calc.days < 0 ? '<span class="pill bad">已到期</span>' : calc.days <= 30 ? '<span class="pill warn">剩 ' + calc.days + ' 天</span>' : '<span class="pill good">剩 ' + calc.days + ' 天</span>';
      var countdown = goal.active === false ? "目標已停用" : calc.remaining <= 0 ? "已經達成目標" : calc.days < 0 ? "已超過目標日期 " + Math.abs(calc.days) + " 天" : "距目標日期 " + calc.days + " 天 · 約 " + calc.months + " 個月";
      var linked = goal.accountId && findSavingsAccount(goal.accountId);
      var accountName = linked ? linked.name : "手動金額";
      return '<article class="debt-card"><div class="debt-top"><div><h3>' + esc(goal.name) + '</h3><div class="helper">' + esc(accountName) + " · 目標 " + esc(goal.targetDate || "未設定") + '</div></div>' + status + '</div><div class="debt-balance">' + money(calc.current) + ' <span style="font-size:.85rem;color:var(--muted)">/ ' + money(calc.target) + '</span></div><div class="debt-meta">' + esc(countdown) + '<br>還差 ' + money(calc.remaining) + (calc.remaining > 0 ? "<br>每月約需存 " + money(calc.perMonth) + " · 每日約 " + money(calc.perDay) : "") + (goal.note ? "<br>" + esc(goal.note) : "") + '</div><div class="progress ' + (percent >= 100 ? "" : percent >= 70 ? "warn" : "") + '"><i style="width:' + Math.min(100, Math.max(0, percent)) + '%"></i></div><div class="debt-actions"><button class="btn small" data-edit-savings-goal="' + esc(goal.id) + '" type="button">編輯</button><button class="btn small danger" data-delete-savings-goal="' + esc(goal.id) + '" type="button">刪除</button></div></article>';
    }).join("");
  }
  function renderSavingsHistory() {
    var rows = state.savingsHistory.slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")); }).slice(0, 12);
    if (!rows.length) {
      el.savingsHistory.innerHTML = '<div class="empty">尚無存款變動記錄。</div>';
      return;
    }
    el.savingsHistory.innerHTML = rows.map(function (item) {
      var account = findSavingsAccount(item.accountId);
      var label = item.action === "deposit" ? "存入" : item.action === "withdraw" ? "取出" : "校正餘額";
      var sign = item.action === "withdraw" ? "-" : item.action === "deposit" ? "+" : "";
      return '<div class="due-row"><div class="due-main"><strong>' + esc(account ? account.name : "已刪除帳戶") + " · " + label + '</strong><span>' + esc(item.date || "") + (item.note ? " · " + esc(item.note) : "") + '</span></div><div class="due-value ' + (item.action === "withdraw" ? "amount-expense" : "amount-income") + '">' + sign + money(item.amount) + '</div></div>';
    }).join("");
  }
  function resetSavingsAccountForm() {
    editingSavingsAccountId = null;
    el.savingsAccountForm.reset();
    el.savingsAccountId.value = "";
    el.savingsAccountType.value = "銀行卡";
    el.savingsAccountFormTitle.textContent = "新增存款帳戶";
    el.savingsAccountFormWrap.open = false;
  }
  function fillSavingsAccountForm(account) {
    editingSavingsAccountId = account.id;
    el.savingsAccountId.value = account.id;
    el.savingsAccountName.value = account.name || "";
    el.savingsAccountType.value = account.type || "其他";
    el.savingsAccountBalance.value = account.balance;
    el.savingsAccountNote.value = account.note || "";
    el.savingsAccountFormTitle.textContent = "編輯存款帳戶";
    el.savingsAccountFormWrap.open = true;
    el.savingsAccountFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function addSavingsHistory(accountId, action, amount, date, note) {
    state.savingsHistory.push({ id: uid("saving"), accountId: accountId, action: action, amount: amount, date: date || todayText(), note: note || "", createdAt: new Date().toISOString() });
  }
  function saveSavingsAccount(event) {
    event.preventDefault();
    var balance = numberOrNull(el.savingsAccountBalance.value);
    if (!el.savingsAccountName.value.trim()) return showToast("請輸入存款帳戶名稱");
    if (balance === null || balance < 0) return showToast("請輸入有效的目前餘額");
    var account = { id: editingSavingsAccountId || uid("savings"), name: el.savingsAccountName.value.trim(), type: el.savingsAccountType.value, balance: balance, note: el.savingsAccountNote.value.trim(), updatedAt: new Date().toISOString() };
    var index = -1;
    for (var i = 0; i < state.savingsAccounts.length; i++) if (state.savingsAccounts[i].id === editingSavingsAccountId) index = i;
    if (index >= 0) {
      var old = state.savingsAccounts[index];
      if (numberOrZero(old.balance) !== balance) addSavingsHistory(account.id, "adjust", balance, todayText(), "編輯帳戶餘額");
      state.savingsAccounts[index] = account;
    } else {
      state.savingsAccounts.push(account);
      addSavingsHistory(account.id, "deposit", balance, todayText(), "建立帳戶初始餘額");
    }
    saveState(); renderAll(); resetSavingsAccountForm(); showToast(index >= 0 ? "存款帳戶已更新" : "存款帳戶已新增");
  }
  function deleteSavingsAccount(id) {
    var account = findSavingsAccount(id);
    if (!account || !window.confirm("確定刪除「" + account.name + "」嗎？此帳戶的存款變動記錄也會刪除。")) return;
    state.savingsAccounts = state.savingsAccounts.filter(function (item) { return item.id !== id; });
    state.savingsHistory = state.savingsHistory.filter(function (item) { return item.accountId !== id; });
    state.savingsGoals.forEach(function (goal) { if (goal.accountId === id) { goal.accountId = ""; goal.currentAmount = account.balance; } });
    saveState(); renderAll(); resetSavingsAccountForm(); showToast("存款帳戶已刪除");
  }
  function resetSavingsMovementForm() {
    el.savingsMovementForm.reset();
    el.savingsMovementId.value = "";
    el.savingsMovementDate.value = todayText();
    el.savingsMovementAction.value = "deposit";
    el.savingsMovementTitle.textContent = "存款變動記錄";
    el.savingsMovementFormWrap.open = false;
  }
  function registerSavingsMovement(accountId, action) {
    var account = findSavingsAccount(accountId);
    if (!account) return;
    resetSavingsMovementForm();
    el.savingsMovementAccount.value = account.id;
    el.savingsMovementAction.value = action || "deposit";
    el.savingsMovementAmount.value = action === "adjust" ? account.balance : "";
    el.savingsMovementTitle.textContent = account.name + " · " + (action === "withdraw" ? "取出" : action === "adjust" ? "校正餘額" : "存入");
    el.savingsMovementFormWrap.open = true;
    el.savingsMovementFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function saveSavingsMovement(event) {
    event.preventDefault();
    var account = findSavingsAccount(el.savingsMovementAccount.value);
    var amount = numberOrNull(el.savingsMovementAmount.value);
    var action = el.savingsMovementAction.value;
    if (!account) return showToast("請先選擇存款帳戶");
    if (amount === null || amount < 0) return showToast("請輸入有效金額");
    if (action === "withdraw" && amount > numberOrZero(account.balance)) return showToast("取出金額不能超過目前存款");
    var oldBalance = numberOrZero(account.balance);
    var newBalance = action === "deposit" ? oldBalance + amount : action === "withdraw" ? oldBalance - amount : amount;
    account.balance = newBalance;
    account.updatedAt = new Date().toISOString();
    addSavingsHistory(account.id, action, action === "adjust" ? newBalance : amount, el.savingsMovementDate.value, el.savingsMovementNote.value.trim());
    saveState(); renderAll(); resetSavingsMovementForm(); showToast("存款變動已儲存");
  }
  function resetSavingsGoalForm() {
    editingSavingsGoalId = null;
    el.savingsGoalForm.reset();
    el.savingsGoalId.value = "";
    el.savingsGoalAccount.value = "";
    el.savingsGoalCurrent.value = "0";
    el.savingsGoalCurrent.disabled = false;
    el.savingsGoalTarget.value = "";
    el.savingsGoalDate.value = addDays(todayText(), 180);
    el.savingsGoalActive.value = "true";
    el.savingsGoalFormTitle.textContent = "新增存款目標";
    el.savingsGoalFormWrap.open = false;
  }
  function fillSavingsGoalForm(goal) {
    editingSavingsGoalId = goal.id;
    el.savingsGoalId.value = goal.id;
    el.savingsGoalName.value = goal.name || "";
    el.savingsGoalAccount.value = goal.accountId || "";
    el.savingsGoalCurrent.value = goal.currentAmount || 0;
    el.savingsGoalTarget.value = goal.targetAmount;
    el.savingsGoalDate.value = goal.targetDate || addDays(todayText(), 180);
    el.savingsGoalActive.value = goal.active === false ? "false" : "true";
    el.savingsGoalNote.value = goal.note || "";
    el.savingsGoalCurrent.disabled = !!goal.accountId;
    el.savingsGoalFormTitle.textContent = "編輯存款目標";
    el.savingsGoalFormWrap.open = true;
    el.savingsGoalFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function saveSavingsGoal(event) {
    event.preventDefault();
    var target = numberOrNull(el.savingsGoalTarget.value);
    var current = numberOrNull(el.savingsGoalCurrent.value);
    var accountId = el.savingsGoalAccount.value;
    if (!el.savingsGoalName.value.trim()) return showToast("請輸入目標名稱");
    if (target === null || target <= 0) return showToast("請輸入大於 0 的目標金額");
    if (!accountId && (current === null || current < 0)) return showToast("請輸入有效的目前金額");
    if (!el.savingsGoalDate.value) return showToast("請選擇目標日期");
    var goal = { id: editingSavingsGoalId || uid("goal"), name: el.savingsGoalName.value.trim(), accountId: accountId, currentAmount: accountId ? 0 : current, targetAmount: target, targetDate: el.savingsGoalDate.value, active: el.savingsGoalActive.value === "true", note: el.savingsGoalNote.value.trim(), updatedAt: new Date().toISOString() };
    var index = -1;
    for (var i = 0; i < state.savingsGoals.length; i++) if (state.savingsGoals[i].id === editingSavingsGoalId) index = i;
    if (index >= 0) state.savingsGoals[index] = goal; else state.savingsGoals.push(goal);
    saveState(); renderAll(); resetSavingsGoalForm(); showToast(index >= 0 ? "存款目標已更新" : "存款目標已新增");
  }
  function deleteSavingsGoal(id) {
    var goal = findSavingsGoal(id);
    if (!goal || !window.confirm("確定刪除「" + goal.name + "」嗎？")) return;
    state.savingsGoals = state.savingsGoals.filter(function (item) { return item.id !== id; });
    saveState(); renderAll(); resetSavingsGoalForm(); showToast("存款目標已刪除");
  }
  function renderRecurring(month) {
    if (!state.recurring.length) {
      el.recurringList.innerHTML = '<div class="empty">尚未設定週期性支出。例如每 3 個月一付的房租、水電、網費或保險。</div>';
      return;
    }
    el.recurringList.innerHTML = state.recurring.slice().sort(function (a, b) { return Number(a.dueDay || 99) - Number(b.dueDay || 99); }).map(function (item) {
      var paid = linkedPaidRecurringAmount(item.id, month);
      var remaining = Math.max(0, numberOrZero(item.amount) - paid);
      var scheduled = recurringScheduleIncludes(item, month);
      var future = item.firstDueMonth && month < item.firstDueMonth;
      var status = !item.active
        ? '<span class="pill muted">停用</span>'
        : !scheduled
          ? paid > 0
            ? '<span class="pill good">已提前登記</span>'
            : '<span class="pill muted">' + (future ? "未到繳款期" : "本週期不需繳") + '</span>'
          : remaining <= 0
            ? '<span class="pill good">本期已繳</span>'
            : paid > 0
              ? '<span class="pill warn">部分已繳 ' + money(paid) + '</span>'
              : '<span class="pill warn">待繳 ' + money(remaining) + '</span>';
      return '<article class="debt-card"><div class="debt-top"><div><h3>' + esc(item.name) + '</h3><div class="helper">' + esc(item.category) + " · " + esc(item.account) + '</div></div>' + status + '</div><div class="debt-balance">' + money(item.amount) + '</div><div class="debt-meta">' + esc(recurringScheduleText(item)) + '<br>繳費日：每月 ' + Number(item.dueDay) + ' 日<br>本月已登記 ' + money(paid) + (item.note ? "<br>" + esc(item.note) : "") + '</div><div class="debt-actions">' + (item.active ? '<button class="btn small primary" data-pay-recurring="' + esc(item.id) + '" type="button">' + (scheduled ? "登記本期支出" : "提前登記") + '</button>' : "") + '<button class="btn small" data-edit-recurring="' + esc(item.id) + '" type="button">編輯</button><button class="btn small danger" data-delete-recurring="' + esc(item.id) + '" type="button">刪除</button></div></article>';
    }).join("");
  }

  function resetRecurringForm() {
    editingRecurringId = null;
    el.recurringForm.reset();
    el.recurringId.value = "";
    el.recurringCycleMonths.value = "1";
    el.recurringFirstMonth.value = el.monthPicker.value || monthText();
    el.recurringDueDay.value = "1";
    el.recurringActive.value = "true";
    setSelectOptions(el.recurringCategory, EXPENSE_CATEGORIES, "房租水電");
    setSelectOptions(el.recurringAccount, ACCOUNTS, "銀行卡");
    el.recurringFormTitle.textContent = "新增週期性支出";
    el.recurringFormWrap.open = false;
  }

  function fillRecurringForm(item) {
    editingRecurringId = item.id;
    el.recurringId.value = item.id;
    el.recurringName.value = item.name || "";
    el.recurringAmount.value = item.amount;
    el.recurringCycleMonths.value = recurringCycleMonths(item);
    el.recurringFirstMonth.value = item.firstDueMonth || monthText();
    setSelectOptions(el.recurringCategory, EXPENSE_CATEGORIES, item.category || "其他");
    setSelectOptions(el.recurringAccount, ACCOUNTS, item.account || "銀行卡");
    el.recurringDueDay.value = item.dueDay || 1;
    el.recurringActive.value = item.active ? "true" : "false";
    el.recurringNote.value = item.note || "";
    el.recurringFormTitle.textContent = "編輯週期性支出";
    el.recurringFormWrap.open = true;
    el.recurringFormWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveRecurring(event) {
    event.preventDefault();
    var amount = numberOrNull(el.recurringAmount.value);
    var day = Number(el.recurringDueDay.value);
    var cycleMonths = Number(el.recurringCycleMonths.value);
    var firstMonth = el.recurringFirstMonth.value;
    if (!el.recurringName.value.trim()) return showToast("請輸入項目名稱");
    if (amount === null || amount <= 0) return showToast("請輸入大於 0 的每次繳款金額");
    if (!(day >= 1 && day <= 31)) return showToast("繳費日需為 1 至 31");
    if (!(cycleMonths >= 1 && cycleMonths <= 24)) return showToast("繳費週期需為 1 至 24 個月");
    if (!/^\d{4}-\d{2}$/.test(firstMonth)) return showToast("請選擇首次繳費月份");
    var item = {
      id: editingRecurringId || uid("recurring"),
      name: el.recurringName.value.trim(),
      amount: amount,
      category: el.recurringCategory.value,
      account: el.recurringAccount.value,
      dueDay: day,
      cycleMonths: cycleMonths,
      firstDueMonth: firstMonth,
      active: el.recurringActive.value === "true",
      note: el.recurringNote.value.trim(),
      updatedAt: new Date().toISOString()
    };
    var index = -1;
    for (var i = 0; i < state.recurring.length; i++) if (state.recurring[i].id === editingRecurringId) index = i;
    if (index >= 0) state.recurring[index] = item; else state.recurring.push(item);
    saveState();
    renderOptions();
    renderAll();
    resetRecurringForm();
    showToast(index >= 0 ? "週期性支出已更新" : "週期性支出已新增");
  }

  function registerRecurringPayment(id) {
    var item = findRecurring(id);
    if (!item) return;
    var month = el.monthPicker.value || monthText();
    var paid = linkedPaidRecurringAmount(id, month);
    var remaining = Math.max(0, numberOrZero(item.amount) - paid);
    resetTxForm();
    el.txDate.value = recurringScheduleIncludes(item, month) ? dateForMonthDay(month, item.dueDay) : todayText();
    document.querySelector('input[name="tx-type"][value="expense"]').checked = true;
    renderCategoryOptions("expense", item.category || "其他");
    el.txAmount.value = remaining > 0 ? remaining : numberOrZero(item.amount);
    el.txCategory.value = item.category || "其他";
    el.txAccount.value = item.account || "銀行卡";
    el.txItem.value = item.name + "（" + monthLabel(month) + "）";
    el.txRecurring.value = item.id;
    el.txStatus.value = "paid";
    el.txNote.value = recurringScheduleText(item);
    el.txHint.textContent = "已帶入週期性支出資料，儲存後會列入本月已支付支出。";
    if (el.entry) el.entry.open = true;
    el.entry.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteRecurring(id) {
    var item = findRecurring(id);
    if (!item || !window.confirm("確定刪除「" + item.name + "」嗎？既有交易會保留，但不再連動此項目。")) return;
    state.transactions.forEach(function (tx) { if (tx.recurringId === id) tx.recurringId = ""; });
    state.recurring = state.recurring.filter(function (entry) { return entry.id !== id; });
    saveState();
    renderOptions();
    renderAll();
    resetRecurringForm();
    showToast("週期性支出已刪除");
  }
  function budgetSpent(month, category) {
    return paidExpensesForMonth(month).filter(function (item) { return item.category === category; }).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
  }
  function renderBudget(month) {
    el.budgetMonthLabel.textContent = monthLabel(month);
    var usedCategories = {};
    paidExpensesForMonth(month).forEach(function (item) { usedCategories[item.category || "其他"] = true; });
    var categories = EXPENSE_CATEGORIES.filter(function (category) { return numberOrZero(state.budgets[category]) > 0 || usedCategories[category]; });
    if (!categories.length) categories = ["餐飲", "交通", "舞蹈與訓練", "房租水電", "還款", "其他"];
    el.budgetList.innerHTML = categories.map(function (category) {
      var spent = budgetSpent(month, category);
      var budget = numberOrZero(state.budgets[category]);
      var percent = budget > 0 ? spent / budget * 100 : 0;
      return '<div class="budget-row"><div class="budget-label">' + esc(category) + '</div><div class="budget-value">' + money(spent) + " / " + money(budget) + '</div><div class="progress ' + (percent > 100 ? "bad" : percent > 80 ? "warn" : "") + '"><i style="width:' + Math.min(100, percent) + '%"></i></div><input data-budget="' + esc(category) + '" type="number" min="0" step="0.01" value="' + (budget || "") + '" placeholder="設定預算" aria-label="' + esc(category) + ' 預算"></div>';
    }).join("");
    renderExpenseChart(month);
  }
  function renderExpenseChart(month) {
    var expenses = paidExpensesForMonth(month);
    var categoryMap = {};
    expenses.forEach(function (item) { var key = item.category || "其他"; categoryMap[key] = (categoryMap[key] || 0) + numberOrZero(item.amount); });
    var rows = Object.keys(categoryMap).map(function (key) { return { label: key, value: categoryMap[key] }; }).sort(function (a, b) { return b.value - a.value; });
    var total = rows.reduce(function (sum, row) { return sum + row.value; }, 0);
    if (!rows.length) {
      el.categoryChart.innerHTML = '<div class="empty">本月尚無已支付支出。</div>';
    } else {
      el.categoryChart.innerHTML = rows.map(function (row, index) {
        var percent = total > 0 ? row.value / total * 100 : 0;
        return '<div class="chart-row"><div class="budget-label">' + esc(row.label) + '</div><div class="chart-bar"><i style="width:' + percent + '%;background:' + COLORS[index % COLORS.length] + '"></i></div><div class="budget-value">' + money(row.value) + '</div></div>';
      }).join("");
    }
    var accountMap = {};
    expenses.forEach(function (item) { var key = item.account || "其他"; accountMap[key] = (accountMap[key] || 0) + numberOrZero(item.amount); });
    var accountRows = Object.keys(accountMap).map(function (key) { return { label: key, value: accountMap[key] }; }).sort(function (a, b) { return b.value - a.value; });
    if (!accountRows.length) {
      el.accountChart.innerHTML = '<div class="empty">尚無付款方式統計。</div>';
    } else {
      el.accountChart.innerHTML = accountRows.map(function (row, index) {
        var percent = total > 0 ? row.value / total * 100 : 0;
        return '<div class="chart-row"><div class="budget-label">' + esc(row.label) + '</div><div class="chart-bar"><i style="width:' + percent + '%;background:' + COLORS[(index + 5) % COLORS.length] + '"></i></div><div class="budget-value">' + money(row.value) + '</div></div>';
      }).join("");
    }
    renderTrendChart(month);
  }
  function renderTrendChart(month) {
    var months = [];
    for (var offset = 5; offset >= 0; offset--) months.push(shiftMonth(month, -offset));
    var values = months.map(function (item) {
      return { month: item, value: paidExpensesForMonth(item).reduce(function (sum, tx) { return sum + numberOrZero(tx.amount); }, 0) };
    });
    var max = Math.max.apply(null, values.map(function (item) { return item.value; }).concat([1]));
    el.trendChart.innerHTML = values.map(function (item, index) {
      var percent = item.value / max * 100;
      return '<div class="chart-row"><div class="budget-label">' + Number(item.month.slice(5)) + ' 月</div><div class="chart-bar"><i style="width:' + percent + '%;background:' + COLORS[index % COLORS.length] + '"></i></div><div class="budget-value">' + money(item.value) + '</div></div>';
    }).join("");
  }

  function filteredTransactions(month) {
    var type = el.filterType.value;
    var category = el.filterCategory.value;
    var q = el.filterSearch.value.trim().toLowerCase();
    return transactionsForMonth(month).filter(function (item) {
      if (type && item.type !== type) return false;
      if (category && item.category !== category) return false;
      var haystack = [item.item, item.note, item.account, item.category].join(" ").toLowerCase();
      return !q || haystack.indexOf(q) >= 0;
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); });
  }
  function renderRecords(month) {
    var records = filteredTransactions(month);
    if (!records.length) {
      el.recordsTable.innerHTML = '<div class="empty">目前沒有符合條件的資金記錄。</div>';
      return;
    }
    var rows = records.map(function (item) {
      var isIncome = item.type === "income";
      var linked = item.debtId ? '<span class="badge">還款連動</span>' : item.recurringId ? '<span class="badge">週期支出</span>' : item.incomePlanId ? '<span class="badge">月度收入</span>' : "";
      return '<tr><td>' + esc(item.date) + '</td><td><span class="badge">' + (isIncome ? "收入" : "支出") + '</span></td><td>' + esc(item.category || "其他") + linked + '</td><td><strong>' + esc(item.item || "未命名") + '</strong><div class="note">' + esc(item.note || "") + '</div></td><td>' + esc(item.account || "") + '</td><td class="num ' + (isIncome ? "amount-income" : "amount-expense") + '">' + (isIncome ? "+" : "-") + money(item.amount) + '</td><td><span class="pill ' + (item.status === "paid" ? "good" : "warn") + '">' + (item.status === "paid" ? "已支付／入帳" : "待支付") + '</span></td><td><button class="btn small" data-edit-tx="' + esc(item.id) + '" type="button">編輯</button> <button class="btn small danger" data-delete-tx="' + esc(item.id) + '" type="button">刪除</button></td></tr>';
    }).join("");
    el.recordsTable.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>日期</th><th>類型</th><th>分類</th><th>項目／備註</th><th>方式／平台</th><th class="num">金額</th><th>狀態</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="helper">目前顯示 ' + records.length + ' 筆；月份由上方「查看月份」控制。</p>';
  }
  function csvCell(value) {
    return '"' + String(value === null || typeof value === "undefined" ? "" : value).replace(/"/g, '""') + '"';
  }
  function safeFilename(text) {
    return String(text || "匯出").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
  }
  function downloadText(filename, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }
  function csvForMonth(month) {
    var records = transactionsForMonth(month).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    var salary = salaryForMonth(month);
    var rows = [["日期", "類型", "分類", "項目／商家", "方式／平台", "金額", "狀態", "連動", "備註"]];
    salary.byInstitution.forEach(function (item) {
      if (item.total <= 0 && item.missingClasses <= 0) return;
      rows.push([item.payDate, "收入（自動）", "舞蹈薪資", item.institution + " " + decimal(item.classes) + " 堂", "上課紀錄", item.total.toFixed(2), item.missingClasses ? "部分未設薪資" : "已計算", item.missingClasses ? decimal(item.missingClasses) + " 堂未設薪資" : "次月入帳", "課堂來源：" + monthLabel(salary.sourceMonth)]);
    });    records.forEach(function (item) {
      rows.push([item.date, item.type === "income" ? "收入" : "支出", item.category || "", item.item || "", item.account || "", numberOrZero(item.amount).toFixed(2), item.status === "paid" ? "已支付／入帳" : "待支付", item.debtId ? "欠款帳戶" : item.recurringId ? "週期支出" : item.incomePlanId ? "月度收入" : "", item.note || ""]);
    });
    var expenses = paidExpensesForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
    var otherIncome = paidIncomeForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0);
    var due = dueItemsForMonth(month).reduce(function (sum, item) { return sum + item.amount; }, 0);
    rows.push([]);
    rows.push(["本月入帳舞蹈薪資", salary.total.toFixed(2), "", "", "", "", "", "", ""]);
    rows.push(["本月其他收入", otherIncome.toFixed(2), "", "", "", "", "", "", ""]);
    rows.push(["本月合計入賬", (salary.total + otherIncome).toFixed(2), "", "", "", "", "", "", ""]);
    rows.push(["本月已支付支出", expenses.toFixed(2), "", "", "", "", "", "", ""]);
    rows.push(["本月尚待繳", due.toFixed(2), "", "", "", "", "", "", ""]);
    rows.push(["本月可用結餘", (salary.total + otherIncome - expenses - due).toFixed(2), "", "", "", "", "", "", ""]);
    return "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
  }
  function allRelevantMonths() {
    var months = {};
    state.transactions.forEach(function (item) { if (item.date) months[String(item.date).slice(0, 7)] = true; });
    salaryState().records.forEach(function (record) { if (record.date) months[shiftMonth(String(record.date).slice(0, 7), 1)] = true; });
    if (!Object.keys(months).length) months[monthText()] = true;
    return Object.keys(months).sort();
  }
  function csvForAll() {
    var months = allRelevantMonths();
    var rows = [["月份", "日期", "類型", "分類", "項目／商家", "方式／平台", "金額", "狀態", "連動", "備註"]];
    months.forEach(function (month) {
      var salary = salaryForMonth(month);
      salary.byInstitution.forEach(function (item) {
        if (item.total <= 0 && item.missingClasses <= 0) return;
        rows.push([month, item.payDate, "收入（自動）", "舞蹈薪資", item.institution + " " + decimal(item.classes) + " 堂", "上課紀錄", item.total.toFixed(2), item.missingClasses ? "部分未設薪資" : "已計算", item.missingClasses ? decimal(item.missingClasses) + " 堂未設薪資" : "次月入帳", "課堂來源：" + monthLabel(salary.sourceMonth)]);
      });      transactionsForMonth(month).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).forEach(function (item) {
        rows.push([month, item.date, item.type === "income" ? "收入" : "支出", item.category || "", item.item || "", item.account || "", numberOrZero(item.amount).toFixed(2), item.status === "paid" ? "已支付／入帳" : "待支付", item.debtId ? "欠款帳戶" : item.recurringId ? "週期支出" : item.incomePlanId ? "月度收入" : "", item.note || ""]);
      });
      rows.push([month, "", "月度合計", "薪資", "", "", salary.total.toFixed(2), "", "", ""]);
      rows.push([month, "", "月度合計", "合計入賬", "", "", (salary.total + paidIncomeForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0)).toFixed(2), "", "", ""]);
      rows.push([month, "", "月度合計", "已支付支出", "", "", paidExpensesForMonth(month).reduce(function (sum, item) { return sum + numberOrZero(item.amount); }, 0).toFixed(2), "", "", ""]);
      rows.push([month, "", "月度合計", "待繳", "", "", dueItemsForMonth(month).reduce(function (sum, item) { return sum + item.amount; }, 0).toFixed(2), "", "", ""]);
    });
    return "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
  }
  function exportMonthCsv() {
    var month = el.monthPicker.value || monthText();
    downloadText("資金明細_" + safeFilename(month) + ".csv", csvForMonth(month), "text/csv;charset=utf-8");
    showToast("本月 CSV 已匯出");
  }
  function exportAllCsv() {
    downloadText("資金明細_全部_" + todayText() + ".csv", csvForAll(), "text/csv;charset=utf-8");
    showToast("全部 CSV 已匯出");
  }
  function exportJson() {
    var payload = {
      app: "資金管理",
      version: APP_VERSION,
      schema: STORAGE_KEY,
      exportedAt: new Date().toISOString(),
      latestSalarySnapshot: salaryForMonth(el.monthPicker.value || monthText()),
      data: state
    };
    downloadText("資金管理備份_" + todayText() + ".json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    showToast("JSON 備份已匯出");
  }
  function normalizeImported(data) {
    var source = data && data.data ? data.data : data;
    if (!source || !Array.isArray(source.transactions)) throw new Error("找不到 transactions");
    var debts = Array.isArray(source.debts) ? source.debts : [];
    var recurring = Array.isArray(source.recurring) ? source.recurring : [];
    var debtIds = {};
    var recurringIds = {};
    var incomePlanIds = {};
    var incomePlans = Array.isArray(source.incomePlans) ? source.incomePlans : [];
    var savingsAccounts = Array.isArray(source.savingsAccounts) ? source.savingsAccounts : [];
    var savingsGoals = Array.isArray(source.savingsGoals) ? source.savingsGoals : [];
    var savingsHistory = Array.isArray(source.savingsHistory) ? source.savingsHistory : [];
    debts.forEach(function (debt) { debtIds[debt.id] = true; });
    recurring.forEach(function (item) { recurringIds[item.id] = true; });
    incomePlans.forEach(function (item) { incomePlanIds[item.id] = true; });
    var savingsAccountIds = {};
    savingsAccounts.forEach(function (item) { savingsAccountIds[item.id] = true; });
    return {
      version: 1,
      transactions: source.transactions.filter(function (item) { return item && item.date; }).map(function (item) {
        return {
          id: item.id || uid("tx"), date: String(item.date).slice(0, 10), type: item.type === "income" ? "income" : "expense",
          category: item.category || "其他", account: item.account || "其他", item: item.item || "未命名",
          amount: Math.max(0, numberOrZero(item.amount)), status: item.status === "pending" ? "pending" : "paid",
          debtId: debtIds[item.debtId] ? item.debtId : "", recurringId: recurringIds[item.recurringId] ? item.recurringId : "", incomePlanId: incomePlanIds[item.incomePlanId] ? item.incomePlanId : "",
          note: item.note || "", createdAt: item.createdAt || new Date().toISOString(), updatedAt: item.updatedAt || new Date().toISOString()
        };
      }),
      debts: debts.filter(function (item) { return item && item.id; }).map(function (item) {
        var schedule = Array.isArray(item.schedule) ? item.schedule.filter(function (entry) {
          return entry && /^\d{4}-\d{2}$/.test(entry.month || "") && numberOrZero(entry.amount) > 0;
        }).map(function (entry) { return { month: entry.month, amount: numberOrZero(entry.amount) }; }).sort(function (a, b) { return a.month.localeCompare(b.month); }) : [];
        var type = item.repaymentType === "next_month" || item.repaymentType === "installment" || item.repaymentType === "custom" ? item.repaymentType : (schedule.length ? "custom" : "monthly");
        var firstMonth = type === "custom" && schedule.length ? schedule[0].month : (/^\d{4}-\d{2}$/.test(item.firstDueMonth || "") ? item.firstDueMonth : "");
        return {
          id: item.id,
          platform: item.platform || "其他",
          name: item.name || item.platform || "未命名",
          balance: numberOrZero(item.balance),
          monthlyDue: type === "custom" && schedule.length ? schedule[0].amount : numberOrZero(item.monthlyDue),
          dueDay: Math.min(31, Math.max(1, Number(item.dueDay) || 10)),
          repaymentType: type,
          firstDueMonth: firstMonth,
          installmentMonths: type === "custom" && schedule.length ? schedule.length : Math.min(120, Math.max(1, Number(item.installmentMonths) || 1)),
          schedule: type === "custom" ? schedule : [],
          annualRate: item.annualRate === "" || item.annualRate === undefined ? "" : numberOrZero(item.annualRate),
          note: item.note || "",
          updatedAt: item.updatedAt || new Date().toISOString()
        };
      }),      recurring: recurring.filter(function (item) { return item && item.id; }).map(function (item) {
        return { id: item.id, name: item.name || "未命名", amount: numberOrZero(item.amount), category: item.category || "其他", account: item.account || "其他", dueDay: Math.min(31, Math.max(1, Number(item.dueDay) || 1)), cycleMonths: Math.min(24, Math.max(1, Number(item.cycleMonths) || 1)), firstDueMonth: /^\d{4}-\d{2}$/.test(item.firstDueMonth || "") ? item.firstDueMonth : "", active: item.active !== false, note: item.note || "", updatedAt: item.updatedAt || new Date().toISOString() };
      }),
      incomePlans: incomePlans.filter(function (item) { return item && item.id; }).map(function (item) {
        return { id: item.id, name: item.name || "未命名", amount: numberOrZero(item.amount), startMonth: /^\d{4}-\d{2}$/.test(item.startMonth || "") ? item.startMonth : monthText(), active: item.active !== false, note: item.note || "", updatedAt: item.updatedAt || new Date().toISOString() };
      }),      savingsAccounts: savingsAccounts.filter(function (item) { return item && item.id; }).map(function (item) {
        return { id: item.id, name: item.name || "未命名", type: item.type || "其他", balance: numberOrZero(item.balance), note: item.note || "", updatedAt: item.updatedAt || new Date().toISOString() };
      }),
      savingsGoals: savingsGoals.filter(function (item) { return item && item.id; }).map(function (item) {
        return { id: item.id, name: item.name || "未命名", accountId: savingsAccountIds[item.accountId] ? item.accountId : "", currentAmount: numberOrZero(item.currentAmount), targetAmount: numberOrZero(item.targetAmount), targetDate: /^\d{4}-\d{2}-\d{2}$/.test(item.targetDate || "") ? item.targetDate : addDays(todayText(), 180), active: item.active !== false, note: item.note || "", updatedAt: item.updatedAt || new Date().toISOString() };
      }),
      savingsHistory: savingsHistory.filter(function (item) { return item && item.id && item.accountId; }).map(function (item) {
        return { id: item.id, accountId: savingsAccountIds[item.accountId] ? item.accountId : "", action: item.action === "withdraw" || item.action === "adjust" ? item.action : "deposit", amount: numberOrZero(item.amount), date: item.date || todayText(), note: item.note || "", createdAt: item.createdAt || new Date().toISOString() };
      }),      budgets: source.budgets && typeof source.budgets === "object" ? source.budgets : {},
      lastUpdated: source.lastUpdated || new Date().toISOString()
    };
  }
  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var next = normalizeImported(parsed);
        if (!window.confirm("匯入會取代目前所有資金資料，是否繼續？請確認已先匯出目前備份。")) return;
        state = next;
        saveState();
        renderOptions();
        renderAll();
        resetTxForm();
        resetDebtForm();
        resetRecurringForm();
        showToast("JSON 備份已匯入");
      } catch (error) {
        console.warn(error);
        alert("無法匯入：JSON 格式不正確或缺少 transactions。\n" + error.message);
      }
    };
    reader.readAsText(file);
  }
  function renderAll() {
    var month = el.monthPicker.value || monthText();
    renderMetrics(month);
    renderSalary(month);
    renderDue(month);
    renderDebts(month);
    renderIncomePlans(month);
    renderSavings();
    renderRecurring(month);
    renderBudget(month);
    renderRecords(month);
  }

  el.txForm.addEventListener("submit", saveTransaction);
  el.debtForm.addEventListener("submit", saveDebt);
  el.savingsAccountForm.addEventListener("submit", saveSavingsAccount);
  el.savingsMovementForm.addEventListener("submit", saveSavingsMovement);
  el.savingsGoalForm.addEventListener("submit", saveSavingsGoal);
  el.debtRepaymentType.addEventListener("change", updateDebtPlanFields);
  el.savingsAccountReset.addEventListener("click", resetSavingsAccountForm);
  el.savingsMovementReset.addEventListener("click", resetSavingsMovementForm);
  el.savingsGoalReset.addEventListener("click", resetSavingsGoalForm);
  el.showSavingsAccountForm.addEventListener("click", function () { resetSavingsAccountForm(); el.savingsAccountFormWrap.open = true; });
  el.showSavingsGoalForm.addEventListener("click", function () { resetSavingsGoalForm(); el.savingsGoalFormWrap.open = true; });
  el.savingsGoalAccount.addEventListener("change", function () { var linked = !!el.savingsGoalAccount.value; el.savingsGoalCurrent.disabled = linked; if (linked) el.savingsGoalCurrent.value = "0"; });
  el.debtAddSchedule.addEventListener("click", addDebtScheduleRow);
  el.debtScheduleList.addEventListener("click", function (event) {
    var remove = event.target.closest("[data-remove-schedule]");
    if (!remove) return;
    remove.closest(".schedule-row").remove();
    if (!el.debtScheduleList.children.length) addDebtScheduleRow();
  });
  el.incomePlanForm.addEventListener("submit", saveIncomePlan);
  el.recurringForm.addEventListener("submit", saveRecurring);
  document.querySelectorAll('input[name="tx-type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      renderCategoryOptions(txType(), txType() === "income" ? "其他收入" : "餐飲");
      if (txType() === "income") {
        el.txDebt.value = "";
        el.txRecurring.value = "";
    el.txIncomePlan.value = "";
      }
    });
  });
  el.txDebt.addEventListener("change", function () {
    if (!el.txDebt.value) return;
    var debt = findDebt(el.txDebt.value);
    if (!debt) return;
    renderCategoryOptions("expense", "還款");
    el.txCategory.value = "還款";
    el.txStatus.value = "paid";
    if (!el.txItem.value || /還款$/.test(el.txItem.value)) el.txItem.value = (debt.name || debt.platform) + " 月還款";
    var month = el.monthPicker.value || monthText();
    var remaining = Math.max(0, numberOrZero(debt.monthlyDue) - linkedPaidDebtAmount(debt.id, month));
    if (!el.txAmount.value) el.txAmount.value = remaining || numberOrZero(debt.monthlyDue);
    el.txHint.textContent = "此筆記錄會連動欠款餘額；儲存後剩餘金額會自動扣除。";
  });
  el.txIncomePlan.addEventListener("change", function () {
    var plan = findIncomePlan(el.txIncomePlan.value);
    if (!plan) return;
    document.querySelector('input[name="tx-type"][value="income"]').checked = true;
    renderCategoryOptions("income", "其他收入");
    var month = el.monthPicker.value || monthText();
    var remaining = Math.max(0, numberOrZero(plan.amount) - linkedIncomePlanAmount(plan.id, month));
    el.txCategory.value = "其他收入";
    el.txAccount.value = "銀行卡";
    el.txAmount.value = remaining > 0 ? remaining : numberOrZero(plan.amount);
    el.txItem.value = plan.name + "（" + monthLabel(month) + "）";
    el.txStatus.value = "paid";
    el.txHint.textContent = "請填實際到帳日期；儲存後會沖銷本月預計收入。";
  });
  el.txRecurring.addEventListener("change", function () {
    var item = findRecurring(el.txRecurring.value);
    if (!item) return;
    renderCategoryOptions("expense", item.category || "其他");
    el.txCategory.value = item.category || "其他";
    el.txAccount.value = item.account || "銀行卡";
    el.txAmount.value = item.amount;
    el.txItem.value = item.name + "（" + monthLabel(el.monthPicker.value || monthText()) + "）";
    el.txStatus.value = "paid";
    el.txHint.textContent = "此筆記錄會列入本月週期性支出。";
  });
  el.txCategory.addEventListener("change", function () {
    if (el.txCategory.value !== "還款") el.txDebt.value = "";
  });
  el.txReset.addEventListener("click", resetTxForm);
  el.debtReset.addEventListener("click", resetDebtForm);
  el.recurringReset.addEventListener("click", resetRecurringForm);
  el.incomePlanReset.addEventListener("click", resetIncomePlanForm);
  el.showIncomePlanForm.addEventListener("click", function () { resetIncomePlanForm(); el.incomePlanFormWrap.open = true; });
  el.showDebtForm.addEventListener("click", function () { resetDebtForm(); el.debtFormWrap.open = true; });
  el.showRecurringForm.addEventListener("click", function () { resetRecurringForm(); el.recurringFormWrap.open = true; });
  el.savingsList.addEventListener("click", function (event) {
    var deposit = event.target.closest("[data-savings-deposit]");
    var withdraw = event.target.closest("[data-savings-withdraw]");
    var edit = event.target.closest("[data-edit-savings-account]");
    var remove = event.target.closest("[data-delete-savings-account]");
    if (deposit) registerSavingsMovement(deposit.dataset.savingsDeposit, "deposit");
    if (withdraw) registerSavingsMovement(withdraw.dataset.savingsWithdraw, "withdraw");
    if (edit) { var account = findSavingsAccount(edit.dataset.editSavingsAccount); if (account) fillSavingsAccountForm(account); }
    if (remove) deleteSavingsAccount(remove.dataset.deleteSavingsAccount);
  });
  el.savingsGoalList.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-edit-savings-goal]");
    var remove = event.target.closest("[data-delete-savings-goal]");
    if (edit) { var goal = findSavingsGoal(edit.dataset.editSavingsGoal); if (goal) fillSavingsGoalForm(goal); }
    if (remove) deleteSavingsGoal(remove.dataset.deleteSavingsGoal);
  });
  el.debtList.addEventListener("click", function (event) {
    var pay = event.target.closest("[data-pay-debt]");
    var edit = event.target.closest("[data-edit-debt]");
    var remove = event.target.closest("[data-delete-debt]");
    if (pay) registerDebtPayment(pay.dataset.payDebt);
    if (edit) { var debt = findDebt(edit.dataset.editDebt); if (debt) fillDebtForm(debt); }
    if (remove) deleteDebt(remove.dataset.deleteDebt);
  });
  el.incomePlanList.addEventListener("click", function (event) {
    var receive = event.target.closest("[data-receive-income]");
    var edit = event.target.closest("[data-edit-income-plan]");
    var remove = event.target.closest("[data-delete-income-plan]");
    if (receive) registerIncomePlan(receive.dataset.receiveIncome);
    if (edit) { var plan = findIncomePlan(edit.dataset.editIncomePlan); if (plan) fillIncomePlanForm(plan); }
    if (remove) deleteIncomePlan(remove.dataset.deleteIncomePlan);
  });
  el.recurringList.addEventListener("click", function (event) {
    var pay = event.target.closest("[data-pay-recurring]");
    var edit = event.target.closest("[data-edit-recurring]");
    var remove = event.target.closest("[data-delete-recurring]");
    if (pay) registerRecurringPayment(pay.dataset.payRecurring);
    if (edit) { var item = findRecurring(edit.dataset.editRecurring); if (item) fillRecurringForm(item); }
    if (remove) deleteRecurring(remove.dataset.deleteRecurring);
  });
  el.recordsTable.addEventListener("click", function (event) {
    var edit = event.target.closest("[data-edit-tx]");
    var remove = event.target.closest("[data-delete-tx]");
    if (edit) {
      var tx = state.transactions.filter(function (item) { return item.id === edit.dataset.editTx; })[0];
      if (tx) fillTxForm(tx);
    }
    if (remove) {
      var target = state.transactions.filter(function (item) { return item.id === remove.dataset.deleteTx; })[0];
      if (!target || !window.confirm("確定刪除這筆「" + (target.item || target.category) + "」記錄嗎？")) return;
      if (target.status === "paid" && target.type === "expense" && target.debtId) adjustDebtBalance(target.debtId, numberOrZero(target.amount));
      state.transactions = state.transactions.filter(function (item) { return item.id !== target.id; });
      saveState();
      renderAll();
      showToast("記錄已刪除");
    }
  });
  el.budgetList.addEventListener("change", function (event) {
    var input = event.target.closest("[data-budget]");
    if (!input) return;
    var value = numberOrNull(input.value);
    state.budgets[input.dataset.budget] = value === null ? 0 : Math.max(0, value);
    saveState();
    renderBudget(el.monthPicker.value || monthText());
    renderMetrics(el.monthPicker.value || monthText());
    showToast("預算已更新");
  });
  el.salaryPanel.addEventListener("click", function (event) {
    if (event.target.id !== "sync-salary") return;
    renderAll();
    showToast("已重新讀取舞蹈薪資");
  });
  el.monthPicker.addEventListener("change", renderAll);
  el.prevMonth.addEventListener("click", function () { el.monthPicker.value = shiftMonth(el.monthPicker.value, -1); renderAll(); });
  el.nextMonth.addEventListener("click", function () { el.monthPicker.value = shiftMonth(el.monthPicker.value, 1); renderAll(); });
  el.filterType.addEventListener("change", function () { renderRecords(el.monthPicker.value || monthText()); });
  el.filterCategory.addEventListener("change", function () { renderRecords(el.monthPicker.value || monthText()); });
  el.filterSearch.addEventListener("input", function () { renderRecords(el.monthPicker.value || monthText()); });
  el.exportMonthCsv.addEventListener("click", exportMonthCsv);
  el.exportAllCsv.addEventListener("click", exportAllCsv);
  el.exportJson.addEventListener("click", exportJson);
  el.importJson.addEventListener("change", function () { importJsonFile(this.files && this.files[0]); this.value = ""; });
  el.printReport.addEventListener("click", function () { window.print(); });
  document.querySelectorAll('a[href="#entry"]').forEach(function (link) {
    link.addEventListener("click", function () { if (el.entry) el.entry.open = true; });
  });
  document.querySelectorAll(".tabs .tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tabs .tab").forEach(function (item) { item.classList.remove("active"); });
      tab.classList.add("active");
    });
  });
  el.manualUpdate.addEventListener("click", async function () {
    var button = el.manualUpdate;
    button.disabled = true;
    button.textContent = "更新中…";
    try {
      if ("serviceWorker" in navigator) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(function (registration) { return registration.unregister(); }));
      }
      if (window.caches) {
        var keys = await caches.keys();
        await Promise.all(keys.filter(function (key) { return /dance-class-ledger|daily-schedule-tech|finance/i.test(key); }).map(function (key) { return caches.delete(key); }));
      }
    } catch (error) {
      console.warn("更新快取失敗", error);
    }
    var target = new URL(location.href);
    target.searchParams.set("manual-update", String(Date.now()));
    location.replace(target.toString());
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY && event.key !== SALARY_KEY) return;
    if (event.key === STORAGE_KEY) state = loadState();
    renderOptions();
    renderAll();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) renderAll();
  });

  var ledgerLink = document.querySelector("[data-ledger-link]");
  if (ledgerLink) ledgerLink.href = /\/ledger\/[^/]*$/.test(location.pathname) ? "./" : "./上課紀錄與薪資統計.html";
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("./ledger-sw.js?v=24", { updateViaCache: "none" }).catch(function (error) { console.warn("Service Worker 註冊失敗", error); });
  }

  el.monthPicker.value = monthText();
  resetTxForm();
  resetDebtForm();
  resetIncomePlanForm();
  resetSavingsAccountForm();
  resetSavingsMovementForm();
  resetSavingsGoalForm();
  resetRecurringForm();
  renderOptions();
  renderAll();
})();
