/**
 * GPT Team 管理系統 - 通用 JavaScript
 */

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

// 日期格式化函數
function formatDateTime(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 登出函數
async function logout() {
    if (!confirm('確定要登出嗎？')) {
        return;
    }

    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.location.href = '/login';
        } else {
            showToast('登出失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    }
}

// API 呼叫封裝
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.detail || '請求失敗');
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 確認對話框
function confirmAction(message) {
    return confirm(message);
}

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function () {
    // 檢查認證狀態
    checkAuthStatus();
});

// 檢查認證狀態
async function checkAuthStatus() {
    // 如果在登入頁面，跳過檢查
    if (window.location.pathname === '/login') {
        return;
    }

    try {
        const response = await fetch('/auth/status');
        const data = await response.json();

        if (!data.authenticated && window.location.pathname.startsWith('/admin')) {
            // 未登入且在管理員頁面，跳轉到登入頁
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('檢查認證狀態失敗:', error);
    }
}

// === 模態框控制邏輯 ===

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景捲動
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function switchModalTab(modalId, tabId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // 切換按鈕狀態
    const tabs = modal.querySelectorAll('.modal-tab-btn');
    tabs.forEach(tab => {
        if (tab.getAttribute('onclick').includes(`'${tabId}'`)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // 切換面板顯示
    const panels = modal.querySelectorAll('.import-panel, .card-body');
    panels.forEach(panel => {
        if (panel.id === tabId) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });
}

// === Team 匯入邏輯 ===

async function handleSingleImport(event) {
    event.preventDefault();
    const form = event.target;
    const accessToken = form.accessToken.value.trim();
    const email = form.email.value.trim();
    const accountId = form.accountId.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = '匯入中...';

    try {
        const result = await apiCall('/admin/teams/import', {
            method: 'POST',
            body: JSON.stringify({
                import_type: 'single',
                access_token: accessToken,
                email: email || null,
                account_id: accountId || null
            })
        });

        if (result.success) {
            showToast('Team 匯入成功！', 'success');
            form.reset();
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(result.error || '匯入失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '匯入';
    }
}

async function handleBatchImport(event) {
    event.preventDefault();
    const form = event.target;
    const batchContent = form.batchContent.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');
    const resultsContainer = document.getElementById('batchResultsContainer');
    const resultsDiv = document.getElementById('batchResults');

    submitButton.disabled = true;
    submitButton.textContent = '匯入中...';

    try {
        const result = await apiCall('/admin/teams/import', {
            method: 'POST',
            body: JSON.stringify({
                import_type: 'batch',
                content: batchContent
            })
        });

        if (result.success) {
            const data = result.data;
            let html = `<div class="batch-summary">
                <p>總數：${data.total} | 成功：<span class="text-success">${data.success_count}</span> | 失敗：<span class="text-danger">${data.failed_count}</span></p>
            </div>`;

            if (data.results && data.results.length > 0) {
                html += '<div class="batch-results"><table class="data-table"><thead><tr><th>電子郵件</th><th>狀態</th><th>訊息</th></tr></thead><tbody>';
                data.results.forEach(res => {
                    const statusClass = res.success ? 'text-success' : 'text-danger';
                    const statusText = res.success ? '成功' : '失敗';
                    html += `<tr>
                        <td>${res.email}</td>
                        <td class="${statusClass}">${statusText}</td>
                        <td>${res.success ? res.message : res.error}</td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
            }

            resultsDiv.innerHTML = html;
            resultsContainer.style.display = 'block';

            if (data.failed_count === 0) {
                showToast('全部匯入成功！', 'success');
                setTimeout(() => location.reload(), 2000);
            }
        } else {
            showToast(result.error || '批次匯入失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '批次匯入';
    }
}

// === 兌換碼產生邏輯 ===

async function generateSingle(event) {
    event.preventDefault();
    const form = event.target;
    const customCode = form.customCode.value.trim();
    const expiresDays = form.expiresDays.value;

    const data = { type: 'single' };
    if (customCode) data.code = customCode;
    if (expiresDays) data.expires_days = parseInt(expiresDays);

    const result = await apiCall('/admin/codes/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (result.success) {
        document.getElementById('generatedCode').textContent = result.data.code;
        document.getElementById('singleResult').style.display = 'block';
        form.reset();
        showToast('兌換碼產生成功', 'success');
        // 如果在列表中，延遲重新整理
        if (window.location.pathname === '/admin/codes') {
            setTimeout(() => location.reload(), 2000);
        }
    } else {
        showToast(result.error || '產生失敗', 'error');
    }
}

async function generateBatch(event) {
    event.preventDefault();
    const form = event.target;
    const count = parseInt(form.count.value);
    const expiresDays = form.expiresDays.value;

    if (count < 1 || count > 1000) {
        showToast('產生數量必須在 1-1000 之間', 'error');
        return;
    }

    const data = { type: 'batch', count: count };
    if (expiresDays) data.expires_days = parseInt(expiresDays);

    const result = await apiCall('/admin/codes/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (result.success) {
        document.getElementById('batchTotal').textContent = result.data.total;
        document.getElementById('batchCodes').value = result.data.codes.join('\n');
        document.getElementById('batchResult').style.display = 'block';
        form.reset();
        showToast(`成功產生 ${result.data.total} 組兌換碼`, 'success');
        if (window.location.pathname === '/admin/codes') {
            setTimeout(() => location.reload(), 3000);
        }
    } else {
        showToast(result.error || '產生失敗', 'error');
    }
}

// 統一複製到剪貼簿函數
async function copyToClipboard(text) {
    if (!text) return;

    try {
        // 嘗試使用 Modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showToast('已複製到剪貼簿', 'success');
            return true;
        }
    } catch (err) {
        console.error('Modern copy failed:', err);
    }

    // 備援：使用 textarea 方式
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // 確保 textarea 不可見且不影響版面
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
            showToast('已複製到剪貼簿', 'success');
            return true;
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    showToast('複製失敗', 'error');
    return false;
}

// === 輔助函數 ===

function copyCode(code) {
    // 如果沒有傳入 code，嘗試從產生結果中取得
    if (!code) {
        const generatedCodeEl = document.getElementById('generatedCode');
        code = generatedCodeEl ? generatedCodeEl.textContent : '';
    }

    if (code) {
        copyToClipboard(code);
    } else {
        showToast('無內容可複製', 'error');
    }
}

function copyBatchCodes() {
    const codes = document.getElementById('batchCodes').value;
    copyToClipboard(codes);
}

function downloadCodes() {
    const codes = document.getElementById('batchCodes').value;
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemption_codes_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('下載成功', 'success');
}
// === 成員管理邏輯 ===

async function viewMembers(teamId, teamEmail = '') {
    window.currentTeamId = teamId;
    const modal = document.getElementById('manageMembersModal');
    if (!modal) return;

    // 設定基本資訊
    document.getElementById('modalTeamEmail').textContent = teamEmail;

    // 打開模態框
    showModal('manageMembersModal');

    // 載入成員列表
    await loadModalMemberList(teamId);
}

async function loadModalMemberList(teamId) {
    const joinedTableBody = document.getElementById('modalJoinedMembersTableBody');
    const invitedTableBody = document.getElementById('modalInvitedMembersTableBody');

    if (joinedTableBody) joinedTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">載入中...</td></tr>';
    if (invitedTableBody) invitedTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">載入中...</td></tr>';

    try {
        const result = await apiCall(`/admin/teams/${teamId}/members/list`);
        if (result.success) {
            const allMembers = result.data.members || [];
            const joinedMembers = allMembers.filter(m => m.status === 'joined');
            const invitedMembers = allMembers.filter(m => m.status === 'invited');

            // 渲染已加入成員
            if (joinedTableBody) {
                if (joinedMembers.length === 0) {
                    joinedTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">暫無已加入成員</td></tr>';
                } else {
                    joinedTableBody.innerHTML = joinedMembers.map(m => `
                        <tr>
                            <td>${m.email}</td>
                            <td>
                                <span class="role-badge role-${m.role}">
                                    ${m.role === 'account-owner' ? '所有者' : '成員'}
                                </span>
                            </td>
                            <td>${formatDateTime(m.added_at)}</td>
                            <td style="text-align: right;">
                                ${m.role !== 'account-owner' ? `
                                    <button onclick="deleteMember('${teamId}', '${m.user_id}', '${m.email}', true)" class="btn btn-sm btn-danger">
                                        <i data-lucide="trash-2"></i> 刪除
                                    </button>
                                ` : '<span class="text-muted">不可刪除</span>'}
                            </td>
                        </tr>
                    `).join('');
                }
            }

            // 渲染待加入成員
            if (invitedTableBody) {
                if (invitedMembers.length === 0) {
                    invitedTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">暫無待加入成員</td></tr>';
                } else {
                    invitedTableBody.innerHTML = invitedMembers.map(m => `
                        <tr>
                            <td>${m.email}</td>
                            <td>
                                <span class="role-badge role-${m.role}">成員</span>
                            </td>
                            <td>${formatDateTime(m.added_at)}</td>
                            <td style="text-align: right;">
                                <button onclick="revokeInvite('${teamId}', '${m.email}', true)" class="btn btn-sm btn-warning">
                                    <i data-lucide="undo"></i> 撤回
                                </button>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            if (window.lucide) lucide.createIcons();
        } else {
            const errorMsg = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">${result.error}</td></tr>`;
            if (joinedTableBody) joinedTableBody.innerHTML = errorMsg;
            if (invitedTableBody) invitedTableBody.innerHTML = errorMsg;
        }
    } catch (error) {
        const errorMsg = '<tr><td colspan="4" style="text-align: center; color: var(--danger);">載入失敗</td></tr>';
        if (joinedTableBody) joinedTableBody.innerHTML = errorMsg;
        if (invitedTableBody) invitedTableBody.innerHTML = errorMsg;
    }
}

async function revokeInvite(teamId, email, inModal = false) {
    if (!confirm(`確定要撤回對 "${email}" 的邀請嗎？`)) {
        return;
    }

    try {
        showToast('正在撤回...', 'info');
        const result = await apiCall(`/admin/teams/${teamId}/invites/revoke`, {
            method: 'POST',
            body: JSON.stringify({ email: email })
        });

        if (result.success) {
            showToast('撤回成功', 'success');
            if (inModal) {
                await loadModalMemberList(teamId);
            } else {
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            showToast(result.error || '撤回失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    }
}

async function handleAddMember(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim();
    const submitButton = document.getElementById('addMemberSubmitBtn');
    const teamId = window.currentTeamId;

    if (!teamId) {
        showToast('無法取得 Team ID', 'error');
        return;
    }

    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.textContent = '新增中...';

    try {
        const result = await apiCall(`/admin/teams/${teamId}/members/add`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        if (result.success) {
            showToast('成員新增成功！', 'success');
            form.reset();
            // 在模態框模式下，只需重新載入列表
            if (document.getElementById('manageMembersModal').classList.contains('show')) {
                await loadModalMemberList(teamId);
            } else {
                setTimeout(() => location.reload(), 1500);
            }
        } else {
            showToast(result.error || '新增失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

async function deleteMember(teamId, userId, email, inModal = false) {
    if (!confirm(`確定要刪除成員 "${email}" 嗎？\n\n此操作無法復原！`)) {
        return;
    }

    try {
        showToast('正在刪除...', 'info');
        const result = await apiCall(`/admin/teams/${teamId}/members/${userId}/delete`, {
            method: 'POST'
        });

        if (result.success) {
            showToast('刪除成功', 'success');
            if (inModal) {
                await loadModalMemberList(teamId);
            } else {
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            showToast(result.error || '刪除失敗', 'error');
        }
    } catch (error) {
        showToast('網路錯誤', 'error');
    }
}
