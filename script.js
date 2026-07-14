// ==========================================
// GESTIÓN DE DATOS (LocalStorage)
// ==========================================
let appData = JSON.parse(localStorage.getItem('ranaData')) || {
    streak: 0,
    lastRoutineDate: null,
    freezes: 0,
    routineCompletedToday: { exercise: false, meditation: false, reading: false },
    pomodorosToday: 0,
    badges: { firstRoutine: false, streak3: false, pomodoroMaster: false },
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
    if(appData.length > 20) appData.pop(); // Limitar bitácora
    saveData();
}

// ==========================================
// GAMIFICACIÓN
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
            } else {
                appData.streak = 0;
                addLog("💔 Racha reiniciada.");
            }
        }
        appData.routineCompletedToday = { exercise: false, meditation: false, reading: false };
        appData.pomodorosToday = 0;
        appData.lastRoutineDate = today;
        saveData();
    }
}

function checkBadges() {
    if (!appData.badges.firstRoutine && appData.routineCompletedToday.exercise && appData.routineCompletedToday.meditation && appData.routineCompletedToday.reading) {
        appData.badges.firstRoutine = true;
        addLog("🏅 ¡Medalla desbloqueada: Primera Rutina!");
        sendNotification("¡Medalla Desbloqueada!", "Has completado tu primera rutina 20/20/20");
    }
    if (!appData.badges.streak3 && appData.streak >= 3) {
        appData.badges.streak3 = true;
        addLog("🏅 ¡Medalla desbloqueada: Racha de 3 días!");
    }
    if (!appData.badges.pomodoroMaster && appData.pomodorosToday >= 4) {
        appData.badges.pomodoroMaster = true;
        addLog("🏅 ¡Medalla desbloqueada: Maestro Pomodoro!");
    }
    saveData();
}

// ==========================================
// TEMPORIZADOR LÓGICO (Genérico)
// ==========================================
let routineInterval, pomodoroInterval;
let routineSeconds = 20 * 60; // 20 minutos
let currentRoutineTab = 'exercise';
let pomodoroSeconds = 25 * 60; // 25 minutos
let pomodoroMode = 'work';

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
    
    if (routineSeconds === 0 && document.getElementById('routine-timer-display').innerText === "20:00") return; // Evitar trigger en reset
    
    if (routineSeconds <= 0) {
        appData.routineCompletedToday[currentRoutineTab] = true;
        addLog(`✅ Completado: 20 min de ${currentRoutineTab}`);
        
        // Verificar si los 3 están completos para sumar racha
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

// Rutina rápida de 5 minutos (congela racha)
function startQuick5() {
    routineSeconds = 5 * 60; // 5 minutos
    document.getElementById('routine-timer-display').innerText = formatTime(routineSeconds);
    startRoutine();
    // Al completar el de 5 min, otorga un congelamiento
    setTimeout(() => {
        if(routineSeconds <= 0) {
            appData.freezes++;
            addLog("🧊 Rutina de 5 min completada. ¡Ganaste un congelamiento!");
            saveData();
        }
    }, 5 * 60 * 1000 + 1000);
}

// ==========================================
// POMODORO
// ==========================================
function startPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(() => {
        pomodoroSeconds--;
        document.getElementById('pomodoro-timer-display').innerText = formatTime(pomodoroSeconds);
        if (pomodoroSeconds <= 0) {
            clearInterval(pomodoroInterval);
            if (pomodoroMode === 'work') {
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
// NOTIFICACIONES WEB API
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

// ==========================================
// ACTUALIZACIÓN DE UI
// ==========================================
function updateUI() {
    document.getElementById('streak-display').innerText = `🔥 Racha: ${appData.streak} días`;
    document.getElementById('freezes-display').innerText = `🧊 Congelamientos: ${appData.freezes}`;
    
    // Renderizar medallas
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    const badgesDef = [
        { id: 'firstRoutine', icon: '🥇', name: 'Primera Rutina' },
        { id: 'streak3', icon: '🔥', name: 'Racha 3 Días' },
        { id: 'pomodoroMaster', icon: '🍅', name: 'Maestro Pomodoro' }
    ];
    badgesDef.forEach(b => {
        const div = document.createElement('div');
        div.className = `badge ${appData.badges[b.id] ? 'unlocked' : ''}`;
        div.innerText = b.icon;
        div.title = b.name;
        badgesContainer.appendChild(div);
    });

    // Renderizar Bitácora
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';
    if(appData.log.length === 0) logList.innerHTML = '<p class="log-item">Aún no hay actividad.</p>';
    appData.log.forEach(entry => {
        const p = document.createElement('p');
        p.className = 'log-item';
        p.innerText = `[${entry.date} ${entry.time}] ${entry.message}`;
        logList.appendChild(p);
    });
}

// ==========================================
// INICIALIZACIÓN Y EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkStreak();
    updateUI();

    // Tabs Rutina
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentRoutineTab = e.target.dataset.tab;
            resetRoutine();
        });
    });

    document.getElementById('routine-start-btn').addEventListener('click', startRoutine);
    document.getElementById('routine-pause-btn').addEventListener('click', () => clearInterval(routineInterval));
    document.getElementById('routine-reset-btn').addEventListener('click', () => resetRoutine());
    document.getElementById('quick-5-btn').addEventListener('click', startQuick5);

    // Pomodoro
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchPomodoroMode(e.target.dataset.mode));
    });
    document.getElementById('pomodoro-start-btn').addEventListener('click', startPomodoro);
    document.getElementById('pomodoro-pause-btn').addEventListener('click', () => clearInterval(pomodoroInterval));
    document.getElementById('pomodoro-reset-btn').addEventListener('click', () => switchPomodoroMode(pomodoroMode));

    document.getElementById('enable-notifications-btn').addEventListener('click', requestNotificationPermission);

    // Registro del Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.error('Error al registrar SW:', err));
    }
});