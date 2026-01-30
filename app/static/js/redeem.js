// 使用者兌換頁面 JavaScript

// HTML 轉義函數 - 防止 XSS
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

// Toast 提示
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
    // 隱藏質保結果
    document.getElementById('warrantyResult').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
}

// 步驟 1: 驗證兌換碼並直接兌換
document.getElementById('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const code = document.getElementById('code').value.trim();
    const verifyBtn = document.getElementById('verifyBtn');

    // 驗證
    if (!email || !code) {
        showToast('請填寫 Email 與兌換碼', 'error');
        return;
    }

    // 保存到全域變數
    currentEmail = email;
    currentCode = code;

    // 禁用按鈕
    verifyBtn.disabled = true;
    verifyBtn.textContent = '兌換中...';

    // 直接呼叫兌換 API (team_id = null 表示自動選擇)
    await confirmRedeem(null);

    // 還原按鈕狀態
    verifyBtn.disabled = false;
    verifyBtn.textContent = '驗證兌換碼';
});

// 渲染 Team 列表
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

    // 自動選擇 (後端會依過期日排序)
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
            const errorMessage = data.detail || data.error || '兌換失敗';
            showErrorResult(errorMessage);
        }
    } catch (error) {
        showErrorResult('網路錯誤，請稍後再試');
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
                    <span class="result-detail-label">電子郵件</span>
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
                邀請信已寄到您的信箱，請依照信件指示接受邀請。
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

// ========== 保固查詢 ==========

// 查詢保固狀態
async function checkWarranty() {
    const input = document.getElementById('warrantyInput').value.trim();

    // 驗證輸入
    if (!input) {
        showToast('請輸入原兌換碼或 Email 進行查詢', 'error');
        return;
    }

    let email = null;
    let code = null;

    // 簡單判斷是 Email 還是兌換碼
    if (input.includes('@')) {
        email = input;
    } else {
        code = input;
    }

    const checkBtn = document.getElementById('checkWarrantyBtn');
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i data-lucide="loader" class="spinning"></i> 查詢中...';
    if (window.lucide) lucide.createIcons();

    try {
        const response = await fetch('/warranty/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email || null,
                code: code || null
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showWarrantyResult(data);
        } else {
            showToast(data.error || data.detail || '查詢失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤，請稍後重試', 'error');
    } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i data-lucide="search"></i> 查詢保固狀態';
        if (window.lucide) lucide.createIcons();
    }
}

// 顯示保固查詢結果
function showWarrantyResult(data) {
    const warrantyContent = document.getElementById('warrantyContent');

    if (!data.has_warranty) {
        warrantyContent.innerHTML = `
            <div class="result-info" style="text-align: center; padding: 2rem;">
                <div class="result-icon"><i data-lucide="info" style="width: 48px; height: 48px; color: var(--text-muted);"></i></div>
                <div class="result-title" style="font-size: 1.2rem; margin: 1rem 0;">未找到保固資訊</div>
                <div class="result-message" style="color: var(--text-muted);">${escapeHtml(data.message || '此兌換碼沒有保固或未找到紀錄')}</div>
            </div>
        `;
    } else {
        const warrantyStatus = data.warranty_valid ?
            '<span style="color: var(--success);">✓ 保固有效</span>' :
            '<span style="color: var(--danger);">✗ 保固已過期</span>';

        const bannedTeamsHtml = data.banned_teams && data.banned_teams.length > 0 ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--danger); font-size: 0.95rem;">
                    <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i> 
                    已封鎖的 Team
                </h4>
                ${data.banned_teams.map(team => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-weight: 500;">${escapeHtml(team.team_name || 'Team ' + team.team_id)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(team.email)}</div>
                    </div>
                `).join('')}
            </div>
        ` : '<p style="color: var(--text-muted); margin-top: 1rem;">目前沒有封鎖的 Team</p>';

        const canReuseHtml = data.can_reuse ? `
            <div style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.3);">
                <h4 style="margin: 0 0 1rem 0; color: var(--success); font-size: 1rem;">
                    <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> 
                    可以重複使用
                </h4>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">
                    您的保固兌換碼可以重複使用！請複製下方兌換碼，返回兌換頁重新兌換。
                </p>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="text" value="${escapeHtml(data.original_code)}" readonly 
                        style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-base); border-radius: 6px; color: var(--text-primary); font-family: monospace; font-size: 1.1rem;">
                    <button onclick="copyWarrantyCode('${escapeHtml(data.original_code)}')" class="btn btn-primary" style="white-space: nowrap;">
                        <i data-lucide="copy"></i> 複製
                    </button>
                </div>
            </div>
        ` : '';

        warrantyContent.innerHTML = `
            <div class="warranty-details">
                <div class="result-detail-item" style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem;">
                    <span class="result-detail-label">保固狀態</span>
                    <span class="result-detail-value">${warrantyStatus}</span>
                </div>
                
                ${data.warranty_expires_at ? `
                <div class="result-detail-item" style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem;">
                    <span class="result-detail-label">保固到期時間</span>
                    <span class="result-detail-value">${formatDate(data.warranty_expires_at)}</span>
                </div>
                ` : ''}
                
                <div class="result-detail-item" style="padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem;">
                    <span class="result-detail-label">原兌換碼</span>
                    <span class="result-detail-value" style="font-family: monospace;">${escapeHtml(data.original_code)}</span>
                </div>
                
                ${bannedTeamsHtml}
                ${canReuseHtml}
            </div>
        `;
    }

    if (window.lucide) lucide.createIcons();

    // 顯示保固結果區域
    document.querySelectorAll('.step').forEach(step => step.style.display = 'none');
    document.getElementById('warrantyResult').style.display = 'block';
}

// 複製保固兌換碼
function copyWarrantyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('兌換碼已複製到剪貼簿', 'success');
    }).catch(() => {
        showToast('複製失敗，請手動複製', 'error');
    });
}

// ========== Announcement Modal ==========
function initAnnouncementModal() {
    const overlay = document.getElementById('announcementOverlay');
    if (!overlay) return;

    const closeBtn = document.getElementById('announcementClose');
    const confirmBtn = document.getElementById('announcementConfirm');

    const openModal = () => {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        if (window.lucide) {
            lucide.createIcons();
        }
    };

    const closeModal = () => {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    };

    closeBtn?.addEventListener('click', closeModal);
    confirmBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    setTimeout(openModal, 450);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementModal);
} else {
    initAnnouncementModal();
}

