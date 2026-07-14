// ==========================================
// GESTIÓN DE DATOS (LocalStorage)
// ==========================================
let appData = JSON.parse(localStorage.getItem('ranaData')) || {
    userName: null,
    theme: 'dark',
    streak: 0,
    lastRoutineDate: null,
    freezes: 0,
    routineCompletedToday: { exercise: false, meditation: false, reading: false },
    totalPomodoros: 0,
    pomodorosToday: 0,
    quickRoutinesDone: 0,
    badges: {
        firstRoutine: false, streak3: false, streak7: false, 
        pomodoroMaster: false, pomodoro10: false, freezeCollector: false, 
        earlyBird: false, nightOwl: false
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
    if(appData.log.length > 30) appData.log.pop(); // Limitar bitácora
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
// EFECTO HOJAS DE CEREZO
// ==========================================
function createPetals() {
    const container = document.getElementById('petals-container');
    for(let i=0; i<15; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 15 + 10;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.animationDuration = `${Math.random() * 5 + 5}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;
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
        b.firstRoutine = true;
        addLog("🏅 ¡Medalla: Primera Rutina!");
        sendNotification("¡Medalla Desbloqueada!", "Has completado tu primera rutina 20/20/20");
    }
    if (!b.streak3 && appData.streak >= 3) { b.streak3 = true; addLog("🏅 ¡Medalla: Racha de 3 días!"); }
    if (!b.streak7 && appData.streak >= 7) { b.streak7 = true; addLog("🏅 ¡Medalla: Racha de 7 días!"); }
    if (!b.pomodoroMaster && appData.totalPomodoros >= 1) { b.pomodoroMaster = true; addLog("🏅 ¡Medalla: Primer Pomodoro!"); }
    if (!b.pomodoro10 && appData.totalPomodoros >= 10) { b.pomodoro10 = true; addLog("🏅 ¡Medalla: 10 Pomodoros totales!"); }
    if (!b.freezeCollector && appData.quickRoutinesDone >= 3) { b.freezeCollector = true; addLog("🏅 ¡Medalla: Coleccionista de Congelamientos!"); }
    if (!b.earlyBird && appData.routineCompletedToday.exercise && hour < 9) { b.earlyBird = true; addLog("🏅 ¡Medalla: Madrugador!"); }
    if (!b.nightOwl && appData.pomodorosToday >= 1 && hour >= 22) { b.nightOwl = true; addLog("🏅 ¡Medalla: Nocturno!"); }
    
    saveData();
}

// ==========================================
// TEMPORIZADORES
// ==========================================
let routineInterval, pomodoroInterval;
let routineSeconds = 20 * 60;
let currentRoutineTab = 'exercise';
let pomodoroSeconds = 25 * 60;
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
    // Saludo
    const hour = new Date().getHours();
    let greeting = "¡Bienvenido!";
    if (hour < 12) greeting = "Buenos días";
    else if (hour < 20) greeting = "Buenas tardes";
    else greeting = "Buenas noches";
    document.getElementById('greeting-text').innerText = `${greeting}, ${appData.userName || 'Amigo'}! 👋`;

    document.getElementById('streak-display').innerText = `🔥 Racha: ${appData.streak} días`;
    document.getElementById('freezes-display').innerText = `🧊 Congelamientos: ${appData.freezes}`;
    
    // Medallas (Muchas más)
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    const badgesDef = [
        { id: 'firstRoutine', icon: '🥇', name: '1ra Rutina' },
        { id: 'streak3', icon: '🔥', name: '3 Días' },
        { id: 'streak7', icon: '🏆', name: '7 Días' },
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
}

// ==========================================
// INICIALIZACIÓN Y EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema guardado
    if (appData.theme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle-btn').innerText = '🌙';
    }

    // Verificar si ya hay nombre
    if (!appData.userName) {
        document.getElementById('welcome-modal').classList.remove('hidden');
    } else {
        document.getElementById('welcome-modal').classList.add('hidden');
    }

    createPetals();
    setDailyMotivation();
    checkStreak();
    updateUI();

    // Eventos Modal
    document.getElementById('save-name-btn').addEventListener('click', () => {
        const name = document.getElementById('name-input').value.trim();
        if(name) {
            appData.userName = name;
            saveData();
            document.getElementById('welcome-modal').classList.add('hidden');
            updateUI();
        }
    });

    // Evento Toggle Theme
    document.getElementById('theme-toggle-btn').addEventListener('click', (e) => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            appData.theme = 'light';
            e.target.innerText = '🌙';
        } else {
            appData.theme = 'dark';
            e.target.innerText = '☀️';
        }
        saveData();
    });

    // Eventos Rutina
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

    // Eventos Pomodoro
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