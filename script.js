// DOM Elements
const app = document.getElementById('app');
const adminModal = document.getElementById('adminModal');
const adminPinInput = document.getElementById('adminPinInput');
const authError = document.getElementById('authError');
const adminTrigger = document.getElementById('adminTrigger');
const searchInput = document.getElementById('searchInput');
const themeIcon = document.getElementById('themeIcon');

// State
const ADMIN_PIN = "1962684120112026";
let isAdmin = false;
let currentDate = new Date();
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize Data
const data = {
    leagues: JSON.parse(localStorage.getItem('leagues')) || [],
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    matches: JSON.parse(localStorage.getItem('matches')) || [],
    news: JSON.parse(localStorage.getItem('news')) || [],
    ads: null
};

function saveData() {
    localStorage.setItem('leagues', JSON.stringify(data.leagues));
    localStorage.setItem('teams', JSON.stringify(data.teams));
    localStorage.setItem('matches', JSON.stringify(data.matches));
    localStorage.setItem('news', JSON.stringify(data.news));
}

// --- Theme Management ---
function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeIcon.className = currentTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}
applyTheme();

// --- Background Animations ---
function initBackgroundShapes() {
    const container = document.getElementById('background-shapes');
    if (!container) return;

    // Icons: various sports balls/trophies
    const icons = ['fa-volleyball', 'fa-trophy', 'fa-medal', 'fa-shield-halved', 'fa-star'];

    for (let i = 0; i < 20; i++) {
        const shape = document.createElement('i');
        shape.className = `fa-solid ${icons[Math.floor(Math.random() * icons.length)]} floating-shape`;

        // Random Position & Animation
        shape.style.left = `${Math.random() * 100}%`;
        shape.style.animationDuration = `${10 + Math.random() * 20}s`;
        shape.style.animationDelay = `-${Math.random() * 20}s`;
        shape.style.fontSize = `${1.5 + Math.random() * 2}rem`;
        shape.style.opacity = `${0.05 + Math.random() * 0.1}`;

        container.appendChild(shape);
    }
}
initBackgroundShapes();

// --- Navigation ---
function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    // Hide search overlay if open
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) searchOverlay.remove();
    searchInput.value = '';

    if (tab === 'home') renderHome();
    else if (tab === 'leagues') renderLeagues();
    else if (tab === 'standings') renderStandings();
    else if (tab === 'stats') renderStats();
}

// --- Search ---
function handleSearch(query) {
    if (!query || query.length < 2) {
        const existing = document.getElementById('searchOverlay');
        if (existing) existing.remove();
        return;
    }

    let overlay = document.getElementById('searchOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'searchOverlay';
        overlay.className = 'search-results-overlay';
        document.body.appendChild(overlay);
    }

    const results = [];

    // Search Teams
    data.teams.forEach(t => {
        if (t.name.includes(query)) results.push({ type: 'team', data: t });
    });

    // Search Players
    data.teams.forEach(t => {
        if (t.players) {
            t.players.forEach(p => {
                if (p.name.includes(query)) results.push({ type: 'player', data: p, team: t.name });
            });
        }
    });

    // Search Leagues
    data.leagues.forEach(l => {
        if (l.name.includes(query)) results.push({ type: 'league', data: l });
    });

    overlay.innerHTML = `
        <div class="section-title">
            <h2>نتائج البحث "${query}"</h2>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('searchOverlay').remove(); searchInput.value=''">إغلاق</button>
        </div>
        ${results.map(r => {
        if (r.type === 'team') return `<div class="result-item" onclick="openTeamDetails('${r.data.name}')">🛡️ فريق: ${r.data.name}</div>`;
        if (r.type === 'league') return `<div class="result-item" onclick="switchTab('leagues')">🏆 بطولة: ${r.data.name}</div>`;
        if (r.type === 'player') return `<div class="result-item" onclick='openPlayerDetails(${JSON.stringify(r.data)}, "${r.team}")'>👤 لاعب: ${r.data.name} (${r.team})</div>`;
    }).join('')}
        ${results.length === 0 ? '<p>لا توجد نتائج</p>' : ''}
    `;
}

// --- Render Home ---
function renderHome() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const displayDate = currentDate.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const todaysMatches = data.matches.filter(m => m.date && m.date.startsWith(dateStr));
    const heroNews = data.news.filter(n => n.image);

    app.innerHTML = `
        <div class="news-ticker-container">
            <div class="news-ticker">
                ${data.news.map(n => `<span style="margin:0 20px">🔴 ${n.text}</span>`).join('')}
            </div>
        </div>

        ${heroNews.length > 0 ? `
        <div class="hero-slider">
            ${heroNews.map(n => `
                <div class="hero-slide">
                    <img src="${n.image}">
                    <div class="hero-caption"><h3>${n.text}</h3></div>
                </div>
            `).join('')}
        </div>` : ''}

        <div class="section-title"><h2>مباريات</h2></div>
        
        <div class="date-nav">
             <button class="date-arrow" onclick="changeDate(-1)"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="current-date">${displayDate}</span>
            <button class="date-arrow" onclick="changeDate(1)"><i class="fa-solid fa-chevron-left"></i></button>
        </div>

        <div class="matches-list">
            ${todaysMatches.length === 0 ? '<p style="text-align:center;color:var(--text-muted)">لا توجد مباريات في هذا اليوم</p>' : ''}
            ${todaysMatches.map((m, i) => `
                <div class="match-card glass-card" onclick="openMatchDetails(${data.matches.indexOf(m)})" style="cursor:pointer">
                    <div class="team-info">
                        <img src="${m.homeTeamLogo || 'https://placehold.co/40'}" class="team-logo" style="width:40px;height:40px;border-radius:50%">
                        <span>${m.homeTeam}</span>
                    </div>
                    <div class="match-center">
                        <span class="match-score">${m.homeScore} - ${m.awayScore}</span>
                        <div class="match-status">${m.status}</div>
                    </div>
                    <div class="team-info">
                        <img src="${m.awayTeamLogo || 'https://placehold.co/40'}" class="team-logo" style="width:40px;height:40px;border-radius:50%">
                        <span>${m.awayTeam}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function changeDate(d) {
    currentDate.setDate(currentDate.getDate() + d);
    renderHome();
}

// --- Player Profile (NEW LUXURY VIEW) ---
function openPlayerDetails(player, teamName) {
    // Hide search
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) searchOverlay.remove();

    // Calculate Age
    let age = 'N/A';
    if (player.dob) {
        const birth = new Date(player.dob);
        const diff = Date.now() - birth.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' سنة';
    }

    // Find Team Logo
    const teamObj = data.teams.find(t => t.name === teamName);
    const teamLogo = teamObj ? teamObj.logo : '';
    const dateStr = player.dob ? new Date(player.dob).toLocaleDateString('ar-DZ') : '?';

    app.innerHTML = `
        <div class="animate-in profile-view">
            <button class="btn btn-secondary btn-sm" onclick="openTeamDetails('${teamName}')" style="position:absolute;top:0;left:0">عودة للفريق</button>
            
            <div class="profile-header">
                 <div class="profile-img-container">
                    <img src="${player.image || 'https://placehold.co/150'}" class="profile-img">
                 </div>
                 <h1 class="profile-name">${player.name}</h1>
                 <div class="profile-role">لاعب كرة يد</div>
                 <div style="font-size:0.9rem;color:var(--text-muted);margin-top:10px">
                    ${player.name} (${teamName}) هو لاعب كرة يد، يلعب حالياً لصالح ${teamName} في الجزائر.
                 </div>
            </div>

            <div class="section-title"><h2>معلومات اللاعب</h2></div>

            <div class="profile-stats-grid">
                <div class="stat-box">
                    <img src="${teamLogo || 'https://placehold.co/50'}" style="width:60px;height:60px;border-radius:50%;margin-bottom:10px">
                    <span class="stat-value">${teamName}</span>
                    <span class="stat-label">النادي الحالي</span>
                </div>
                
                <div class="stat-box">
                    <i class="fa-solid fa-earth-africa stat-icon"></i>
                    <span class="stat-value">الجزائر</span>
                    <span class="stat-label">الجنسية</span>
                </div>

                <div class="stat-box">
                    <span class="stat-value" style="font-size:2.5rem;color:var(--primary)">${player.number || '-'}</span>
                    <span class="stat-label">الرقم مع النادي</span>
                </div>

                <div class="stat-box">
                    <span class="stat-value">${age}</span>
                    <span class="stat-label">${dateStr}</span>
                </div>
            </div>
        </div>
    `;
}

// --- Team Details ---
function openTeamDetails(teamName) {
    const t = data.teams.find(x => x.name === teamName);
    if (!t) return;

    // Hide search logic
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) searchOverlay.remove();

    app.innerHTML = `
        <div class="glass-card animate-in" style="text-align:center; margin-bottom:2rem; background: linear-gradient(to bottom, var(--card-bg), transparent)">
            <img src="${t.logo}" style="width:120px;height:120px;border-radius:50%; box-shadow: 0 5px 20px rgba(0,0,0,0.3); margin-top: -20px">
            <h1 style="font-size: 2.5rem; margin: 10px 0">${t.name}</h1>
            <button class="btn btn-secondary btn-sm" onclick="switchTab('home')">عودة للرئيسية</button>
        </div>
        
        <h3 style="border-bottom: 2px solid var(--primary); display:inline-block; padding-bottom:5px">قائمة اللاعبين</h3>
        <div class="grid-list">
            ${(t.players || []).map(p => `
                <div class="glass-card stat-box" onclick='openPlayerDetails(${JSON.stringify(p)}, "${t.name}")' style="cursor:pointer; padding:15px; text-align:center">
                    <img src="${p.image || 'https://placehold.co/80'}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border: 2px solid var(--border-color)">
                    <h4 style="margin:10px 0">${p.name}</h4>
                    <span style="font-size:1.5rem; color:var(--primary); font-weight:800">${p.number || '#'}</span>
                    <p style="font-size:0.8rem;color:var(--text-muted)">${p.dob || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// --- Cup Bracket View ---
function openCupView(leagueIndex) {
    const l = data.leagues[leagueIndex];
    if (l.type !== 'cup') return;

    // Ordered Rounds
    const allRounds = ['groups', '16', '8', '4', 'final'];
    const friendlyNames = { 'groups': 'دور المجموعات', '16': 'دور الـ 16', '8': 'ربع النهائي', '4': 'نصف النهائي', 'final': 'النهائي' };

    // Determine start index
    let startIdx = allRounds.indexOf(l.startRound || '16');
    if (startIdx === -1) startIdx = 1; // Default to 16

    const relevantRounds = allRounds.slice(startIdx);

    app.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center; margin-bottom:1rem">
            <div style="display:flex;align-items:center;gap:10px">
                <img src="${l.image || 'https://placehold.co/40'}" style="width:40px;height:40px;border-radius:50%">
                <h2>${l.name} - الأدوار الإقصائية</h2>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="switchTab('leagues')">عودة</button>
        </div>
        <div class="bracket-container">
             ${relevantRounds.map(r => `
                <div class="round">
                    <h4 style="text-align:center;color:var(--primary)">${friendlyNames[r]}</h4>
                    <div style="display:flex;flex-direction:column;gap:10px">
                        ${getMatchesForRound(l.name, r)}
                    </div>
                </div>
             `).join('')}
        </div>
        <p style="text-align:center;color:var(--text-muted);margin-top:2rem">ملاحظة: يتم عرض المباريات حسب الدور المحدد في إعدادات البطولة.</p>
    `;
}

// Helper to filter matches for bracket
function getMatchesForRound(leagueName, round) {
    const countMap = { 'groups': 4, '16': 8, '8': 4, '4': 2, 'final': 1 };
    const count = countMap[round] || 0;

    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="match-bracket">
            <div style="font-size:0.8rem">فريق A vs فريق B</div>
            <div>- : -</div>
        </div>`;
    }
    return html;
}

// --- Luxury Leagues List ---
function renderLeagues() {
    app.innerHTML = `<h2>البطولات</h2><div class="grid-list">
        ${data.leagues.map((l, i) => `
        <div class="league-card" onclick="${l.type === 'cup' ? `openCupView(${i})` : ''}" style="cursor:pointer; border-top: 4px solid ${l.color || 'transparent'};">
             <div style="position:absolute;top:10px;right:10px;font-size:1.5rem;opacity:0.1;z-index:0">
                <i class="fa-solid fa-trophy"></i>
             </div>
             <img src="${l.image || 'https://placehold.co/80'}" style="width:100px;height:100px;object-fit:contain;margin-bottom:15px;position:relative;z-index:1">
             <h3 style="margin:5px 0;font-size:1.2rem;position:relative;z-index:1">${l.name}</h3>
             <span class="btn btn-sm" style="background:${l.color || 'var(--primary)'};color:#fff;display:inline-block;border-radius:20px;margin-top:5px;width:auto;padding:5px 15px">
                ${l.type === 'cup' ? 'كأس' : 'دوري'}
             </span>
        </div>`).join('')}
    </div>`;
}

// --- Render Standings with Luxury Table & GF/GA ---
function renderStandings() {
    app.innerHTML = `<h2>الترتيب</h2>`;
    data.leagues.filter(l => l.type === 'league').forEach(l => {
        const teamsStats = {};
        (l.assignedTeams || []).forEach(t => teamsStats[t] = { name: t, p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 });

        data.matches.filter(m => m.league === l.name && m.status === 'منتهية').forEach(m => {
            if (!teamsStats[m.homeTeam]) teamsStats[m.homeTeam] = { name: m.homeTeam, p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };
            if (!teamsStats[m.awayTeam]) teamsStats[m.awayTeam] = { name: m.awayTeam, p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };

            const ht = teamsStats[m.homeTeam];
            const at = teamsStats[m.awayTeam];
            ht.p++; at.p++;
            ht.gf += m.homeScore; ht.ga += m.awayScore;
            at.gf += m.awayScore; at.ga += m.homeScore;

            if (m.homeScore > m.awayScore) { ht.w++; ht.pts += 2; at.l++; }
            else if (m.homeScore < m.awayScore) { at.w++; at.pts += 2; ht.l++; }
            else { ht.d++; ht.pts += 1; at.d++; at.pts += 1; }
        });

        const sorted = Object.values(teamsStats).sort((a, b) => b.pts - a.pts || (b.w - a.w) || ((b.gf - b.ga) - (a.gf - a.ga)));

        app.innerHTML += `
        <div class="glass-card animate-in" style="margin-bottom:2rem; border-top: 4px solid ${l.color || 'transparent'}">
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid var(--border-color)">
                <img src="${l.image || 'https://placehold.co/40'}" style="width:40px;height:40px;object-fit:contain">
                <h3 style="margin:0">${l.name}</h3>
            </div>
            
            <div class="luxury-table-container">
            <table class="luxury-table">
                <thead>
                    <tr>
                        <th style="width:50px">#</th>
                        <th>الفريق</th>
                        <th title="لعب">ل</th>
                        <th title="فاز">ف</th>
                        <th title="تعادل">ت</th>
                        <th title="خسر">خ</th>
                        <th title="له">له</th>
                        <th title="عليه">عليه</th>
                        <th title="الفرق">+/-</th>
                        <th title="النقاط">نقاط</th>
                    </tr>
                </thead>
                <tbody>${sorted.map((t, i) => {
            const teamObj = data.teams.find(x => x.name === t.name);
            const logo = teamObj ? teamObj.logo : '';
            const diff = t.gf - t.ga;
            const diffClass = diff > 0 ? 'diff-pos' : (diff < 0 ? 'diff-neg' : '');
            const rankClass = i < 3 ? `rank-${i + 1}` : '';
            return `
                    <tr class="${rankClass}">
                        <td><span class="rank-badge">${i + 1}</span></td>
                        <td onclick="openTeamDetails('${t.name}')" style="cursor:pointer">
                            <div class="team-cell">
                                <img src="${logo || 'https://placehold.co/30'}" style="width:30px;height:30px;border-radius:50%">
                                ${t.name}
                            </div>
                        </td>
                        <td>${t.p}</td>
                        <td>${t.w}</td>
                        <td>${t.d}</td>
                        <td>${t.l}</td>
                        <td>${t.gf}</td>
                        <td>${t.ga}</td>
                        <td><span class="stat-difference ${diffClass}">${diff > 0 ? '+' + diff : diff}</span></td>
                        <td class="pts-cell">${t.pts}</td>
                    </tr>`;
        }).join('')}</tbody>
            </table>
            </div>
        </div>`;
    });
}

function renderStats() {
    app.innerHTML = `<h2>إحصائيات الفرق واللاعبين</h2>`;

    // Top Scorers
    const scorers = {};
    const teamStats = {}; // { TeamName: { goals: 0, matches: 0 } }

    data.matches.forEach(m => {
        // Only count finished games
        if (m.status === 'منتهية') {
            // Team goals
            if (!teamStats[m.homeTeam]) teamStats[m.homeTeam] = { goals: 0, matches: 0 };
            if (!teamStats[m.awayTeam]) teamStats[m.awayTeam] = { goals: 0, matches: 0 };

            teamStats[m.homeTeam].goals += m.homeScore;
            teamStats[m.homeTeam].matches += 1;
            teamStats[m.awayTeam].goals += m.awayScore;
            teamStats[m.awayTeam].matches += 1;
        }

        // Scorers (from events)
        (m.events || []).forEach(e => {
            if (e.type === 'goal' && e.player) scorers[e.player] = (scorers[e.player] || 0) + 1;
        });
    });

    const sortedScorers = Object.entries(scorers).sort(([, a], [, b]) => b - a).slice(0, 10);
    const topTeams = Object.entries(teamStats).sort(([, a], [, b]) => b.goals - a.goals).slice(0, 5);

    app.innerHTML += `
    <div class="grid-list">
        <div class="glass-card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;border-bottom:1px solid var(--border-color);padding-bottom:10px">
                <i class="fa-solid fa-futbol" style="font-size:1.5rem;color:var(--primary)"></i>
                <h3 style="margin:0">هدافي البطولة</h3>
            </div>
            <table class="luxury-table">
                <tbody>
                ${sortedScorers.length === 0 ? '<tr><td>لا توجد بيانات</td></tr>' : sortedScorers.map(([n, g], i) => `
                    <tr>
                        <td style="width:30px;font-weight:bold;color:var(--primary)">${i + 1}</td>
                        <td>${n}</td>
                        <td style="font-weight:bold;text-align:left">${g} ⚽</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="glass-card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;border-bottom:1px solid var(--border-color);padding-bottom:10px">
                <i class="fa-solid fa-shield-cat" style="font-size:1.5rem;color:var(--primary)"></i>
                <h3 style="margin:0">أقوى هجوم</h3>
            </div>
            <table class="luxury-table">
                <tbody>
                ${topTeams.length === 0 ? '<tr><td>لا توجد بيانات</td></tr>' : topTeams.map(([team, stats], i) => `
                    <tr>
                        <td style="width:30px;font-weight:bold;color:var(--primary)">${i + 1}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:5px">
                                ${team} 
                                <span style="font-size:0.7rem;color:var(--text-muted)">(${stats.matches} م)</span>
                            </div>
                        </td>
                        <td style="font-weight:bold;text-align:left">${stats.goals} ⚽</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

function openMatchDetails(idx) {
    const m = data.matches[idx];
    app.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="switchTab('home')" style="margin-bottom:1rem">عودة</button>
        <div class="glass-card" style="text-align:center">
             <h2>${m.league || 'مباراة ودية'}</h2>
             <div style="display:flex;justify-content:space-around;align-items:center;margin:2rem 0">
                <div>
                    <img src="${m.homeTeamLogo}" style="width:60px;height:60px;border-radius:50%">
                    <h3>${m.homeTeam}</h3>
                </div>
                <div>
                    <h1 style="font-size:3rem">${m.homeScore} - ${m.awayScore}</h1>
                    <span style="color:var(--primary);font-weight:bold">${m.status}</span>
                </div>
                <div>
                     <img src="${m.awayTeamLogo}" style="width:60px;height:60px;border-radius:50%">
                    <h3>${m.awayTeam}</h3>
                </div>
             </div>
        </div>
        <!-- Events List could go here -->
    `;
}

// --- ADMIN ---
adminTrigger.onclick = () => adminModal.style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.verifyAdmin = function () {
    if (adminPinInput.value === ADMIN_PIN) {
        isAdmin = true;
        closeModal('adminModal');
        renderAdmin();
    } else {
        authError.textContent = 'خطأ';
        adminPinInput.style.borderColor = 'red';
    }
}

// Admin Dashboard (LUXURY GRID)
function renderAdmin() {
    app.innerHTML = `
        <div class="glass-card animate-in" style="margin-bottom:2rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem">
                <h2 style="margin:0;color:var(--text-color)">لوحة التحكم</h2>
                <button class="btn btn-sm btn-danger" style="width:auto" onclick="location.reload()">خروج</button>
            </div>
            
            <div class="admin-dashboard-grid">
                <div class="admin-card" onclick="renderAdminMatches()">
                    <i class="fa-solid fa-futbol"></i>
                    <span>المباريات</span>
                </div>
                <div class="admin-card" onclick="renderAdminTeams()">
                    <i class="fa-solid fa-users"></i>
                    <span>الفرق</span>
                </div>
                <div class="admin-card" onclick="renderAdminLeagues()">
                    <i class="fa-solid fa-trophy"></i>
                    <span>البطولات</span>
                </div>
                <div class="admin-card" onclick="renderAdminNews()">
                    <i class="fa-solid fa-newspaper"></i>
                    <span>الأخبار</span>
                </div>
            </div>
            
            <div id="adminPanelContent" style="margin-top:2rem">
                <p style="text-align:center;color:var(--text-muted)">اختر قسماً من الأعلى لإدارته</p>
            </div>
        </div>
    `;
}

// Admin - Leagues (Edit & Images)
window.renderAdminLeagues = function () {
    document.getElementById('adminPanelContent').innerHTML = `
        <h3>البطولات</h3>
        <button class="btn btn-primary" onclick="renderEditLeagueForm(-1)">+ إضافة بطولة</button>
        <div class="grid-list" style="margin-top:1rem">
             ${data.leagues.map((l, i) => `
                <div class="glass-card" style="border-bottom: 3px solid ${l.color || '#fff'}">
                    <h4>${l.name}</h4>
                    <span style="font-size:0.8rem">${l.type}</span>
                    <div style="margin-top:5px">
                        <button class="btn btn-sm btn-secondary" onclick="renderEditLeagueForm(${i})">تعديل</button>
                        <button class="btn btn-sm btn-secondary" onclick="manageLeagueTeams(${i})">الفرق</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLeague(${i})">حذف</button>
                    </div>
                </div>
             `).join('')}
        </div>
    `;
}

window.renderEditLeagueForm = function (index) {
    const isEdit = index >= 0;
    const l = isEdit ? data.leagues[index] : { name: '', color: '#e63946', type: 'league', image: '', startRound: '16' };

    document.getElementById('adminPanelContent').innerHTML = `
        <h3>${isEdit ? 'تعديل بطولة' : 'إضافة بطولة'}</h3>
        <div class="input-group">
            <label>اسم البطولة</label>
            <input id="lName" value="${l.name}">
        </div>
        <div class="input-group">
            <label>لون البطولة</label>
            <input id="lColor" type="color" value="${l.color}" style="height:40px">
        </div>
        <div class="input-group">
            <label>صورة البطولة (رابط)</label>
            <input id="lImage" value="${l.image || ''}" placeholder="https://example.com/logo.png">
        </div>
        <div class="input-group">
            <label>النوع</label>
            <select id="lType" onchange="toggleCupOptions(this.value)">
                <option value="league" ${l.type === 'league' ? 'selected' : ''}>دوري</option>
                <option value="cup" ${l.type === 'cup' ? 'selected' : ''}>كأس</option>
            </select>
        </div>
        <div class="input-group" id="cupOptions" style="display:${l.type === 'cup' ? 'block' : 'none'}">
            <label>بداية الكأس من:</label>
            <select id="lStartRound">
                <option value="groups" ${l.startRound === 'groups' ? 'selected' : ''}>دور المجموعات</option>
                <option value="16" ${l.startRound === '16' || !l.startRound ? 'selected' : ''}>دور الـ 16</option>
                <option value="8" ${l.startRound === '8' ? 'selected' : ''}>ربع النهائي</option>
                <option value="4" ${l.startRound === '4' ? 'selected' : ''}>نصف النهائي</option>
            </select>
        </div>
        <button class="btn btn-primary" onclick="saveLeague(${index})">حفظ</button>
        <button class="btn btn-secondary" onclick="renderAdminLeagues()">إلغاء</button>
    `;
}

window.toggleCupOptions = function (val) {
    document.getElementById('cupOptions').style.display = val === 'cup' ? 'block' : 'none';
}

window.saveLeague = function (index) {
    const name = document.getElementById('lName').value;
    const color = document.getElementById('lColor').value;
    const image = document.getElementById('lImage').value;
    const type = document.getElementById('lType').value;
    const startRound = document.getElementById('lStartRound').value;

    if (!name) return alert('الاسم مطلوب');

    const leagueData = {
        name, color, image, type, startRound,
        assignedTeams: index >= 0 ? data.leagues[index].assignedTeams : []
    };

    if (index >= 0) {
        data.leagues[index] = leagueData;
    } else {
        data.leagues.push(leagueData);
    }
    saveData();
    renderAdminLeagues();
}
window.deleteLeague = function (i) {
    if (confirm('حذف البطولة؟')) {
        data.leagues.splice(i, 1);
        saveData();
        renderAdminLeagues();
    }
}
window.manageLeagueTeams = function (leagueIndex) {
    const l = data.leagues[leagueIndex];
    const assigned = new Set(l.assignedTeams || []);

    const overlay = document.createElement('div');
    overlay.id = 'leagueTeamsOverlay';
    overlay.className = 'modal';
    overlay.style.display = 'flex';

    const teamsListHtml = data.teams.map(t => {
        const isChecked = assigned.has(t.name) ? 'checked' : '';
        return `
            <label style="display:flex;align-items:center;padding:5px;cursor:pointer">
                <input type="checkbox" value="${t.name}" ${isChecked} class="league-team-checkbox" style="width:20px;height:20px;margin-left:10px">
                <img src="${t.logo}" style="width:20px;height:20px;border-radius:50%;margin-left:5px">
                ${t.name}
            </label>
        `;
    }).join('');

    overlay.innerHTML = `
        <div class="modal-content glass-card">
            <h3>فرق: ${l.name}</h3>
            <div style="max-height:300px;overflow-y:auto;text-align:right">
                ${teamsListHtml}
            </div>
            <button class="btn btn-primary" style="margin-top:1rem" onclick="saveLeagueTeams(${leagueIndex})">حفظ</button>
            <button class="btn btn-secondary" style="margin-top:0.5rem" onclick="document.getElementById('leagueTeamsOverlay').remove()">إلغاء</button>
        </div>
    `;
    document.body.appendChild(overlay);
}
window.saveLeagueTeams = function (idx) {
    const checkboxes = document.querySelectorAll('.league-team-checkbox:checked');
    data.leagues[idx].assignedTeams = Array.from(checkboxes).map(cb => cb.value);
    saveData();
    document.getElementById('leagueTeamsOverlay').remove();
    alert('تم تحديث الفرق');
}

// Admin - News
window.renderAdminNews = function () {
    document.getElementById('adminPanelContent').innerHTML = `
        <h3>إدارة الأخبار</h3>
        <div class="input-group">
            <input type="text" id="newsInput" placeholder="اكتب الخبر...">
            <input type="text" id="newsImageInput" placeholder="رابط صورة (اختياري)" style="margin-top:5px">
            <button class="btn btn-primary" onclick="addNews()" style="margin-top:5px">نشر</button>
        </div>
        <div class="matches-list">
            ${data.news.map((n, i) => `
                <div class="glass-card" style="display:flex;justify-content:space-between;align-items:center">
                    <div style="display:flex;align-items:center;gap:10px">
                        ${n.image ? `<img src="${n.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px">` : ''}
                        <span>${n.text}</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteNews(${i})">X</button>
                </div>
            `).join('')}
        </div>
    `;
}
window.addNews = function () {
    const text = document.getElementById('newsInput').value;
    const image = document.getElementById('newsImageInput').value;
    if (text) {
        data.news.unshift({ text, image, date: new Date().toISOString() });
        saveData();
        renderAdminNews();
    }
}
window.deleteNews = function (i) { data.news.splice(i, 1); saveData(); renderAdminNews(); }


// Admin - Teams (Existing)
window.renderAdminTeams = function () {
    document.getElementById('adminPanelContent').innerHTML = `
        <h3>الفرق</h3>
        <button class="btn btn-primary" onclick="renderEditTeamForm(-1)">+ إضافة فريق</button>
        <div class="grid-list">
            ${data.teams.map((t, i) => `
                <div class="glass-card">
                    <h4>${t.name}</h4>
                    <button class="btn btn-sm btn-secondary" onclick="renderEditTeamForm(${i})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeam(${i})">حذف</button>
                </div>
            `).join('')}
        </div>
     `;
}

window.renderEditTeamForm = function (index) {
    const isEdit = index >= 0;
    const team = isEdit ? data.teams[index] : { name: '', logo: '', players: [] };

    document.getElementById('adminPanelContent').innerHTML = `
        <h3>${isEdit ? 'تعديل فريق' : 'إضافة فريق'}</h3>
        <input type="text" id="tName" placeholder="اسم الفريق" value="${team.name}">
        <input type="text" id="tLogo" placeholder="شعار الفريق" value="${team.logo}">
        
        <h4>اللاعبين</h4>
        <div id="playersEditList"></div>
        <button class="btn btn-sm btn-secondary" onclick="addPlayerField()">+ لاعب</button>
        
        <button class="btn btn-primary" onclick="saveTeam(${index})">حفظ</button>
        <button class="btn btn-secondary" onclick="renderAdminTeams()">إلغاء</button>
    `;

    const list = document.getElementById('playersEditList');
    if (team.players && team.players.length > 0) {
        team.players.forEach(p => addPlayerField(p));
    } else {
        addPlayerField();
    }
}

window.addPlayerField = function (p = null) {
    const div = document.createElement('div');
    div.className = 'glass-card';
    div.style.padding = '10px';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <input class="p-name" placeholder="الاسم" value="${p ? p.name : ''}" style="width:40%">
        <input class="p-num" placeholder="#" type="number" value="${p ? p.number || '' : ''}" style="width:15%">
        <input class="p-dob" placeholder="مواليد" value="${p ? p.dob || '' : ''}" style="width:20%">
        <input class="p-img" placeholder="صورة" value="${p ? p.image || '' : ''}" style="width:20%">
    `;
    document.getElementById('playersEditList').appendChild(div);
}

window.saveTeam = function (index) {
    const name = document.getElementById('tName').value;
    const logo = document.getElementById('tLogo').value;
    const pDivs = document.querySelectorAll('#playersEditList > div');

    const players = [];
    pDivs.forEach(div => {
        const n = div.querySelector('.p-name').value;
        if (n) {
            players.push({
                name: n,
                number: div.querySelector('.p-num').value,
                dob: div.querySelector('.p-dob').value,
                image: div.querySelector('.p-img').value
            });
        }
    });

    if (index >= 0) {
        data.teams[index] = { name, logo, players };
    } else {
        data.teams.push({ name, logo, players });
    }
    saveData();
    renderAdminTeams();
}

window.deleteTeam = function (i) {
    if (confirm('حذف؟')) {
        data.teams.splice(i, 1);
        saveData();
        renderAdminTeams();
    }
}

// Admin - Matches (Existing Quick Score)
window.renderAdminMatches = function () {
    document.getElementById('adminPanelContent').innerHTML = `
        <button class="btn btn-primary" onclick="renderAddMatch()">+ مباراة</button>
        <div class="matches-list">
            ${data.matches.map((m, i) => `
                <div class="match-card glass-card">
                    <span>${m.homeTeam} vs ${m.awayTeam}</span>
                    <strong>${m.homeScore} - ${m.awayScore}</strong>
                    <div>
                        <button class="btn btn-sm btn-secondary" onclick="quickEditMatch(${i})">إدارة</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMatch(${i})">حذف</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
window.quickEditMatch = function (i) {
    const m = data.matches[i];
    const overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);

    const renderContent = () => {
        overlay.innerHTML = `
            <div class="modal-content glass-card">
                <h3>لوحة النتيجة السريعة</h3>
                <div style="display:flex; justify-content:space-around; align-items:center; margin: 20px 0;">
                    <div>
                        <h4>${m.homeTeam}</h4>
                        <h1 style="font-size:2rem">${m.homeScore}</h1>
                        <button class="btn btn-success btn-sm" onclick="quickScore(${i}, 'home', 1)">+1</button>
                    </div>
                    <div>
                        <h4>${m.awayTeam}</h4>
                        <h1 style="font-size:2rem">${m.awayScore}</h1>
                        <button class="btn btn-success btn-sm" onclick="quickScore(${i}, 'away', 1)">+1</button>
                    </div>
                </div>
                <select onchange="updateMatchStatus(${i}, this.value)">
                    <option value="مجدولة" ${m.status === 'مجدولة' ? 'selected' : ''}>مجدولة</option>
                    <option value="جارية" ${m.status === 'جارية' ? 'selected' : ''}>جارية</option>
                    <option value="منتهية" ${m.status === 'منتهية' ? 'selected' : ''}>منتهية</option>
                </select>
                <div style="margin-top:1rem">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); renderAdminMatches()">إغلاق</button>
                </div>
            </div>
        `;
    };

    window.quickScore = (idx, team, delta) => {
        if (team === 'home') data.matches[idx].homeScore += delta;
        else data.matches[idx].awayScore += delta;
        saveData();
        renderHome();
        renderContent();
    };
    window.updateMatchStatus = (idx, val) => {
        data.matches[idx].status = val;
        saveData();
    };
    renderContent();
}

window.renderAddMatch = function () {
    // Basic Add Match UI
    document.getElementById('adminPanelContent').innerHTML = `
        <h3>إضافة مباراة</h3>
        <select id="mHome">${data.teams.map(t => `<option>${t.name}</option>`)}</select>
        <span style="display:block;text-align:center;margin:5px">ضد</span>
        <select id="mAway">${data.teams.map(t => `<option>${t.name}</option>`)}</select>
        
        <select id="mLeague" style="margin-top:10px">
            ${data.leagues.map(l => `<option>${l.name}</option>`)}
            <option>مباراة ودية</option>
        </select>
        <input type="date" id="mDate" style="margin-top:10px">
        
        <button class="btn btn-primary" onclick="saveMatch()">حفظ</button>
        <button class="btn btn-secondary" onclick="renderAdminMatches()">إلغاء</button>
    `;
}

window.saveMatch = function () {
    const home = document.getElementById('mHome').value;
    const away = document.getElementById('mAway').value;
    const league = document.getElementById('mLeague').value;
    const date = document.getElementById('mDate').value;

    if (home === away) return alert('لا يمكن اختيار نفس الفريق');

    const hLogo = data.teams.find(t => t.name === home)?.logo;
    const aLogo = data.teams.find(t => t.name === away)?.logo;

    data.matches.push({
        homeTeam: home, awayTeam: away,
        homeTeamLogo: hLogo, awayTeamLogo: aLogo,
        homeScore: 0, awayScore: 0,
        league: league, date: date,
        status: 'مجدولة', events: []
    });
    saveData();
    renderAdminMatches();
}

window.deleteMatch = function (i) { data.matches.splice(i, 1); saveData(); renderAdminMatches(); }


// Init
switchTab('home');
