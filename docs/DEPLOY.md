# 86.88 B&B — 部署指南 / Deployment Guide

> 將 Next.js 網站部署到 Synology NAS，透過 Cloudflare Tunnel 安全地對外服務。
> Deploy the Next.js website to a Synology NAS, securely exposed via Cloudflare Tunnel.

---

## 目錄 / Table of Contents

1. [架構概覽 / Architecture](#architecture)
2. [前置需求 / Prerequisites](#prerequisites)
3. [NAS 目錄結構 / Directory Structure](#directory-structure)
4. [首次部署 / First-Time Setup](#first-time-setup)
5. [Nginx Proxy Manager 設定 / NPM Setup](#npm-setup)
6. [Cloudflare Tunnel 設定 / Tunnel Setup](#tunnel-setup)
7. [更新網站 / Updating the Website](#updating)
8. [常用指令 / Useful Commands](#commands)
9. [疑難排解 / Troubleshooting](#troubleshooting)
10. [未來擴充 / Future Expansion](#future)

---

## <a id="architecture"></a>1. 架構概覽 / Architecture

```
旅客 → https://8688bnb.com
       ↓
Cloudflare (CDN + SSL + DDoS)
       ↓
Cloudflare Tunnel (Zero Trust, outbound only)
       ↓
NAS 192.168.1.128 — Docker
       ↓
┌─────────────────────────────────────┐
│  cloudflared  (tunnel agent)        │
│       ↓                             │
│  nginx-proxy-manager  (port 80)     │
│       ↓                             │
│  website  (Next.js, port 3000)      │
└─────────────────────────────────────┘
```

**流量方向 / Traffic flow:**
- Cloudflare Tunnel → NPM port 80 → website port 3000
- NAS **不需要** Port Forward / No port forwarding needed
- SSL 由 Cloudflare 處理 / SSL handled by Cloudflare

**後台與 API：**
`admin` 後台和 `api` 服務已經定義在 `infra/docker-compose.yml`，流量一樣由 Cloudflare Tunnel 進入 NPM，再由 NPM 根據網域（`admin.8688bnb.com`、`api.8688bnb.com`）轉發給對應容器。

公開網站的預約申請流程會呼叫 API 查詢房況與建立預約資料，因此正式環境的 `WEBSITE_PUBLIC_API_URL` 必須是瀏覽器可連線的公開 API URL。

---

## <a id="prerequisites"></a>2. 前置需求 / Prerequisites

| 項目 / Item | 需求 / Requirement |
|---|---|
| Synology NAS | DS220+ (建議) / DSM 7.2.2+ |
| Container Manager | 從套件中心安裝 / Install from Package Center |
| SSH | DSM → 控制台 → 終端機 → 啟用 SSH / Enable SSH |
| Git | 從套件中心安裝 Git Server / Install from Package Center |
| Cloudflare 帳號 | 已建立 Tunnel 並取得 Token |
| 網域 / Domain | 已在 Cloudflare 設定 DNS |

---

## <a id="directory-structure"></a>3. NAS 目錄結構 / Directory Structure

本專案採用 Turborepo Monorepo 架構：

```
/volume1/docker/8688bnb/eight-six-eight-eight/  ← 專案根目錄 (Git Root)
├── apps/
│   ├── website/                  ← Next.js 公開網站
│   ├── admin/                    ← Next.js 後台
│   └── api/                      ← Express REST API
├── packages/                     ← 共用套件 (UI, DB, Configs)
├── infra/                        ← ★ Docker 部署配置放置區
│   └── docker-compose.yml        ← 主要 Docker 編排檔
├── turbo.json
├── package.json
└── .env                          ← 環境變數（機密，不會進入 Git）
```

所有 `docker compose` 指令都必須在 `infra/` 目錄下執行。

---

## <a id="first-time-setup"></a>4. 首次部署 / First-Time Setup

### Step 1: SSH 進入 NAS

```bash
ssh your-username@192.168.1.128
```

### Step 2: Clone 專案

```bash
# 建立 Docker 工作目錄
sudo mkdir -p /volume1/docker/8688bnb
cd /volume1/docker/8688bnb

# Clone 程式碼（替換成你的 repo URL）
git clone <your-repo-url> eight-six-eight-eight
cd eight-six-eight-eight
```

### Step 3: 建立 .env 檔案

```bash
# 從範本複製
cp .env.example .env

# 編輯填入真實的 Tunnel Token
vi .env
```

請確保 `.env` 中填入你的 Cloudflare Tunnel Token、必要的資料庫密碼，以及瀏覽器可連到的 API URL：
```
TUNNEL_TOKEN=eyJhIjoi...（你的完整 token）
POSTGRES_PASSWORD=yenfeng
WEBSITE_PUBLIC_API_URL=https://api.8688bnb.com/api/v1
ADMIN_PUBLIC_API_URL=https://api.8688bnb.com/api/v1
```

### Step 4: 建構並啟動所有服務

```bash
# 進入 infra 資料夾
cd infra/

# 建構映像檔並啟動所有容器 (包含 website, admin, api, postgres, redis, npm, cloudflared)
docker compose up -d --build

# 查看啟動狀態
docker compose ps

# 查看即時 log
docker compose logs -f
```

### Step 4.1: 套用資料庫 Schema 與 Seed

第一次部署或 Prisma schema 更新後，請確認資料庫已套用最新 schema。`seed` profile 會掛載 `packages/db`，執行 Prisma `db push`，再寫入預設房型、媒體與特殊價格資料。`HolidayPeriod` 是特殊日期價格功能需要的資料表；如果尚未建立，房型價格仍可編輯，但特殊日期管理會顯示 setup warning。

```bash
docker compose --profile seed run --rm seed
```

### Step 5: 確認所有服務正常

```bash
# 所有容器應該顯示 "healthy" 或 "running"
docker compose ps

# 預期輸出範例：
# 8688bnb-website    ... (healthy)
# 8688bnb-admin      ... (running)
# 8688bnb-api        ... (healthy)
# 8688bnb-postgres   ... (healthy)
# 8688bnb-redis      ... (healthy)
# 8688bnb-npm        ... (healthy)
# 8688bnb-tunnel     ... (running)
```

---

## <a id="npm-setup"></a>5. Nginx Proxy Manager 設定 / NPM Setup

### 5.1 首次登入

1. 瀏覽器開啟：`http://192.168.1.128:81`
2. 預設帳密 / Default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
3. **⚠️ 登入後立即修改帳號密碼！**

### 5.2 新增 Proxy Host

1. 點選 **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. 填入以下資訊：

| 欄位 / Field | 值 / Value |
|---|---|
| Domain Names | `8688bnb.com` (你的網域) |
| Scheme | `http` |
| Forward Hostname / IP | `website` |
| Forward Port | `3000` |
| Block Common Exploits | ✅ 勾選 |
| Websockets Support | ✅ 勾選 |

3. **SSL 設定**：因為 Cloudflare 處理 SSL，NPM 內部不需要設定 SSL 證書。保持 HTTP 即可。

4. 點選 **Save**

### 5.3 子網域

| 網域 | Forward Hostname | Forward Port | 用途 |
|---|---|---|---|
| `8688bnb.com` | `website` | `3000` | 民宿網站 |
| `admin.8688bnb.com` | `admin` | `3001` | 後台管理 |
| `api.8688bnb.com` | `api` | `3333` | API 服務 |

---

## <a id="tunnel-setup"></a>6. Cloudflare Tunnel 設定 / Tunnel Setup

### 6.1 在 Cloudflare Dashboard 設定公開主機名

1. 登入 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. 前往 **Networks** → **Tunnels**
3. 找到你的 Tunnel → 點選 **Configure**
4. 在 **Public Hostname** 新增：

| Subdomain | Domain | Type | URL |
|---|---|---|---|
| (空白) | `8688bnb.com` | HTTP | `8688bnb-npm:80` |
| `admin` | `8688bnb.com` | HTTP | `8688bnb-npm:80` |
| `api` | `8688bnb.com` | HTTP | `8688bnb-npm:80` |

> **注意**：URL 裡填容器名稱 `8688bnb-npm`，因為 cloudflared 容器和 NPM 在同一個 Docker 網路裡。

### 6.2 Cloudflare DNS 設定

確保你的網域 DNS 有以下記錄（Tunnel 通常會自動建立）：

| Type | Name | Content |
|---|---|---|
| CNAME | `@` | `<tunnel-id>.cfargotunnel.com` |

---

## <a id="updating"></a>7. 更新網站 / Updating the Website

當你修改了網站程式碼後：

```bash
# SSH 進入 NAS
ssh your-username@192.168.1.128
cd /volume1/docker/8688bnb/eight-six-eight-eight

# 拉取最新程式碼
git pull

# 切換到 infra/ 目錄
cd infra/

# 重新建構並重啟有變更的容器（不影響 NPM/Tunnel/DB 等其他服務）
docker compose build website admin api
docker compose up -d website admin api

# 確認更新成功
docker compose logs -f website
```

如果更新包含 Prisma schema 變更，重啟 API 前先套用 schema：

```bash
docker compose --profile seed run --rm seed
docker compose up -d api admin website
```

> **提示**：由於使用了 `turbo prune`，Docker 建構速度將會非常快，只會重新安裝和編譯實際有更動的 Packages。

---

## <a id="commands"></a>8. 常用指令 / Useful Commands

> **注意：所有 `docker compose` 指令都必須在 `infra/` 目錄下執行。**

```bash
# ── 啟動 / Start ──
docker compose up -d                    # 啟動所有服務
docker compose up -d --build            # 重新建構後啟動

# ── 停止 / Stop ──
docker compose down                     # 停止並移除容器
docker compose stop                     # 只停止（不移除）

# ── 查看 / Monitor ──
docker compose ps                       # 查看容器狀態
docker compose logs -f                  # 即時查看所有 log
docker compose logs -f website          # 只看網站 log
docker compose logs -f admin            # 只看後台 log
docker compose logs -f api              # 只看 API log
docker compose logs -f cloudflared      # 只看 tunnel log

# ── 重啟 / Restart ──
docker compose restart website          # 重啟網站容器
docker compose restart admin api        # 重啟後台與 API
docker compose restart                  # 重啟所有容器

# ── 進入容器 / Enter container ──
docker compose exec website sh          # 進入網站容器 shell
docker compose exec api sh              # 進入 API 容器 shell
docker compose exec nginx-proxy-manager bash  # 進入 NPM 容器

# ── 清理 / Cleanup ──
docker system prune -f                  # 清理無用的映像檔和容器
docker builder prune -f                 # 清理建構快取
```

```bash
# ── 資料庫 / Database ──
docker compose --profile seed run --rm seed
```

---

## <a id="troubleshooting"></a>9. 疑難排解 / Troubleshooting

### 網站打不開 / Website not loading

```bash
# 1. 確認所有容器狀態 (進入 infra/ 執行)
cd infra/
docker compose ps

# 2. 檢查 website 是否有錯誤
docker compose logs website

# 3. 測試 NPM 是否正常
curl http://localhost:8080
```

### 特殊日期顯示 setup warning / Special pricing period setup warning

後台「房價設定」若顯示特殊日期資料表尚未建立，代表目前資料庫還沒有 `HolidayPeriod` table。請在 `infra/` 目錄執行：

```bash
docker compose --profile seed run --rm seed
```

### Tunnel 連不上 / Tunnel not connecting

```bash
# 檢查 cloudflared log
docker compose logs cloudflared

# 常見問題：
# - "Invalid tunnel token" → 確認 root 目錄下 .env 裡的 TUNNEL_TOKEN 正確
# - "Connection refused" → 確認 NPM 容器是否健康
# - "DNS resolution failed" → 確認 Docker 網路正常
```

### NPM 管理頁面打不開 / NPM admin not accessible

```bash
# 確認 port 81 有在監聽
docker compose logs nginx-proxy-manager

# 確認從 NAS 本機可以連
curl http://localhost:81
```

### 記憶體不足 / Out of memory

如果 NAS 記憶體有限，可以調低 `infra/docker-compose.yml` 中的 resource limits：

```yaml
deploy:
  resources:
    limits:
      memory: 256M  # 降低 website 記憶體上限
```

---

## <a id="future"></a>10. 後續擴充 / Future Expansion

`admin` 後台和 `api` 服務已可建構並支援訂單、房價、特殊價格、圖片、公告、房型、封鎖日期與系統設定。後續重點是增加自動化測試、改善 CMS 編輯體驗、強化備份/還原流程，以及在需要 OTA 串接時驗證 webhook payload。

---

## 安全提醒 / Security Reminders

- ⚠️ **永遠不要** 把 `.env` 檔案 commit 到 Git
- ⚠️ **永遠不要** 在 router 做 Port Forward
- ⚠️ NPM 管理介面 (port 81) **只在區網可用**，不要透過 Tunnel 對外
- ⚠️ 首次登入 NPM 後 **立即修改** 預設密碼
- ✅ 所有對外流量都透過 Cloudflare Tunnel（加密 + DDoS 保護）
- ✅ Website 容器以 non-root 使用者執行 (UID 1001)
- ✅ 確保 `POSTGRES_PASSWORD` 使用強密碼
