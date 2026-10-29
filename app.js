(() => {
  "use strict";
  const STORAGE_KEY = "calendar-tasks-v1";
  const $ = (id) => document.getElementById(id);
  const els = {
    monthLabel: $("monthLabel"), monthSummary: $("monthSummary"), grid: $("calendarGrid"),
    selectedDateLabel: $("selectedDateLabel"), selectedSummary: $("selectedSummary"),
    taskList: $("taskList"), emptyState: $("emptyState"), taskCount: $("taskCount"),
    progressText: $("progressText"), progressBar: $("progressBar"), taskForm: $("taskForm"),
    taskTitle: $("taskTitle"), taskDate: $("taskDate"), taskTime: $("taskTime"),
    addTaskBtn: $("addTaskBtn"), toast: $("toast")
  };
  const today = new Date();
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const parseDate = (key) => { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d); };
  const prettyDate = (key, opts={weekday:"long", month:"long", day:"numeric", year:"numeric"}) =>
    parseDate(key).toLocaleDateString(undefined, opts);
  const todayKey = dateKey(today);
  let selectedDate = todayKey;
  let visibleYear = today.getFullYear();
  let visibleMonth = today.getMonth();
  let editingId = null;
  let toastTimer = null;
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(t => t && typeof t.id === "string" && typeof t.title === "string" && typeof t.date === "string") : [];
    } catch { return []; }
  }
  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { showToast("Could not save. Check device storage."); }
  }
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }
  function tasksOn(key) { return tasks.filter(t => t.date === key); }
  function renderCalendar() {
    const first = new Date(visibleYear, visibleMonth, 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(visibleYear, visibleMonth, 1 - mondayOffset);
    els.monthLabel.textContent = first.toLocaleDateString(undefined, {month:"long", year:"numeric"});
    const monthTasks = tasks.filter(t => {
      const d = parseDate(t.date);
      return d.getFullYear() === visibleYear && d.getMonth() === visibleMonth;
    });
    const doneCount = monthTasks.filter(t => t.completed).length;
    els.monthSummary.textContent = `${monthTasks.length} ${monthTasks.length === 1 ? "task" : "tasks"} · ${doneCount} completed`;
    els.grid.innerHTML = "";
    for (let i=0; i<42; i++) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i);
      const key = dateKey(day);
      const dayTasks = tasksOn(key);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.setAttribute("role","gridcell");
      btn.setAttribute("aria-label", `${prettyDate(key)}${dayTasks.length ? `, ${dayTasks.length} tasks` : ""}`);
      if (day.getMonth() !== visibleMonth) btn.classList.add("other-month");
      if (key === todayKey) btn.classList.add("today");
      if (key === selectedDate) btn.classList.add("selected");
      const num = document.createElement("span");
      num.className = "day-number";
      num.textContent = day.getDate();
      btn.appendChild(num);
      const dots = document.createElement("span");
      dots.className = "day-dots";
      const maxDots = Math.min(dayTasks.length, 3);
      for (let j=0; j<maxDots; j++) {
        const dot = document.createElement("i");
        dot.className = "day-dot" + (dayTasks[j].completed ? " done" : "");
        dots.appendChild(dot);
      }
      btn.appendChild(dots);
      btn.addEventListener("click", () => {
        selectedDate = key;
        visibleYear = day.getFullYear();
        visibleMonth = day.getMonth();
        closeForm();
        render();
      });
      els.grid.appendChild(btn);
    }
  }
  function renderTasks() {
    const dayTasks = tasksOn(selectedDate).sort((a,b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.createdAt-b.createdAt);
    const done = dayTasks.filter(t => t.completed).length;
    const pct = dayTasks.length ? Math.round(done/dayTasks.length*100) : 0;
    els.selectedDateLabel.textContent = prettyDate(selectedDate, {weekday:"short", month:"short", day:"numeric"});
    els.selectedSummary.textContent = dayTasks.length ? `${done} of ${dayTasks.length} completed` : "A clear day is a good place to start.";
    els.progressText.textContent = `${pct}%`;
    els.progressBar.style.width = `${pct}%`;
    els.taskCount.textContent = `${dayTasks.length} ${dayTasks.length === 1 ? "task" : "tasks"}`;
    els.taskList.innerHTML = "";
    els.emptyState.hidden = dayTasks.length > 0;
    for (const task of dayTasks) {
      const item = document.createElement("div");
      item.className = "task-item" + (task.completed ? " completed" : "");
      const check = document.createElement("button");
      check.type = "button";
      check.className = "check-button";
      check.setAttribute("aria-pressed", String(!!task.completed));
      check.setAttribute("aria-label", task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`);
      check.textContent = task.completed ? "✓" : "";
      check.addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks(); render();
        showToast(task.completed ? "Task marked completed" : "Task marked incomplete");
      });
      const main = document.createElement("div");
      main.className = "task-main";
      const title = document.createElement("div");
      title.className = "task-title";
      title.textContent = task.title;
      main.appendChild(title);
      if (task.time) {
        const time = document.createElement("div");
        time.className = "task-time";
        time.textContent = formatTime(task.time);
        main.appendChild(time);
      }
      const actions = document.createElement("div");
      actions.className = "task-actions";
      const edit = document.createElement("button");
      edit.type = "button"; edit.className = "small-action"; edit.textContent = "✎";
      edit.setAttribute("aria-label", `Edit ${task.title}`);
      edit.addEventListener("click", () => openForm(task));
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "small-action"; remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete ${task.title}`);
      remove.addEventListener("click", () => {
        if (!confirm(`Delete “${task.title}”?`)) return;
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks(); render(); showToast("Task deleted");
      });
      actions.append(edit, remove);
      item.append(check, main, actions);
      els.taskList.appendChild(item);
    }
  }
  function formatTime(time) {
    const [h,m] = time.split(":").map(Number);
    return new Date(2000,0,1,h,m).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  }
  function openForm(task=null) {
    editingId = task ? task.id : null;
    els.taskForm.hidden = false;
    els.taskTitle.value = task ? task.title : "";
    els.taskDate.value = task ? task.date : selectedDate;
    els.taskTime.value = task ? (task.time || "") : "";
    els.taskForm.querySelector('button[type="submit"]').textContent = task ? "Save changes" : "Save task";
    els.addTaskBtn.textContent = "＋ Add task";
    els.taskTitle.focus();
  }
  function closeForm() {
    els.taskForm.hidden = true;
    els.taskForm.reset();
    editingId = null;
  }
  function render() { renderCalendar(); renderTasks(); }
  $("prevMonth").addEventListener("click", () => {
    visibleMonth--; if (visibleMonth < 0) { visibleMonth=11; visibleYear--; } renderCalendar();
  });
  $("nextMonth").addEventListener("click", () => {
    visibleMonth++; if (visibleMonth > 11) { visibleMonth=0; visibleYear++; } renderCalendar();
  });
  $("todayBtn").addEventListener("click", () => {
    selectedDate = todayKey; visibleYear = today.getFullYear(); visibleMonth = today.getMonth(); closeForm(); render();
  });
  els.addTaskBtn.addEventListener("click", () => openForm());
  $("emptyAddBtn").addEventListener("click", () => openForm());
  $("cancelTaskBtn").addEventListener("click", closeForm);
  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    const date = els.taskDate.value;
    if (!title || !date) { showToast("Enter a task name and date"); return; }
    const wasEditing = Boolean(editingId);
    if (editingId) {
      const task = tasks.find(t => t.id === editingId);
      if (task) { task.title = title; task.date = date; task.time = els.taskTime.value; }
    } else {
      tasks.push({id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`), title, date, time: els.taskTime.value, completed:false, createdAt:Date.now()});
    }
    selectedDate = date;
    const d = parseDate(date); visibleYear = d.getFullYear(); visibleMonth = d.getMonth();
    saveTasks(); closeForm(); render(); showToast(wasEditing ? "Task updated" : "Task saved");
  });
  $("clearCompletedBtn").addEventListener("click", () => {
    const dayTasks = tasksOn(selectedDate);
    const completedIds = new Set(dayTasks.filter(t => t.completed).map(t => t.id));
    if (!completedIds.size) { showToast("No completed tasks to clear"); return; }
    if (!confirm(`Remove ${completedIds.size} completed ${completedIds.size === 1 ? "task" : "tasks"} from this day?`)) return;
    tasks = tasks.filter(t => !completedIds.has(t.id)); saveTasks(); render(); showToast("Completed tasks cleared");
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => showToast("Offline mode could not be enabled yet")));
  }
  render();
})();