// DOM Elements
const app = document.getElementById('app');
const adminModal = document.getElementById('adminModal');
const adminPinInput = document.getElementById('adminPinInput');
const authError = document.getElementById('authError');
const adminTrigger = document.getElementById('adminTrigger');

// State
const ADMIN_PIN = "1962684120112026";
let isAdmin = false;
let currentDate = new Date(); // Track currently viewed date for matches

// Initialize Data
const data = {
    leagues: JSON.parse(localStorage.getItem('leagues')) || [],
    teams: JSON.parse(localStorage.getItem('teams')) || [],
    matches: JSON.parse(localStorage.getItem('matches')) || [],
    news: JSON.parse(localStorage.getItem('news')) || []
};

function saveData() {
    localStorage.setItem('leagues', JSON.stringify(data.leagues));
    localStorage.setItem('teams', JSON.stringify(data.teams));
    localStorage.setItem('matches', JSON.stringify(data.matches));
    localStorage.setItem('news', JSON.stringify(data.news));
}

// Navigation
function switchTab(tab) {
    // Update Active Nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    // Render Content
    if (tab === 'home') renderHome();
    else if (tab === 'leagues') renderLeagues();
    else if (tab === 'favorites') renderFavorites();
    else if (tab === 'standings') renderStandings();
    else if (tab === 'stats') renderStats();
}

// Admin Auth
adminTrigger.addEventListener('click', () => {
    adminModal.style.display = 'flex';
});

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    authError.textContent = '';
    adminPinInput.value = '';
}

function verifyAdmin() {
    const pin = adminPinInput.value;
    if (pin === ADMIN_PIN) {
        isAdmin = true;
        closeModal('adminModal');
        renderAdminDashboard();
    } else {
        authError.textContent = 'رمز خاطئ، حاول مرة أخرى';
    }
}

// Rendering Functions
function renderHome() {
    const dateStr = currentDate.toISOString().split('T')[0];
    const displayDate = currentDate.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Filter matches for the selected date
    const todaysMatches = data.matches.filter(m => m.date && m.date.startsWith(dateStr));

    app.innerHTML = `
        <!-- News Ticker -->
        <div class="news-ticker-container">
            <div class="news-ticker">
                ${data.news.map(n => `<span class="news-item">🔴 ${n.text}</span>`).join(' &nbsp;&nbsp;&nbsp; ')}
            </div>
        </div>

        <div class="section-title">
            <h2>مباريات</h2>
        </div>

        <div class="date-nav">
            <button class="date-arrow" onclick="changeDate(-1)"><i class="fa-solid fa-chevron-right"></i></button>
            <span class="current-date">${displayDate}</span>
            <button class="date-arrow" onclick="changeDate(1)"><i class="fa-solid fa-chevron-left"></i></button>
        </div>
        
        ${todaysMatches.length === 0 ? '<p class="empty-state" style="text-align:center; padding:2rem; color:var(--text-muted)">لا توجد مباريات في هذا اليوم</p>' : ''}
        
        <div class="matches-list">
            ${todaysMatches.map((match, index) => {
        // Find actual indices in the main array for linking
        const realIndex = data.matches.indexOf(match);
        return `
                <div class="match-card glass-card" onclick="openMatchDetails(${realIndex})" style="cursor:pointer">
                    <div class="team-info">
                        <img src="${match.homeTeamLogo || 'https://placehold.co/40'}" class="team-logo">
                        <span>${match.homeTeam}</span>
                    </div>
                    <div class="match-center" style="display:flex; flex-direction:column; align-items:center;">
                        <span class="match-score">${match.homeScore} - ${match.awayScore}</span>
                        <span class="match-status" style="font-size:0.8rem; color:var(--text-muted)">${match.status}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted)">${new Date(match.date).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="team-info">
                        <img src="${match.awayTeamLogo || 'https://placehold.co/40'}" class="team-logo">
                        <span>${match.awayTeam}</span>
                    </div>
                </div>
            `;
    }).join('')}
        </div>
    `;
}

function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    renderHome();
}

function renderLeagues() {
    app.innerHTML = `
        <h2>البطولات</h2>
        <div class="grid-list">
             ${data.leagues.map(l => `
                <div class="glass-card">
                    <img src="${l.image || 'https://placehold.co/60'}" style="width:60px;height:60px;border-radius:50%;margin-bottom:0.5rem">
                    <h3>${l.name}</h3>
                    <p style="color:var(--primary)">${l.ageGroup || 'أكابر'}</p>
                    <p>${l.type === 'cup' ? 'كأس' : 'دوري'}</p>
                </div>
             `).join('')}
        </div>
    `;
}

function renderFavorites() {
    app.innerHTML = `<h2 style="text-align:center; margin-top:2rem">المفضلة</h2><p style="text-align:center; color:var(--text-muted)">قريباً...</p>`;
}

function renderStandings() {
    app.innerHTML = `<h2>جدول الترتيب</h2>`;

    // Group matches by League
    const leaguesMap = {};
    data.leagues.forEach(l => {
        if (l.type === 'league') leaguesMap[l.name] = { ...l, teams: {} };
    });

    // Calculate Points
    data.matches.forEach(m => {
        if (m.status === 'منتهية' && leaguesMap[m.league]) {
            const league = leaguesMap[m.league];

            // Init teams if not present
            if (!league.teams[m.homeTeam]) league.teams[m.homeTeam] = { name: m.homeTeam, p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };
            if (!league.teams[m.awayTeam]) league.teams[m.awayTeam] = { name: m.awayTeam, p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };

            const ht = league.teams[m.homeTeam];
            const at = league.teams[m.awayTeam];

            ht.p++; at.p++;
            ht.gf += m.homeScore; ht.ga += m.awayScore;
            at.gf += m.awayScore; at.ga += m.homeScore;

            if (m.homeScore > m.awayScore) {
                ht.w++; ht.pts += 2;
                at.l++;
            } else if (m.homeScore < m.awayScore) {
                at.w++; at.pts += 2;
                ht.l++;
            } else {
                ht.d++; ht.pts += 1;
                at.d++; at.pts += 1;
            }
        }
    });

    // Render Tables
    Object.values(leaguesMap).forEach(league => {
        const sortedTeams = Object.values(league.teams).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));

        const tableRows = sortedTeams.map((t, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${t.name}</td>
                <td>${t.p}</td>
                <td>${t.pts}</td>
            </tr>
        `).join('');

        app.innerHTML += `
            <div class="glass-card" style="margin-bottom:1rem;">
                <h3>${league.name} <span style="font-size:0.8rem;color:var(--text-muted)">(${league.ageGroup || 'أكابر'})</span></h3>
                <table style="width:100%; text-align:center; color:#fff">
                    <thead><tr><th>#</th><th>الفريق</th><th>لعب</th><th>نقاط</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    });
}

function renderStats() {
    app.innerHTML = `<h2>الإحصائيات (الهدافين)</h2>`;
    const scorers = {};

    data.matches.forEach(m => {
        if (m.events) {
            m.events.forEach(ev => {
                if (ev.type === 'goal') {
                    scorers[ev.player] = (scorers[ev.player] || 0) + 1;
                }
            });
        }
    });

    const sortedScorers = Object.entries(scorers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10

    app.innerHTML += `
        <div class="glass-card">
            <table style="width:100%; text-align:center; color:#fff">
                <thead><tr><th>#</th><th>اللاعب</th><th>أهداف</th></tr></thead>
                <tbody>
                    ${sortedScorers.map(([name, goals], i) => `<tr><td>${i + 1}</td><td>${name}</td><td>${goals}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Global Match Details Modal
function openMatchDetails(index) {
    const m = data.matches[index];
    const detailsHtml = `
        <div class="glass-card">
            <h2>تفاصيل المباراة</h2>
            <div style="text-align:center; margin:1rem">
                <h1>${m.homeScore} - ${m.awayScore}</h1>
                <p><strong>${m.homeTeam}</strong> vs <strong>${m.awayTeam}</strong></p>
                <p>${m.league} (${new Date(m.date).toLocaleString('ar-DZ')})</p>
            </div>
            
            <div style="display:flex; gap:1rem; border-top:1px solid #333; padding-top:1rem">
                <div style="flex:1">
                    <h4>تشكيلة ${m.homeTeam}</h4>
                    <ul>${(m.lineups?.home || []).map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
                <div style="flex:1">
                    <h4>تشكيلة ${m.awayTeam}</h4>
                    <ul>${(m.lineups?.away || []).map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
            </div>

            <div style="margin-top:1rem">
                <h4>أحداث المباراة</h4>
                <ul>
                    ${(m.events || []).map(e => `<li>⚽ ${e.player} (${e.team})</li>`).join('')}
                </ul>
            </div>
             <button class="btn btn-secondary" onclick="closeMatchDetails()">إغلاق</button>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'matchDetailsOverlay';
    overlay.className = 'modal';
    overlay.style.display = 'flex';
    overlay.innerHTML = `<div class="modal-content" style="max-height:80vh; overflow-y:auto">${detailsHtml}</div>`;
    document.body.appendChild(overlay);
}

window.closeMatchDetails = function () {
    document.getElementById('matchDetailsOverlay').remove();
}

// --- Admin Dashboard Rendering ---

function renderAdminDashboard() {
    app.innerHTML = `
        <div class="glass-card admin-card">
            <div class="admin-header">
                <h2>لوحة تحكم المشرف</h2>
                <div class="admin-controls">
                    <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('matches')">المباريات</button>
                    <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('leagues')">البطولات</button>
                    <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('teams')">الفرق</button>
                    <button class="btn btn-secondary btn-sm" onclick="switchAdminTab('news')">الأخبار</button>
                    <button class="btn btn-danger btn-sm" onclick="location.reload()">خروج</button>
                </div>
            </div>
            
            <div id="adminContent" class="admin-content">
                <!-- Dynamic Content Here -->
            </div>
        </div>
    `;
    switchAdminTab('matches');
}

function switchAdminTab(tab) {
    const container = document.getElementById('adminContent');
    if (tab === 'matches') renderAdminMatches(container);
    if (tab === 'leagues') renderAdminLeagues(container);
    if (tab === 'teams') renderAdminTeams(container);
    if (tab === 'news') renderAdminNews(container);
}

// --- News Management ---
function renderAdminNews(container) {
    container.innerHTML = `
        <h3>إدارة الأخبار</h3>
        <div class="input-group">
            <input type="text" id="newsInput" placeholder="اكتب الخبر العاجل هنا...">
            <button class="btn btn-primary" onclick="addNews()">نشر</button>
        </div>
        <div class="matches-list">
            ${data.news.map((n, i) => `
                <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center">
                    <span>${n.text}</span>
                    <button class="btn btn-danger btn-sm" onclick="deleteNews(${i})">حذف</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addNews() {
    const text = document.getElementById('newsInput').value;
    if (text) {
        data.news.unshift({ text, date: new Date().toISOString() });
        saveData();
        switchAdminTab('news');
    }
}

function deleteNews(index) {
    data.news.splice(index, 1);
    saveData();
    switchAdminTab('news');
}

// --- Matches Management ---
function renderAdminMatches(container) {
    container.innerHTML = `
        <h3>إدارة المباريات</h3>
        <div class="input-group">
            <button class="btn btn-primary" onclick="renderAddMatchForm()">+ جدولة مباراة جديدة</button>
        </div>
        <div class="matches-list">
            ${data.matches.map((match, index) => `
                <div class="match-card">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span>${match.date ? new Date(match.date).toLocaleDateString('ar-DZ') : ''}</span>
                        <strong>${match.homeTeam}</strong> vs <strong>${match.awayTeam}</strong>
                        <span style="color:var(--primary)">(${match.homeScore} - ${match.awayScore})</span>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-sm" onclick="editMatchScore(${index})">تعديل</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMatch(${index})">حذف</button>
                    </div>
                </div>
            `).join('')}
        </div>
`;
}

function renderAddMatchForm() {
    const container = document.getElementById('adminContent');
    const teamsOptions = data.teams.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

    container.innerHTML = `
        <h3>جدولة مباراة</h3>
        <div class="form-container">
            <div class="input-group">
                <label>الفريق المستضيف</label>
                <select id="newMatchHome">${teamsOptions}</select>
            </div>
            <div class="input-group">
                <label>الفريق الضيف</label>
                <select id="newMatchAway">${teamsOptions}</select>
            </div>
            <div class="input-group">
                <label>تاريخ المباراة</label>
                <input type="datetime-local" id="newMatchDate">
            </div>
            <div class="input-group">
                <label>البطولة</label>
                <select id="newMatchLeague">
                    <option value="friendly">مباراة ودية</option>
                    ${data.leagues.map(l => `<option value="${l.name}">${l.name}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="submitNewMatch()">حفظ المباراة</button>
            <button class="btn btn-secondary" onclick="switchAdminTab('matches')">إلغاء</button>
        </div>
`;
}

function submitNewMatch() {
    const home = document.getElementById('newMatchHome').value;
    const away = document.getElementById('newMatchAway').value;
    const date = document.getElementById('newMatchDate').value;
    const league = document.getElementById('newMatchLeague').value;

    if (home === away) return alert('لا يمكن اختيار نفس الفريق!');

    const homeTeamData = data.teams.find(t => t.name === home);
    const awayTeamData = data.teams.find(t => t.name === away);

    data.matches.push({
        homeTeam: home,
        homeTeamLogo: homeTeamData ? homeTeamData.logo : null,
        awayTeam: away,
        awayTeamLogo: awayTeamData ? awayTeamData.logo : null,
        homeScore: 0,
        awayScore: 0,
        date: date,
        league: league,
        status: 'مجدولة'
    });
    saveData();
    switchAdminTab('matches');
}

// --- Match editing with Events & Lineups ---
function editMatchScore(index) {
    const m = data.matches[index];

    // Players lists
    const ht = data.teams.find(t => t.name === m.homeTeam);
    const at = data.teams.find(t => t.name === m.awayTeam);

    // Use safe access just in case teams were deleted
    const homePlayers = ht ? ht.players : [];
    const awayPlayers = at ? at.players : [];

    const overlay = document.createElement('div');
    overlay.id = 'editMatchOverlay';
    overlay.className = 'modal';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
        <div class="modal-content glass-card" style="width:90%; max-width:600px; max-height:90vh; overflow-y:auto">
            <h3>تعديل المباراة: ${m.homeTeam} vs ${m.awayTeam}</h3>
            
            <div style="margin-bottom:1rem; border-bottom:1px solid #444; padding-bottom:1rem">
                <label>الحالة:</label>
                <select id="editStatus">
                    <option value="مجدولة" ${m.status === 'مجدولة' ? 'selected' : ''}>مجدولة</option>
                    <option value="جارية" ${m.status === 'جارية' ? 'selected' : ''}>جارية</option>
                    <option value="منتهية" ${m.status === 'منتهية' ? 'selected' : ''}>منتهية</option>
                </select>
                <h2 style="text-align:center; color:var(--primary)">${m.homeScore} - ${m.awayScore}</h2>
                <small style="display:block; text-align:center">يتم تحديث النتيجة تلقائياً مع الأحداث</small>
            </div>

            <div style="display:flex; justify-content:space-between">
                <div style="width:48%">
                    <h4>${m.homeTeam}</h4>
                    <button class="btn btn-secondary btn-sm" onclick="addEvent('${m.homeTeam}', ${index})">+ هدف</button>
                    <!-- Lineup UI could be simpler for this demo -->
                </div>
                <div style="width:48%">
                    <h4>${m.awayTeam}</h4>
                    <button class="btn btn-secondary btn-sm" onclick="addEvent('${m.awayTeam}', ${index})">+ هدف</button>
                </div>
            </div>

            <div id="eventsList" style="margin-top:1rem">
                <h5>سجل الأهداف</h5>
                ${(m.events || []).map((e, ei) => `
                    <div style="display:flex; justify-content:space-between; background:#333; padding:5px; margin-bottom:5px; border-radius:4px">
                        <span>⚽ ${e.player} (${e.team})</span>
                        <button style="background:red; color:#fff; border:none; cursor:pointer" onclick="removeEvent(${index}, ${ei})">X</button>
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-primary" style="margin-top:1rem" onclick="saveMatchEdit(${index})">حفظ وإغلاق</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.addEvent = function (teamName, matchIndex) {
    const player = prompt(`اسم اللاعب المسجل لـ ${teamName}:`);
    if (player) {
        const m = data.matches[matchIndex];
        if (!m.events) m.events = [];
        m.events.push({ type: 'goal', player: player, team: teamName });

        // Auto update score
        if (teamName === m.homeTeam) m.homeScore++;
        else m.awayScore++;

        saveData();
        document.getElementById('editMatchOverlay').remove();
        editMatchScore(matchIndex);
    }
}

window.removeEvent = function (matchIndex, eventIndex) {
    const m = data.matches[matchIndex];
    const ev = m.events[eventIndex];

    // Revert score
    if (ev.type === 'goal') {
        if (ev.team === m.homeTeam) m.homeScore--;
        else m.awayScore--;
    }

    m.events.splice(eventIndex, 1);
    saveData();
    document.getElementById('editMatchOverlay').remove();
    editMatchScore(matchIndex);
}

window.saveMatchEdit = function (index) {
    const m = data.matches[index];
    const status = document.getElementById('editStatus').value;
    m.status = status;
    saveData();
    document.getElementById('editMatchOverlay').remove();
    renderAdminDashboard(); // Refresh current admin view
}

function deleteMatch(index) {
    if (confirm('حذف هذه المباراة؟')) {
        data.matches.splice(index, 1);
        saveData();
        renderAdminDashboard();
    }
}

// --- Leagues & Cups Management ---
function renderAdminLeagues(container) {
    container.innerHTML = `
        <h3>البطولات والكؤوس</h3>
        <button class="btn btn-primary" onclick="renderAddLeagueForm()">+ إضافة بطولة/كأس</button>
        <div class="grid-list">
            ${data.leagues.map((l, idx) => `
                <div class="glass-card">
                    <h4>${l.name}</h4>
                    <span style="font-size:0.8rem; color:var(--primary)">${l.ageGroup || 'General'}</span>
                    <p>${l.type === 'cup' ? 'كأس (' + l.startRound + ')' : 'دوري'}</p>
                    <button class="btn btn-danger btn-sm" onclick="deleteLeague(${idx})">حذف</button>
                </div>
            `).join('')}
        </div>
`;
}

function renderAddLeagueForm() {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h3>إضافة بطولة جديدة</h3>
        <div class="input-group">
            <input type="text" id="leagueName" placeholder="اسم البطولة">
        </div>
        <div class="input-group">
            <label>الفئة العمرية</label>
            <select id="leagueAge">
                <option value="Seniors">أكابر (Seniors)</option>
                <option value="U21">U21</option>
                <option value="U20">U20</option>
                <option value="U19">U19</option>
                <option value="U18">U18</option>
                <option value="U17">U17</option>
                <option value="U16">U16</option>
                <option value="U15">U15</option>
                <option value="U14">U14</option>
                <option value="U13">U13</option>
            </select>
        </div>
        <div class="input-group">
            <label>نوع البطولة</label>
            <select id="leagueType" onchange="toggleCupOptions(this.value)">
                <option value="league">دوري</option>
                <option value="cup">كأس</option>
            </select>
        </div>
        <div class="input-group" id="cupOptions" style="display:none;">
            <label>تبدأ من:</label>
            <select id="cupStartRound">
                <option value="groups">دور المجموعات</option>
                <option value="16">دور الـ 16</option>
                <option value="8">ربع النهائي</option>
                <option value="4">نصف النهائي</option>
            </select>
        </div>
        <div class="input-group">
            <input type="text" id="leagueImage" placeholder="رابط صورة الشعار (اختياري)">
        </div>
        <button class="btn btn-primary" onclick="submitLeague()">إضافة</button>
        <button class="btn btn-secondary" onclick="switchAdminTab('leagues')">إلغاء</button>
`;
}

window.toggleCupOptions = function (val) {
    document.getElementById('cupOptions').style.display = val === 'cup' ? 'block' : 'none';
}

function submitLeague() {
    const name = document.getElementById('leagueName').value;
    const age = document.getElementById('leagueAge').value;
    const type = document.getElementById('leagueType').value;
    const startRound = document.getElementById('cupStartRound').value;
    const img = document.getElementById('leagueImage').value;

    if (!name) return alert('الاسم مطلوب');

    data.leagues.push({ name, ageGroup: age, type, startRound: type === 'cup' ? startRound : null, image: img });
    saveData();
    switchAdminTab('leagues');
}

function deleteLeague(index) {
    if (confirm('حذف البطولة؟')) {
        data.leagues.splice(index, 1);
        saveData();
        switchAdminTab('leagues');
    }
}

// --- Teams Management ---
function renderAdminTeams(container) {
    container.innerHTML = `
        <h3>الفرق</h3>
        <button class="btn btn-primary" onclick="renderAddTeamForm()">+ إضافة فريق جديد</button>
        <div class="grid-list">
            ${data.teams.map((t, idx) => `
                <div class="glass-card">
                    <img src="${t.logo || 'https://placehold.co/50'}" style="width:50px; height:50px; border-radius:50%">
                    <h4>${t.name}</h4>
                    <p>${t.players ? t.players.length : 0} لاعبين</p>
                    <button class="btn btn-danger btn-sm" onclick="deleteTeam(${idx})">حذف</button>
                    <!-- Future: Edit Team -->
                </div>
            `).join('')}
        </div>
`;
}

function renderAddTeamForm() {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h3>إضافة فريق</h3>
        <div class="input-group">
            <input type="text" id="teamName" placeholder="اسم الفريق">
        </div>
        <div class="input-group">
            <input type="text" id="teamLogo" placeholder="رابط الشعار (URL)">
        </div>
        
        <h4>اللاعبين</h4>
        <div id="playersListInput">
            <!-- Player inputs will be added here -->
        </div>
        <button class="btn btn-secondary btn-sm" onclick="addPlayerInput()">+ إضافة حقل لاعب</button>
        <br><br>
        
        <button class="btn btn-primary" onclick="submitTeam()">حفظ الفريق</button>
        <button class="btn btn-secondary" onclick="switchAdminTab('teams')">إلغاء</button>
    `;
    addPlayerInput(); // Add initial input
}

window.addPlayerInput = function () {
    const div = document.createElement('div');
    div.className = 'input-group player-input-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" placeholder="اسم اللاعب" class="p-name">
        <input type="text" placeholder="صورة (URL)" class="p-img">
    `;
    document.getElementById('playersListInput').appendChild(div);
}

function submitTeam() {
    const name = document.getElementById('teamName').value;
    const logo = document.getElementById('teamLogo').value;

    const players = [];
    document.querySelectorAll('.player-input-row').forEach(row => {
        const pName = row.querySelector('.p-name').value;
        const pImg = row.querySelector('.p-img').value;
        if (pName) players.push({ name: pName, image: pImg });
    });

    if (!name) return alert('اسم الفريق مطلوب');

    data.teams.push({ name, logo, players });
    saveData();
    switchAdminTab('teams');
}

function deleteTeam(index) {
    if (confirm('حذف الفريق؟')) {
        data.teams.splice(index, 1);
        saveData();
        switchAdminTab('teams');
    }
}

// Helper: Close Modals on outside click
window.onclick = function (event) {
    if (event.target == adminModal) {
        closeModal('adminModal');
    }
}

// Initial Render
switchTab('home');
