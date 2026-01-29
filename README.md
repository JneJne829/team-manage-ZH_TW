# GPT Team 管理與兌換碼自動邀請系統

一個基於 FastAPI 的 ChatGPT Team 帳號管理系統，支援管理員批量管理 Team 帳號，使用者透過兌換碼自動加入 Team。

## ✨ 功能特性

### 管理員功能
- **Team 帳號管理**
  - 單個/批次匯入 Team 帳號（支援任意格式的 AT Token）
  - 智慧識別並提取 AT Token、郵箱、Account ID
  - 自動同步 Team 資訊（名稱、訂閱方案、到期時間、成員數）
  - Team 成員管理（檢視、添加、刪除成員）
  - Team 狀態監控（可用 / 已滿 / 已過期 / 錯誤）

- **兌換碼管理**
  - 單個/批次生成兌換碼
  - 自訂兌換碼與有效期
  - 兌換碼狀態篩選（未使用 / 已使用 / 已過期）
  - 匯出兌換碼為純文字檔
  - 刪除未使用的兌換碼

- **使用紀錄查詢**
  - 多維度篩選（郵箱、兌換碼、Team ID、日期範圍）
  - 分頁顯示（每頁 20 條紀錄）
  - 統計數據（總數、今日、本週、本月）

- **系統設定**
  - 代理設定（HTTP / SOCKS5）
  - 管理員密碼修改
  - 日誌級別動態調整

### 使用者功能
- **兌換流程**
  - 輸入郵箱與兌換碼
  - 自動驗證兌換碼有效性
  - 顯示可用 Team 清單
  - 手動選擇或自動分配 Team
  - 自動寄送 Team 邀請到使用者郵箱

## 🛠️ 技術棧

- **後端框架**: FastAPI 0.109+
- **Web 伺服器**: Uvicorn
- **資料庫**: SQLite + SQLAlchemy 2.0 + aiosqlite
- **模板引擎**: Jinja2
- **HTTP 客戶端**: curl-cffi（模擬瀏覽器指紋，繞過 Cloudflare 防護）
- **認證**: Session-based（bcrypt 密碼雜湊）
- **加密**: cryptography（AES-256-GCM）
- **JWT 解析**: PyJWT
- **前端**: HTML + CSS + 原生 JavaScript

## 📋 系統需求

- Python 3.10+
- pip（Python 套件管理器）
- 作業系統：Windows / Linux / macOS

## 🚀 快速開始

### 1. 克隆專案

```bash
git clone <repository-url>
cd team-manage
```

### 2. 建立虛擬環境

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. 安裝依賴

```bash
pip install -r requirements.txt
```

### 4. 設定環境變數

複製 `.env.example` 為 `.env` 並修改配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# 應用設定
APP_NAME=GPT Team 管理系統
APP_VERSION=0.1.0
APP_HOST=0.0.0.0
APP_PORT=8008
DEBUG=True

# 資料庫設定（預設使用 SQLite）
DATABASE_URL=sqlite+aiosqlite:///team_manage.db

# 安全設定（生產環境請修改）
SECRET_KEY=your-secret-key-here-change-in-production
ADMIN_PASSWORD=admin123

# 日誌設定
LOG_LEVEL=INFO

# 代理設定（可選）
PROXY_ENABLED=False
PROXY=

# JWT 設定
JWT_VERIFY_SIGNATURE=False
```

### 5. 初始化資料庫

```bash
python init_db.py
```

### 6. 啟動應用

```bash
# 開發模式（自動重載）
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8008

# 或者直接運行
python app/main.py
```

### 7. 訪問應用

- **使用者兌換頁面**: http://localhost:8008/
- **管理員登入頁面**: http://localhost:8008/login
- **管理員控制台**: http://localhost:8008/admin

**預設管理員帳號**：
- 使用者名稱: `admin`
- 密碼: `admin123`（請在首次登入後修改）

---

## 🐳 Docker 部署（推薦）

專案支援使用 Docker 快速部署，確保環境一致性並簡化配置。

### 1. 準備工作

確認你的系統已安裝：
- Docker
- Docker Compose

### 2. 快速啟動

1.  克隆專案並進入目錄。
2.  設定 `.env` 文件（參考上述「設定環境變數」章節）。
3.  運行 Docker Compose 命令：

```bash
# 構建並啟動容器
docker compose up -d
```

### 3. 資料持久化

Docker 配置中已自動將宿主機的 `team_manage.db` 文件映射到容器內，因此你的資料會自動保存在專案根目錄下，容器刪除後資料依然存在。

### 4. 常用命令

```bash
# 查看日誌
docker compose logs -f

# 停止並移除容器
docker compose down

# 重新構建映像
docker compose build --no-cache
```

## 📂 專案結構

```
team-manage/
├── app/                        # 應用主目錄
│   ├── main.py                 # FastAPI 入口文件
│   ├── config.py               # 配置管理
│   ├── database.py             # 資料庫連接
│   ├── models.py               # SQLAlchemy 模型
│   ├── routes/                 # 路由模組
│   │   ├── admin.py            # 管理員路由
│   │   ├── user.py             # 使用者路由
│   │   ├── api.py              # API 端點
│   │   ├── auth.py             # 認證路由
│   │   └── redeem.py           # 兌換路由
│   ├── services/               # 業務邏輯服務
│   │   ├── auth.py             # 認證服務
│   │   ├── chatgpt.py          # ChatGPT API 集成
│   │   ├── encryption.py       # 加密服務
│   │   ├── redeem_flow.py      # 兌換流程服務
│   │   ├── redemption.py       # 兌換碼管理服務
│   │   ├── settings.py         # 系統設定服務
│   │   └── team.py             # Team 管理服務
│   ├── utils/                  # 工具模組
│   │   ├── jwt_parser.py       # JWT Token 解析
│   │   └── token_parser.py     # Token 正則匹配
│   ├── dependencies/           # FastAPI 依賴
│   │   └── auth.py             # 認證依賴
│   ├── templates/              # Jinja2 模板
│   │   ├── base.html           # 基礎佈局
│   │   ├── auth/               # 認證頁面
│   │   ├── admin/              # 管理員頁面
│   │   └── user/               # 使用者頁面
│   └── static/                 # 靜態文件
│       ├── css/                # 樣式文件
│       └── js/                 # JavaScript 文件
├── init_db.py                  # 資料庫初始化腳本
├── requirements.txt            # Python 依賴
├── Dockerfile                  # Docker 映像構建文件
├── docker-compose.yml          # Docker 服務編排文件
├── .dockerignore               # Docker 忽略文件
├── .env.example                # 環境變數示例
├── CLAUDE.md                   # Claude Code 指南
├── 需求.md                     # 專案需求文件
├── 任務.md                     # 任務追蹤文件
├── 接口.md                     # API 介面文件
└── README.md                   # 專案說明文件
```

## 🔧 配置說明

### 資料庫設定

預設使用 SQLite 資料庫，資料庫文件為 `team_manage.db`。如需使用其他資料庫，請修改 `DATABASE_URL`。

### 代理設定

如果需要透過代理訪問 ChatGPT API，可以在管理員面板的「系統設定」中配置代理：

- 支援 HTTP 代理：`http://proxy.example.com:8080`
- 支援 SOCKS5 代理：`socks5://proxy.example.com:1080`

### 安全設定

**生產環境部署前，請務必修改以下設定**：

1. `SECRET_KEY`: 用於 Session 簽名，請使用隨機字串
2. `ADMIN_PASSWORD`: 管理員初始密碼，首次登入後請立即修改
3. `DEBUG`: 生產環境請設定為 `False`

## 📖 使用指南

### 管理員操作流程

1. **登入管理員面板**
   - 訪問 http://localhost:8008/login
   - 使用預設帳號登入（admin/admin123）
   - 首次登入後建議修改密碼

2. **匯入 Team 帳號**
   - 進入「Team 管理」 → 「匯入 Team」
   - 單個匯入：填寫 AT Token、郵箱（可選）、Account ID（可選）
   - 批次匯入：貼上包含 AT Token 的文字（支援任意格式）
   - 系統會自動識別並提取資訊

3. **生成兌換碼**
   - 進入「兌換碼管理」 → 「生成兌換碼」
   - 單個生成：可自訂兌換碼與有效期
   - 批次生成：設定數量與有效期
   - 生成後可複製或下載

4. **查看使用紀錄**
   - 進入「使用紀錄」
   - 可按郵箱、兌換碼、Team ID、日期範圍篩選
   - 查看統計數據（總數、今日、本週、本月）

5. **系統設定**
   - 進入「系統設定」
   - 配置代理（如需）
   - 修改管理員密碼
   - 調整日誌級別

### 使用者兌換流程

1. **訪問兌換頁面**
   - 訪問 http://localhost:8008/

2. **輸入資訊**
   - 填寫郵箱地址
   - 輸入兌換碼

3. **選擇 Team**
   - 系統展示可用 Team 清單
   - 手動選擇 Team 或點擊「自動選擇」

4. **完成兌換**
   - 系統自動發送邀請到郵箱
   - 查看兌換結果（Team 名稱、到期時間）

5. **接受邀請**
   - 檢查郵箱收到的 ChatGPT Team 邀請郵件
   - 點擊郵件中的連結接受邀請

## 🔌 API 介面

詳細的 API 介面文件請參考 [接口.md](接口.md)。

主要介面：

- `POST /auth/login` - 管理員登入
- `POST /auth/logout` - 管理員登出
- `POST /redeem/verify` - 驗證兌換碼
- `POST /redeem/confirm` - 確認兌換
- `GET /admin` - 管理員控制台
- `GET /admin/teams/import` - Team 匯入頁面
- `GET /admin/codes` - 兌換碼列表
- `GET /admin/records` - 使用紀錄

## 🐛 故障排除

### 資料庫初始化失敗

```bash
# 刪除舊資料庫文件
rm team_manage.db

# 重新初始化
python init_db.py
```

### 無法訪問 ChatGPT API

1. 檢查網路連接
2. 配置代理（如需）
3. 檢查 AT Token 是否有效
4. 查看日誌文件排查錯誤

### 匯入 Team 失敗

1. 確保 AT Token 格式正確
2. 檢查 Token 是否過期
3. 驗證 Token 是否有 Team 管理權限

## 📄 授權

本專案僅供學習和研究使用。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**注意**: 本系統僅用於合法的 ChatGPT Team 帳號管理，請遵守 OpenAI 的服務條款。
