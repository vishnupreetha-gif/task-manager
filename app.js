// Get elements from the page
var taskInput = document.getElementById("taskInput");
var dueDateInput = document.getElementById("dueDateInput");
var addBtn = document.getElementById("addBtn");
var taskList = document.getElementById("taskList");
var emptyMsg = document.getElementById("emptyMsg");
var totalTasks = document.getElementById("totalTasks");
var completedTasks = document.getElementById("completedTasks");
var pendingTasks = document.getElementById("pendingTasks");
var filterBtns = document.querySelectorAll(".filter-btn");
var darkModeBtn = document.getElementById("darkModeBtn");
var progressFill = document.getElementById("progressFill");
var progressText = document.getElementById("progressText");
var priorityBtns = document.querySelectorAll(".priority-btn");
var categoryBtns = document.querySelectorAll(".category-btn");
var catFilterBtns = document.querySelectorAll(".cat-filter-btn");
var searchInput = document.getElementById("searchInput");
var dots = document.querySelectorAll(".dot");

var helpBtn = document.getElementById("helpBtn");
var helpOverlay = document.getElementById("helpOverlay");
var helpClose = document.getElementById("helpClose");

var cartoonPerson = document.getElementById("cartoonPerson");
var personMouth = document.getElementById("personMouth");
var personSpeech = document.getElementById("personSpeech");

var tasks = [];
var currentFilter = "all";
var currentCatFilter = "all";
var currentStep = 1;
var selectedPriority = "medium";
var selectedCategory = "work";
var timers = {}; // { taskId: { interval: null, elapsed: 0, running: false } }
var draggedItem = null;

// Boss Baby reactions
function personReact(mood, message) {
    personSpeech.textContent = message;
    personMouth.className = "baby-mouth";
    cartoonPerson.classList.remove("celebrating", "happy");

    if (mood === "happy") {
        personMouth.classList.add("happy");
        cartoonPerson.classList.add("happy");
        setTimeout(function () {
            cartoonPerson.classList.remove("happy");
            personMouth.className = "baby-mouth";
            personSpeech.textContent = "What's the next task?";
        }, 3000);
    } else if (mood === "excited") {
        personMouth.classList.add("excited");
        cartoonPerson.classList.add("celebrating");
        setTimeout(function () {
            cartoonPerson.classList.remove("celebrating");
            personMouth.className = "baby-mouth";
            personSpeech.textContent = "I want more tasks!";
        }, 4000);
    }
}

// Sound effects
function playSound(type) {
    var audio = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audio.createOscillator();
    var gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    gain.gain.value = 0.15;

    if (type === "complete") {
        oscillator.frequency.value = 600;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.15, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.4);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.4);
        var osc2 = audio.createOscillator();
        var gain2 = audio.createGain();
        osc2.connect(gain2);
        gain2.connect(audio.destination);
        osc2.frequency.value = 900;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.15, audio.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);
        osc2.start(audio.currentTime + 0.15);
        osc2.stop(audio.currentTime + 0.5);
    } else if (type === "add") {
        oscillator.frequency.value = 500;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.12, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.15);
    } else if (type === "delete") {
        oscillator.frequency.value = 400;
        oscillator.type = "sine";
        oscillator.frequency.exponentialRampToValueAtTime(100, audio.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.3);
    } else if (type === "allDone") {
        var notes = [523, 659, 784, 1047];
        notes.forEach(function (freq, i) {
            var o = audio.createOscillator();
            var g = audio.createGain();
            o.connect(g);
            g.connect(audio.destination);
            o.frequency.value = freq;
            o.type = "sine";
            g.gain.setValueAtTime(0.12, audio.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * 0.15 + 0.4);
            o.start(audio.currentTime + i * 0.15);
            o.stop(audio.currentTime + i * 0.15 + 0.4);
        });
    } else if (type === "step") {
        oscillator.frequency.value = 700;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.08, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.1);
    } else if (type === "timer") {
        oscillator.frequency.value = 800;
        oscillator.type = "triangle";
        gain.gain.setValueAtTime(0.1, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);
        oscillator.start(audio.currentTime);
        oscillator.stop(audio.currentTime + 0.08);
    }
}

// Load saved data
loadTasks();
loadDarkMode();

// ===== STEP NAVIGATION =====

// Step 1: Task Name
document.getElementById("nextBtn1").addEventListener("click", function () {
    if (taskInput.value.trim() === "") {
        taskInput.style.borderColor = "#e74c3c";
        taskInput.focus();
        setTimeout(function () { taskInput.style.borderColor = "#e0e0e0"; }, 1000);
        personSpeech.textContent = "Oops! Type a task name first!";
        personMouth.className = "baby-mouth";
        return;
    }
    personSpeech.textContent = "Love it! \"" + taskInput.value.trim() + "\"!";
    goToStep(2);
});

taskInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        document.getElementById("nextBtn1").click();
    }
});

// Boss Baby reacts while typing
taskInput.addEventListener("input", function () {
    if (taskInput.value.trim().length > 0) {
        personSpeech.textContent = "Good... keep typing!";
        personMouth.className = "baby-mouth happy";
        cartoonPerson.classList.add("happy");
    } else {
        personSpeech.textContent = "Type your task name here!";
        personMouth.className = "baby-mouth";
        cartoonPerson.classList.remove("happy");
    }
});

// Step 2: Due Date
document.getElementById("nextBtn2").addEventListener("click", function () {
    if (dueDateInput.value) {
        personSpeech.textContent = "Great! Deadline is set!";
    } else {
        personSpeech.textContent = "No date? No worries!";
    }
    goToStep(3);
});

document.getElementById("skipBtn2").addEventListener("click", function () {
    dueDateInput.value = "";
    personSpeech.textContent = "Skipping! Let's move on!";
    goToStep(3);
});

document.getElementById("backBtn2").addEventListener("click", function () {
    personSpeech.textContent = "Going back to task name!";
    goToStep(1);
});

// Step 3: Category
document.getElementById("nextBtn3").addEventListener("click", function () {
    personSpeech.textContent = "Nice! " + selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) + " category!";
    goToStep(4);
});

document.getElementById("backBtn3").addEventListener("click", function () {
    personSpeech.textContent = "Let's set a date!";
    goToStep(2);
});

// Category selection in step 3
categoryBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        categoryBtns.forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        selectedCategory = btn.dataset.category;

        var catMessages = {
            work: "Work task! Let's be productive!",
            personal: "Personal stuff! Important too!",
            shopping: "Shopping list! Don't forget!",
            study: "Study time! Knowledge is power!"
        };
        personSpeech.textContent = catMessages[selectedCategory] || "Good choice!";
    });
});

// Step 4: Priority
document.getElementById("backBtn4").addEventListener("click", function () {
    personSpeech.textContent = "Pick a category!";
    goToStep(3);
});

// Priority selection
priorityBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        priorityBtns.forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        selectedPriority = btn.dataset.priority;

        if (selectedPriority === "high") {
            personSpeech.textContent = "Super important! Got it!";
        } else if (selectedPriority === "medium") {
            personSpeech.textContent = "Medium. Good choice!";
        } else {
            personSpeech.textContent = "Low priority. Easy peasy!";
        }
    });
});

// Add task
addBtn.addEventListener("click", addTask);

// Step instructions from Boss Baby
var stepMessages = {
    1: "What's the task? Type it!",
    2: "When is it due? Pick a date!",
    3: "Pick a category for it!",
    4: "How important? Then Add it!"
};

function goToStep(step) {
    playSound("step");
    currentStep = step;
    document.querySelectorAll(".step").forEach(function (s) { s.classList.remove("active"); });
    document.getElementById("step" + step).classList.add("active");

    dots.forEach(function (d) {
        d.classList.remove("active");
        if (parseInt(d.dataset.step) <= step) {
            d.classList.add("active");
        }
    });

    // Boss Baby instructs each step
    setTimeout(function () {
        personSpeech.textContent = stepMessages[step];
        personMouth.className = "baby-mouth";
        cartoonPerson.classList.remove("happy", "celebrating");
    }, 300);
}

// ===== FILTER BUTTONS (Status) =====
filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// ===== CATEGORY FILTER BUTTONS =====
catFilterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
        catFilterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentCatFilter = btn.dataset.cat;
        renderTasks();
    });
});

// ===== SEARCH =====
searchInput.addEventListener("input", function () {
    renderTasks();
});

// Help modal toggle
helpBtn.addEventListener("click", function () {
    helpOverlay.classList.add("active");
});

helpClose.addEventListener("click", function () {
    helpOverlay.classList.remove("active");
});

helpOverlay.addEventListener("click", function (e) {
    if (e.target === helpOverlay) {
        helpOverlay.classList.remove("active");
    }
});

// Dark mode toggle
darkModeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    var isDark = document.body.classList.contains("dark");
    darkModeBtn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem("darkMode", isDark);
});

function addTask() {
    var text = taskInput.value.trim();
    if (text === "") return;

    var task = {
        id: Date.now(),
        text: text,
        done: false,
        priority: selectedPriority,
        category: selectedCategory,
        dueDate: dueDateInput.value || null,
        timerElapsed: 0,
        notes: ""
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    playSound("add");
    personReact("happy", "Yay! Task added!");

    // Reset form
    taskInput.value = "";
    dueDateInput.value = "";
    selectedPriority = "medium";
    selectedCategory = "work";
    priorityBtns.forEach(function (b) { b.classList.remove("selected"); });
    document.querySelector('.priority-btn.medium').classList.add("selected");
    categoryBtns.forEach(function (b) { b.classList.remove("selected"); });
    document.querySelector('.category-btn[data-category="work"]').classList.add("selected");
    goToStep(1);
    taskInput.focus();
}

function toggleTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (task) {
        task.done = !task.done;
        // Stop timer if marking done
        if (task.done && timers[id] && timers[id].running) {
            stopTimer(id);
        }
        saveTasks();
        renderTasks();

        if (task.done) {
            var allDone = tasks.length > 0 && tasks.every(function (t) { return t.done; });
            if (allDone) {
                playSound("allDone");
                launchConfetti();
                personReact("excited", "ALL DONE! You're amazing!");
            } else {
                playSound("complete");
                personReact("happy", "Great job! Keep going!");
            }
        } else {
            personReact("normal", "Unchecked! Let's redo it!");
        }
    }
}

function deleteTask(id) {
    // Stop timer if running
    if (timers[id]) {
        clearInterval(timers[id].interval);
        delete timers[id];
    }

    var items = taskList.querySelectorAll(".task-item");
    items.forEach(function (item) {
        if (item.dataset.id === String(id)) {
            item.classList.add("removing");
            playSound("delete");
            personReact("normal", "Gone! Task removed!");
            setTimeout(function () {
                tasks = tasks.filter(function (t) { return t.id !== id; });
                saveTasks();
                renderTasks();
            }, 400);
        }
    });
}

function editTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    var items = taskList.querySelectorAll(".task-item");
    items.forEach(function (item) {
        if (item.dataset.id === String(id)) {
            var content = item.querySelector(".task-content");
            var currentText = task.text;

            content.innerHTML = "";
            var input = document.createElement("input");
            input.type = "text";
            input.className = "edit-input";
            input.value = currentText;
            content.appendChild(input);
            input.focus();
            input.select();

            input.addEventListener("keypress", function (e) {
                if (e.key === "Enter") {
                    saveEdit(id, input.value);
                }
            });

            input.addEventListener("blur", function () {
                saveEdit(id, input.value);
            });
        }
    });
}

function saveEdit(id, newText) {
    var trimmed = newText.trim();
    if (trimmed === "") return;

    var task = tasks.find(function (t) { return t.id === id; });
    if (task) {
        task.text = trimmed;
        saveTasks();
        renderTasks();
    }
}

// ===== TIMER FUNCTIONS =====
function formatTime(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    if (h > 0) {
        return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }
    return m + ":" + (s < 10 ? "0" : "") + s;
}

function startTimer(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task || task.done) return;

    if (!timers[id]) {
        timers[id] = { interval: null, elapsed: task.timerElapsed || 0, running: false };
    }

    if (timers[id].running) return;

    timers[id].running = true;
    playSound("timer");

    timers[id].interval = setInterval(function () {
        timers[id].elapsed++;
        task.timerElapsed = timers[id].elapsed;

        // Update the timer display in the DOM
        var timerDisplay = document.querySelector('.task-item[data-id="' + id + '"] .timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timers[id].elapsed);
            timerDisplay.classList.add("running");
        }

        // Save every 10 seconds
        if (timers[id].elapsed % 10 === 0) {
            saveTasks();
        }
    }, 1000);

    // Update button appearance
    var timerBtn = document.querySelector('.task-item[data-id="' + id + '"] .timer-btn');
    if (timerBtn) {
        timerBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        timerBtn.title = "Pause timer";
    }
}

function stopTimer(id) {
    if (!timers[id]) return;

    clearInterval(timers[id].interval);
    timers[id].running = false;
    saveTasks();

    // Update button appearance
    var timerBtn = document.querySelector('.task-item[data-id="' + id + '"] .timer-btn');
    if (timerBtn) {
        timerBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        timerBtn.title = "Start timer";
    }

    var timerDisplay = document.querySelector('.task-item[data-id="' + id + '"] .timer-display');
    if (timerDisplay) {
        timerDisplay.classList.remove("running");
    }
}

function toggleTimer(id) {
    if (timers[id] && timers[id].running) {
        stopTimer(id);
    } else {
        startTimer(id);
    }
}

// ===== DRAG & DROP =====
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.dataset.id);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    var target = this;
    if (target.classList.contains("task-item") && target !== draggedItem) {
        var rect = target.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;

        if (e.clientY < midY) {
            taskList.insertBefore(draggedItem, target);
        } else {
            taskList.insertBefore(draggedItem, target.nextSibling);
        }
    }
}

function handleDrop(e) {
    e.preventDefault();

    // Reorder tasks array based on new DOM order
    var newOrder = [];
    var items = taskList.querySelectorAll(".task-item");
    items.forEach(function (item) {
        var id = parseInt(item.dataset.id);
        var task = tasks.find(function (t) { return t.id === id; });
        if (task) newOrder.push(task);
    });

    // Add back any tasks not currently displayed (filtered out)
    tasks.forEach(function (t) {
        var found = newOrder.find(function (n) { return n.id === t.id; });
        if (!found) newOrder.push(t);
    });

    tasks = newOrder;
    saveTasks();
    renderTasks();
}

function handleDragEnd() {
    this.classList.remove("dragging");
    draggedItem = null;
}

// ===== RENDER TASKS =====
function renderTasks() {
    taskList.innerHTML = "";

    var filtered = tasks.slice(); // copy

    // Filter by status
    if (currentFilter === "pending") {
        filtered = filtered.filter(function (t) { return !t.done; });
    } else if (currentFilter === "done") {
        filtered = filtered.filter(function (t) { return t.done; });
    }

    // Filter by category
    if (currentCatFilter !== "all") {
        filtered = filtered.filter(function (t) { return t.category === currentCatFilter; });
    }

    // Filter by search (searches task name AND notes)
    var searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(function (t) {
            return t.text.toLowerCase().indexOf(searchTerm) !== -1 ||
                   (t.notes && t.notes.toLowerCase().indexOf(searchTerm) !== -1);
        });
    }

    // Sort by priority
    var priorityOrder = { high: 1, medium: 2, low: 3 };
    filtered.sort(function (a, b) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    filtered.forEach(function (task, index) {
        var li = document.createElement("li");
        li.className = "task-item" + (task.done ? " done" : "");
        li.dataset.id = task.id;
        li.draggable = true;

        // Drag events
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);
        li.addEventListener("dragend", handleDragEnd);

        // Drag handle
        var dragHandle = document.createElement("span");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';

        // Number
        var number = document.createElement("span");
        number.className = "task-number";
        number.textContent = (index + 1);

        // Checkbox
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", function () { toggleTask(task.id); });

        // Content
        var content = document.createElement("div");
        content.className = "task-content";

        var span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text;

        var details = document.createElement("span");
        details.className = "task-details";

        // Category tag
        var catColors = { work: "#667eea", personal: "#e74c3c", shopping: "#27ae60", study: "#f39c12" };
        var catIcons = { work: "briefcase", personal: "user", shopping: "cart-shopping", study: "book" };
        var catTag = document.createElement("span");
        catTag.className = "category-tag";
        catTag.style.background = catColors[task.category] || "#667eea";
        catTag.innerHTML = '<i class="fa-solid fa-' + (catIcons[task.category] || "tag") + '"></i> ' +
            (task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : "Work");

        // Due date
        var dateSpan = document.createElement("span");
        if (task.dueDate) {
            var today = new Date().toISOString().split("T")[0];
            if (task.dueDate < today && !task.done) {
                dateSpan.innerHTML = ' <i class="fa-regular fa-calendar"></i> ' + task.dueDate + ' <span class="overdue">(Overdue!)</span>';
            } else {
                dateSpan.innerHTML = ' <i class="fa-regular fa-calendar"></i> ' + task.dueDate;
            }
        }

        details.appendChild(catTag);
        details.appendChild(dateSpan);

        content.appendChild(span);
        content.appendChild(details);

        // Priority badge
        var badge = document.createElement("span");
        badge.className = "priority-badge priority-" + task.priority;
        badge.textContent = task.priority;

        // Timer section
        var timerDiv = document.createElement("div");
        timerDiv.className = "task-timer";

        var timerDisplay = document.createElement("span");
        timerDisplay.className = "timer-display";
        var elapsed = (timers[task.id] && timers[task.id].elapsed) || task.timerElapsed || 0;
        timerDisplay.textContent = formatTime(elapsed);
        if (timers[task.id] && timers[task.id].running) {
            timerDisplay.classList.add("running");
        }

        var timerBtn = document.createElement("button");
        timerBtn.className = "timer-btn";
        if (task.done) {
            timerBtn.innerHTML = '<i class="fa-solid fa-clock"></i>';
            timerBtn.title = "Task completed";
            timerBtn.disabled = true;
        } else if (timers[task.id] && timers[task.id].running) {
            timerBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            timerBtn.title = "Pause timer";
        } else {
            timerBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            timerBtn.title = "Start timer";
        }

        (function (taskId) {
            timerBtn.addEventListener("click", function () {
                toggleTimer(taskId);
            });
        })(task.id);

        timerDiv.appendChild(timerDisplay);
        timerDiv.appendChild(timerBtn);

        // Action buttons
        var actions = document.createElement("div");
        actions.className = "task-actions";

        var noteBtn = document.createElement("button");
        noteBtn.className = "note-btn" + (task.notes ? " has-note" : "");
        noteBtn.innerHTML = '<i class="fa-solid fa-sticky-note"></i>';
        noteBtn.title = task.notes ? "View notes" : "Add notes";

        var editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.title = "Edit task";
        editBtn.addEventListener("click", function () { editTask(task.id); });

        var deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.title = "Delete task";
        deleteBtn.addEventListener("click", function () { deleteTask(task.id); });

        actions.appendChild(noteBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        // Notes panel (expandable)
        var notesPanel = document.createElement("div");
        notesPanel.className = "notes-panel";

        var notesTextarea = document.createElement("textarea");
        notesTextarea.className = "notes-textarea";
        notesTextarea.placeholder = "Write your notes here...";
        notesTextarea.value = task.notes || "";

        var notesSaveBtn = document.createElement("button");
        notesSaveBtn.className = "notes-save-btn";
        notesSaveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Note';

        notesPanel.appendChild(notesTextarea);
        notesPanel.appendChild(notesSaveBtn);

        // Note button toggle
        (function (taskId, panel, textarea, saveBtn, nBtn) {
            nBtn.addEventListener("click", function () {
                panel.classList.toggle("open");
                if (panel.classList.contains("open")) {
                    textarea.focus();
                }
            });
            notesSaveBtn.addEventListener("click", function () {
                var t = tasks.find(function (t) { return t.id === taskId; });
                if (t) {
                    t.notes = textarea.value.trim();
                    saveTasks();
                    nBtn.className = "note-btn" + (t.notes ? " has-note" : "");
                    nBtn.title = t.notes ? "View notes" : "Add notes";
                    panel.classList.remove("open");
                    if (t.notes) {
                        personReact("happy", "Note saved!");
                    }
                }
            });
        })(task.id, notesPanel, notesTextarea, notesSaveBtn, noteBtn);

        // Assemble the task item
        var topRow = document.createElement("div");
        topRow.className = "task-top-row";
        topRow.appendChild(dragHandle);
        topRow.appendChild(number);
        topRow.appendChild(checkbox);
        topRow.appendChild(content);
        topRow.appendChild(badge);
        topRow.appendChild(timerDiv);
        topRow.appendChild(actions);

        li.appendChild(topRow);
        li.appendChild(notesPanel);
        taskList.appendChild(li);
    });

    updateStats();
    updateProgress();
    updateEmptyMessage();
}

function updateEmptyMessage() {
    if (taskList.children.length === 0) {
        emptyMsg.classList.remove("hidden");
    } else {
        emptyMsg.classList.add("hidden");
    }
}

function updateStats() {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var pending = total - done;

    totalTasks.textContent = "Total: " + total;
    completedTasks.textContent = "Done: " + done;
    pendingTasks.textContent = "Pending: " + pending;
}

function updateProgress() {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var percent = total === 0 ? 0 : Math.round((done / total) * 100);

    progressFill.style.width = percent + "%";
    progressText.textContent = percent + "% complete";

    if (percent === 100 && total > 0) {
        progressFill.classList.add("full");
    } else {
        progressFill.classList.remove("full");
    }
}

function launchConfetti() {
    var colors = ["#667eea", "#764ba2", "#e74c3c", "#f39c12", "#27ae60", "#ff6b6b", "#ffd93d"];
    for (var i = 0; i < 50; i++) {
        var piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.top = "-10px";
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (Math.random() * 2 + 2) + "s";
        piece.style.animationDelay = Math.random() * 0.5 + "s";
        piece.style.width = (Math.random() * 8 + 6) + "px";
        piece.style.height = (Math.random() * 8 + 6) + "px";
        document.body.appendChild(piece);

        (function (p) {
            setTimeout(function () { p.remove(); }, 4000);
        })(piece);
    }

    // Show congratulation overlay with clapping hands
    showCongrats();
}

function showCongrats() {
    var overlay = document.createElement("div");
    overlay.className = "congrats-overlay";

    overlay.innerHTML =
        '<div class="congrats-box">' +
            '<div class="clap-hands">' +
                '<span class="clap-left">&#128079;</span>' +
                '<span class="clap-right">&#128079;</span>' +
            '</div>' +
            '<h2 class="congrats-title">Congratulations!</h2>' +
            '<p class="congrats-text">You completed all your tasks!</p>' +
            '<div class="congrats-emojis">&#127881; &#11088; &#127942; &#11088; &#127881;</div>' +
            '<button class="congrats-btn">Thank you!</button>' +
        '</div>';

    document.body.appendChild(overlay);

    // Close on button click
    overlay.querySelector(".congrats-btn").addEventListener("click", function () {
        overlay.classList.add("closing");
        setTimeout(function () { overlay.remove(); }, 300);
    });

    // Auto close after 5 seconds
    setTimeout(function () {
        if (document.body.contains(overlay)) {
            overlay.classList.add("closing");
            setTimeout(function () { overlay.remove(); }, 300);
        }
    }, 5000);
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    var saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        // Ensure old tasks have category, timerElapsed, and notes
        tasks.forEach(function (t) {
            if (!t.category) t.category = "work";
            if (!t.timerElapsed) t.timerElapsed = 0;
            if (t.notes === undefined) t.notes = "";
        });
    }
    renderTasks();
}

function loadDarkMode() {
    var isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
        document.body.classList.add("dark");
        darkModeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

// ===== REMINDER POP-UP ON PAGE LOAD =====
function checkReminders() {
    var today = new Date().toISOString().split("T")[0];
    var overdue = [];
    var dueToday = [];

    tasks.forEach(function (task) {
        if (task.done || !task.dueDate) return;
        if (task.dueDate < today) {
            overdue.push(task);
        } else if (task.dueDate === today) {
            dueToday.push(task);
        }
    });

    if (overdue.length === 0 && dueToday.length === 0) return;

    // Build reminder HTML
    var html = '<div class="reminder-box">';
    html += '<div class="reminder-icon"><i class="fa-solid fa-bell"></i></div>';
    html += '<h2 class="reminder-title">Task Reminder!</h2>';

    if (overdue.length > 0) {
        html += '<div class="reminder-section overdue-section">';
        html += '<h3><i class="fa-solid fa-triangle-exclamation"></i> Overdue (' + overdue.length + ')</h3>';
        html += '<ul>';
        overdue.forEach(function (t) {
            html += '<li><strong>' + t.text + '</strong> — was due ' + t.dueDate + '</li>';
        });
        html += '</ul></div>';
    }

    if (dueToday.length > 0) {
        html += '<div class="reminder-section today-section">';
        html += '<h3><i class="fa-solid fa-clock"></i> Due Today (' + dueToday.length + ')</h3>';
        html += '<ul>';
        dueToday.forEach(function (t) {
            html += '<li><strong>' + t.text + '</strong></li>';
        });
        html += '</ul></div>';
    }

    html += '<button class="reminder-btn">Got it!</button>';
    html += '</div>';

    var overlay = document.createElement("div");
    overlay.className = "reminder-overlay";
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Play alert sound
    playSound("step");

    // Boss Baby reacts
    if (overdue.length > 0) {
        personSpeech.textContent = "You have overdue tasks!";
    } else {
        personSpeech.textContent = "Tasks due today! Let's go!";
    }

    // Close button
    overlay.querySelector(".reminder-btn").addEventListener("click", function () {
        overlay.classList.add("closing");
        setTimeout(function () { overlay.remove(); }, 300);
    });
}

// Check reminders 1 second after page loads
setTimeout(checkReminders, 1000);
