// ==========================================
// GESTIÓN DE DATOS (LocalStorage)
// ==========================================
let appData = JSON.parse(localStorage.getItem('ranaData')) || {
    userName: null,
    theme: 'light', // Predefinido en light
    streak: 0,
    lastRoutineDate: null,
    freezes: 0,
    routineCompletedToday: { exercise: false, meditation: false, reading: false },
    totalPomodoros: 0,
    pomodorosToday: 0,
    quickRoutinesDone: 0,
    tasks: [],
    badges: {
        firstRoutine: false, streak3: false, pomodoroMaster: false, 
        pomodoro10: false, freezeCollector: false, earlyBird: false, nightOwl: false,
        // Logros de racha largos (cada 10 y especiales cada 30)
        m10: false, m20: false, m30: false, m40: false, m50: false, m60: false, 
        m90: false, m120: false, m150: false, m180: false, m210: false, 
        m240: false, m270: false, m300: false, m330: false, m365: false
    },
    log: []
};

function saveData() {
    localStorage.setItem('ranaData', JSON.stringify(appData));
    updateUI();
}

function addLog(message) {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toLocaleDateString('es-ES');
    appData.log.unshift({ date, time, message });
    if(appData.log.length > 30) appData.log.pop();
    saveData();
}

// ==========================================
// FRASES MOTIVACIONALES
// ==========================================
const phrases = [
    "La perseverancia no es una carrera larga, es muchas carreras cortas una tras otra.",
    "La fuerza de voluntad es como un músculo: cuanto más la usas, más fuerte se vuelve.",
    "El secreto de avanzar es empezar. El secreto de empezar es dividir tus tareas complejas en pequeñas tareas manejables.",
    "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "No cuentes los días, haz que los días cuenten.",
    "El dolor de la disciplina pesa gramos, el dolor del arrepentimiento pesa toneladas.",
    "Un sapo no se salta dos veces en la misma piedra. Aprende y avanza."
];

function setDailyMotivation() {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    document.getElementById('motivation-text').innerText = `"${phrases[randomIndex]}"`;
}

// ==========================================
// EFECTO HOJAS DE CEREZO (LENTO)
// ==========================================
function createPetals() {
    const container = document.getElementById('petals-container');
    container.innerHTML = ''; // Limpiar por si acaso
    for(let i=0; i<15; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 15 + 10;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        petal.style.left = `${Math.random() * 100}vw`;
        // Duración lenta: entre 12 y 22 segundos
        petal.style.animationDuration = `${Math.random() * 10 + 12}s`;
        petal.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(petal);
    }
}

// ==========================================
// GAMIFICACIÓN Y RACHAS
// ==========================================
function checkStreak() {
    const today = new Date().toDateString();
    if (appData.lastRoutineDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (appData.lastRoutineDate !== yesterday.toDateString()) {
            if (appData.freezes > 0) {
                appData.freezes--;
                addLog("🧊 Racha congelada salvada por 1 día.");
            } else if (appData.lastRoutineDate !== null) {
                appData.streak = 0;
                addLog("💔 Racha reiniciada. ¡Vuelve a empezar!");
            }
        }
        appData.routineCompletedToday = { exercise: false, meditation: false, reading: false };
        appData.pomodorosToday = 0;
        appData.lastRoutineDate = today;
        saveData();
    }
}

function checkBadges() {
    const b = appData.badges;
    const hour = new Date().getHours();

    if (!b.firstRoutine && appData.routineCompletedToday.exercise && appData.routineCompletedToday.meditation && appData.routineCompletedToday.reading) {
        b.firstRoutine = true; addLog("🏅 ¡Medalla: Primera Rutina!");
        sendNotification("¡Medalla Desbloqueada!", "Has completado tu primera rutina 20/20/20");
    }
    if (!b.streak3 && appData.streak >= 3) { b.streak3 = true; addLog("🏅 ¡Medalla: Racha de 3 días!"); }
    if (!b.pomodoroMaster && appData.totalPomodoros >= 1) { b.pomodoroMaster = true; addLog("🏅 ¡Medalla: Primer Pomodoro!"); }
    if (!b.pomodoro10 && appData.totalPomodoros >= 10) { b.pomodoro10 = true; addLog("🏅 ¡Medalla: 10 Pomodoros totales!"); }
    if (!b.freezeCollector && appData.quickRoutinesDone >= 3) { b.freezeCollector = true; addLog("🏅 ¡Medalla: Coleccionista de Congelamientos!"); }
    if (!b.earlyBird && appData.routineCompletedToday.exercise && hour < 9) { b.earlyBird = true; addLog("🏅 ¡Medalla: Madrugador!"); }
    if (!b.nightOwl && appData.pomodorosToday >= 1 && hour >= 22) { b.nightOwl = true; addLog("🏅 ¡Medalla: Nocturno!"); }
    
    // Sistema de Logros Largos (10, 20, 30... 365)
    const milestones = [10, 20, 30, 40, 50, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];
    milestones.forEach(m => {
        if (appData.streak >= m && !b[`m${m}`]) {
            b[`m${m}`] = true;
            const isSpecial = m % 30 === 0;
            addLog(isSpecial ? `🌟 ¡LOGRO ESPECIAL DESBLOQUEADO: ${m} días! 🌟` : `🏆 ¡Logro desbloqueado: ${m} días de racha!`);
            sendNotification(isSpecial ? "¡Logro Especial!" : "¡Nuevo Logro!", `Has alcanzado ${m} días de racha.`);
        }
    });
    
    saveData();
}

// ==========================================
// TEMPORIZADORES (Rutina y Pomodoro)
// ==========================================
let routineInterval, pomodoroInterval, stopwatchInterval;
let routineSeconds = 20 * 60;
let currentRoutineTab = 'exercise';
let pomodoroSeconds = 25 * 60;
let pomodoroMode = 'work';
let stopwatchSeconds = 0;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatStopwatch(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function startRoutine() {
    clearInterval(routineInterval);
    routineInterval = setInterval(() => {
        routineSeconds--;
        document.getElementById('routine-timer-display').innerText = formatTime(routineSeconds);
        if (routineSeconds <= 0) {
            clearInterval(routineInterval);
            completeRoutine();
        }
    }, 1000);
}

function completeRoutine() {
    sendNotification("¡Tiempo!", `Has completado: ${currentRoutineTab}`);
    if (routineSeconds <= 0) {
        appData.routineCompletedToday[currentRoutineTab] = true;
        addLog(`✅ Completado: 20 min de ${currentRoutineTab}`);
        if (appData.routineCompletedToday.exercise && appData.routineCompletedToday.meditation && appData.routineCompletedToday.reading) {
            appData.streak++;
            addLog("🔥 ¡Racha incrementada! Día completado.");
        }
        checkBadges();
        saveData();
        resetRoutine(false);
    }
}

function resetRoutine(resetDisplay = true) {
    clearInterval(routineInterval);
    routineSeconds = 20 * 60;
    if(resetDisplay) document.getElementById('routine-timer-display').innerText = "20:00";
}

function startQuick5() {
    routineSeconds = 5 * 60;
    document.getElementById('routine-timer-display').innerText = formatTime(routineSeconds);
    startRoutine();
    setTimeout(() => {
        if(routineSeconds <= 0) {
            appData.freezes++;
            appData.quickRoutinesDone++;
            addLog("🧊 Rutina de 5 min completada. ¡Ganaste un congelamiento!");
            checkBadges();
            saveData();
        }
    }, 5 * 60 * 1000 + 1000);
}

function startPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(() => {
        pomodoroSeconds--;
        document.getElementById('pomodoro-timer-display').innerText = formatTime(pomodoroSeconds);
        if (pomodoroSeconds <= 0) {
            clearInterval(pomodoroInterval);
            if (pomodoroMode === 'work') {
                appData.totalPomodoros++;
                appData.pomodorosToday++;
                addLog("🍅 Pomodoro completado (25m).");
                sendNotification("¡Descanso!", "Te ganaste 5 minutos de descanso.");
                switchPomodoroMode('break');
            } else {
                addLog("☕ Descanso terminado (5m).");
                sendNotification("¡A trabajar!", "Vuelve a la concentración por 25 min.");
                switchPomodoroMode('work');
            }
            checkBadges();
            saveData();
        }
    }, 1000);
}

function switchPomodoroMode(mode) {
    pomodoroMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
    pomodoroSeconds = mode === 'work' ? 25 * 60 : 5 * 60;
    document.getElementById('pomodoro-timer-display').innerText = formatTime(pomodoroSeconds);
    clearInterval(pomodoroInterval);
}

// ==========================================
// HERRAMIENTAS: CRONÓMETRO Y TAREAS
// ==========================================
function startStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
        stopwatchSeconds++;
        document.getElementById('stopwatch-display').innerText = formatStopwatch(stopwatchSeconds);
    }, 1000);
}

function stopStopwatch() { clearInterval(stopwatchInterval); }
function resetStopwatch() {
    stopStopwatch();
    stopwatchSeconds = 0;
    document.getElementById('stopwatch-display').innerText = "00:00:00";
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    appData.tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.done ? 'done' : ''}`;
        li.innerHTML = `
            <span onclick="toggleTask(${index})" style="cursor:pointer; flex:1;">${task.text}</span>
            <button class="del-btn" onclick="deleteTask(${index})">❌</button>
        `;
        list.appendChild(li);
    });
}

function toggleTask(index) {
    appData.tasks[index].done = !appData.tasks[index].done;
    saveData();
    renderTasks();
}

function deleteTask(index) {
    appData.tasks.splice(index, 1);
    saveData();
    renderTasks();
}

// ==========================================
// NOTIFICACIONES Y UI
// ==========================================
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendNotification("Notificaciones Activadas", "¡Te avisaremos cuando terminen tus temporizadores!");
            }
        });
    }
}

function sendNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'sapo.jpg' });
    }
}

function updateUI() {
    const hour = new Date().getHours();
    let greeting = "¡Bienvenido!";
    if (hour < 12) greeting = "Buenos días";
    else if (hour < 20) greeting = "Buenas tardes";
    else greeting = "Buenas noches";
    document.getElementById('greeting-text').innerText = `${greeting}, ${appData.userName || 'Amigo'}! 👋`;

    document.getElementById('streak-display').innerText = `🔥 Racha: ${appData.streak} días`;
    document.getElementById('freezes-display').innerText = `🧊 Congelamientos: ${appData.freezes}`;
    
    // Medallas Fijas
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    const badgesDef = [
        { id: 'firstRoutine', icon: '🥇', name: '1ra Rutina' },
        { id: 'streak3', icon: '🔥', name: '3 Días' },
        { id: 'pomodoroMaster', icon: '🍅', name: '1er Pomodoro' },
        { id: 'pomodoro10', icon: '⏳', name: '10 Pomodoros' },
        { id: 'freezeCollector', icon: '🧊', name: '3 Congelamientos' },
        { id: 'earlyBird', icon: '🌅', name: 'Madrugador' },
        { id: 'nightOwl', icon: '🦉', name: 'Nocturno' }
    ];
    badgesDef.forEach(b => {
        const div = document.createElement('div');
        div.className = `badge ${appData.badges[b.id] ? 'unlocked' : ''}`;
        div.innerHTML = `${b.icon}<small>${b.name}</small>`;
        div.title = b.name;
        badgesContainer.appendChild(div);
    });

    // Medallas de Racha (Largo Plazo)
    const milestonesContainer = document.getElementById('milestones-container');
    milestonesContainer.innerHTML = '';
    const milestonesDef = [
        { id: 'm10', icon: '🔟', name: '10 Días', special: false },
        { id: 'm20', icon: '2️⃣0️⃣', name: '20 Días', special: false },
        { id: 'm30', icon: '🌟', name: '30 Días', special: true },
        { id: 'm40', icon: '4️⃣0️⃣', name: '40 Días', special: false },
        { id: 'm50', icon: '5️⃣0️⃣', name: '50 Días', special: false },
        { id: 'm60', icon: '💎', name: '60 Días', special: true },
        { id: 'm90', icon: '👑', name: '90 Días', special: true },
        { id: 'm120', icon: '🏰', name: '120 Días', special: true },
        { id: 'm150', icon: '🌈', name: '150 Días', special: true },
        { id: 'm180', icon: '⚡', name: '180 Días', special: true },
        { id: 'm210', icon: '🚀', name: '210 Días', special: true },
        { id: 'm240', icon: '🌠', name: '240 Días', special: true },
        { id: 'm270', icon: '🦋', name: '270 Días', special: true },
        { id: 'm300', icon: '🏆', name: '300 Días', special: true },
        { id: 'm330', icon: '🌺', name: '330 Días', special: true },
        { id: 'm365', icon: '🦸‍♂️', name: '1 Año!', special: true }
    ];
    milestonesDef.forEach(b => {
        const div = document.createElement('div');
        div.className = `badge ${appData.badges[b.id] ? 'unlocked' : ''} ${b.special ? 'special' : ''}`;
        div.innerHTML = `${b.icon}<small>${b.name}</small>`;
        div.title = b.name;
        milestonesContainer.appendChild(div);
    });

    // Bitácora
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    if(appData.log.length === 0) logList.innerHTML = '<p class="log-item">Aún no hay actividad.</p>';
    appData.log.forEach(entry => {
        const p = document.createElement('p');
        p.className = 'log-item';
        p.innerText = `[${entry.date} ${entry.time}] ${entry.message}`;
        logList.appendChild(p);
    });

    renderTasks();
}

// ==========================================
// INICIALIZACIÓN Y EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema guardado (predefinido light)
    if (appData.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-btn').innerText = '☀️';
    } else {
        document.getElementById('theme-toggle-btn').innerText = '🌙';
    }

    if (!appData.userName) {
        document.getElementById('welcome-modal').classList.remove('hidden');
    } else {
        document.getElementById('welcome-modal').classList.add('hidden');
    }

    createPetals();
    setDailyMotivation();
    checkStreak();
    updateUI();

    // Modal
    document.getElementById('save-name-btn').addEventListener('click', () => {
        const name = document.getElementById('name-input').value.trim();
        if(name) {
            appData.userName = name;
            saveData();
            document.getElementById('welcome-modal').classList.add('hidden');
            updateUI();
        }
    });

    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', (e) => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            appData.theme = 'dark';
            e.target.innerText = '☀️';
        } else {
            appData.theme = 'light';
            e.target.innerText = '🌙';
        }
        saveData();
    });

    // Música
    const audio = document.getElementById('bg-audio');
    audio.volume = 0.3; // Volumen relajante
    document.getElementById('music-toggle-btn').addEventListener('click', () => {
        if (audio