// 用戶兌換頁面 JavaScript

// HTML 轉義函數 - 防止 XSS 攻擊
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 全域變數
let currentEmail = '';
let currentCode = '';
let availableTeams = [];
let selectedTeamId = null;

// Toast 提示函數
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';

    toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
    toast.className = `toast ${type} show`;

    if (window.lucide) {
        lucide.createIcons();
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 切換步驟
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

// 返回步驟 1
function backToStep1() {
    showStep(1);
    selectedTeamId = null;
}

// 步驟 1: 驗證兌換碼並直接兌換
document.getElementById('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const code = document.getElementById('code').value.trim();
    const verifyBtn = document.getElementById('verifyBtn');

    // 驗證
    if (!email || !code) {
        showToast('請填寫完整資訊', 'error');
        return;
    }

    // 儲存到全域變數
    currentEmail = email;
    currentCode = code;

    // 禁用按鈕
    verifyBtn.disabled = true;
    verifyBtn.textContent = '正在兌換...';

    // 直接呼叫兌換介面（team_id = null 表示自動選擇）
    await confirmRedeem(null);

    // 恢復按鈕狀態（如果 confirmRedeem 失敗並顯示了錯誤也沒關係，因為使用者可以點返回重試）
    verifyBtn.disabled = false;
    verifyBtn.textContent = '驗證兌換碼';
});

// 渲染 Team 清單
function renderTeamsList() {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';

    availableTeams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.onclick = () => selectTeam(team.id);

        const planBadge = team.subscription_plan === 'Plus' ? 'badge-plus' : 'badge-pro';

        teamCard.innerHTML = `
            <div class="team-name">${escapeHtml(team.team_name) || 'Team ' + team.id}</div>
            <div class="team-info">
                <div class="team-info-item">
                    <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                    <span>${team.current_members}/${team.max_members} 成員</span>
                </div>
                <div class="team-info-item">
                    <span class="team-badge ${planBadge}">${escapeHtml(team.subscription_plan) || 'Plus'}</span>
                </div>
                ${team.expires_at ? `
                <div class="team-info-item">
                    <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                    <span>到期：${formatDate(team.expires_at)}</span>
                </div>
                ` : ''}
            </div>
        `;

        teamsList.appendChild(teamCard);
        if (window.lucide) lucide.createIcons();
    });
}

// 選擇 Team
function selectTeam(teamId) {
    selectedTeamId = teamId;

    // 更新 UI
    document.querySelectorAll('.team-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // 立即確認兌換
    confirmRedeem(teamId);
}

// 自動選擇 Team
function autoSelectTeam() {
    if (availableTeams.length === 0) {
        showToast('沒有可用的 Team', 'error');
        return;
    }

    // 自動選擇第一個 Team（後端會按到期時間排序）
    confirmRedeem(null);
}

// 確認兌換
async function confirmRedeem(teamId) {
    try {
        const response = await fetch('/redeem/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentEmail,
                code: currentCode,
                team_id: teamId
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // 兌換成功
            showSuccessResult(data);
        } else {
            // 兌換失敗
            showErrorResult(data.error || '兌換失敗');
        }
    } catch (error) {
        showErrorResult('網路錯誤，請稍後重試');
    }
}

// 顯示成功結果
function showSuccessResult(data) {
    const resultContent = document.getElementById('resultContent');
    const teamInfo = data.team_info || {};

    resultContent.innerHTML = `
        <div class="result-success">
            <div class="result-icon"><i data-lucide="check-circle" style="width: 64px; height: 64px; color: var(--success);"></i></div>
            <div class="result-title">兌換成功！</div>
            <div class="result-message">${escapeHtml(data.message) || '您已成功加入 Team'}</div>

            <div class="result-details">
                <div class="result-detail-item">
                    <span class="result-detail-label">Team 名稱</span>
                    <span class="result-detail-value">${escapeHtml(teamInfo.team_name) || '-'}</span>
                </div>
                <div class="result-detail-item">
                    <span class="result-detail-label">電子郵件地址</span>
                    <span class="result-detail-value">${escapeHtml(currentEmail)}</span>
                </div>
                ${teamInfo.expires_at ? `
                <div class="result-detail-item">
                    <span class="result-detail-label">到期時間</span>
                    <span class="result-detail-value">${formatDate(teamInfo.expires_at)}</span>
                </div>
                ` : ''}
            </div>

            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                邀請郵件已發送到您的電子郵件，請查收並依照郵件指引接受邀請。
            </p>

            <button onclick="location.reload()" class="btn btn-primary">
                <i data-lucide="refresh-cw"></i> 再次兌換
            </button>
        </div>
    `;
    if (window.lucide) lucide.createIcons();

    showStep(3);
}

// 顯示錯誤結果
function showErrorResult(errorMessage) {
    const resultContent = document.getElementById('resultContent');

    resultContent.innerHTML = `
        <div class="result-error">
            <div class="result-icon"><i data-lucide="x-circle" style="width: 64px; height: 64px; color: var(--danger);"></i></div>
            <div class="result-title">兌換失敗</div>
            <div class="result-message">${escapeHtml(errorMessage)}</div>

            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                <button onclick="backToStep1()" class="btn btn-secondary">
                    <i data-lucide="arrow-left"></i> 返回重試
                </button>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i data-lucide="rotate-ccw"></i> 重新開始
                </button>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();

    showStep(3);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateString;
    }
}
