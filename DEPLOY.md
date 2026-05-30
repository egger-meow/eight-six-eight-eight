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

```
/volume1/docker/8688bnb/           ← 專案根目錄 / Project root
├── docker-compose.yml             ← Docker 編排檔
├── Dockerfile                     ← Next.js 建構檔
├── .env                           ← 環境變數（機密）
├── .env.example                   ← 環境變數範本
├── src/                           ← Next.js 原始碼
├── public/                        ← 靜態資源（圖片等）
├── package.json
└── ...
```

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
git clone <your-repo-url> .
```

### Step 3: 建立 .env 檔案

```bash
# 從範本複製
cp .env.example .env

# 編輯填入真實的 Tunnel Token
vi .env
```

填入你的 Cloudflare Tunnel Token：
```
TUNNEL_TOKEN=eyJhIjoiZWUwNjRh...（你的完整 token）
NODE_ENV=production
```

### Step 4: 建構並啟動所有服務

```bash
# 建構 Next.js 映像檔並啟動所有容器
docker compose up -d --build

# 查看啟動狀態
docker compose ps

# 查看即時 log
docker compose logs -f
```

### Step 5: 確認所有服務正常

```bash
# 所有容器應該顯示 "healthy" 或 "running"
docker compose ps

# 預期輸出：
# 8688bnb-website    ... (healthy)
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

### 5.3 未來子網域（Phase 2+）

| 網域 | 指向 | 用途 |
|---|---|---|
| `8688bnb.com` | `website:3000` | 民宿網站 |
| `admin.8688bnb.com` | `admin:XXXX` | 後台管理 |
| `api.8688bnb.com` | `api:XXXX` | API 服務 |

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
cd /volume1/docker/8688bnb

# 拉取最新程式碼
git pull

# 重新建構並重啟 website 容器（不影響其他服務）
docker compose build website
docker compose up -d website

# 確認更新成功
docker compose logs -f website
```

> **提示**：只重建 `website` 容器，`cloudflared` 和 `nginx-proxy-manager` 不會被影響。

---

## <a id="commands"></a>8. 常用指令 / Useful Commands

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
docker compose logs -f cloudflared      # 只看 tunnel log

# ── 重啟 / Restart ──
docker compose restart website          # 重啟網站容器
docker compose restart                  # 重啟所有容器

# ── 進入容器 / Enter container ──
docker compose exec website sh          # 進入網站容器 shell
docker compose exec nginx-proxy-manager bash  # 進入 NPM 容器

# ── 清理 / Cleanup ──
docker system prune -f                  # 清理無用的映像檔和容器
docker builder prune -f                 # 清理建構快取
```

---

## <a id="troubleshooting"></a>9. 疑難排解 / Troubleshooting

### 網站打不開 / Website not loading

```bash
# 1. 確認所有容器在跑
docker compose ps

# 2. 檢查 website 有沒有錯誤
docker compose logs website

# 3. 從 NAS 本機測試網站
curl http://localhost:3000

# 4. 測試 NPM 是否正常
curl http://localhost:80
```

### Tunnel 連不上 / Tunnel not connecting

```bash
# 檢查 cloudflared log
docker compose logs cloudflared

# 常見問題：
# - "Invalid tunnel token" → 確認 .env 裡的 TUNNEL_TOKEN 正確
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

如果 NAS 記憶體有限，可以調低 docker-compose.yml 中的 resource limits：

```yaml
deploy:
  resources:
    limits:
      memory: 256M  # 降低 website 記憶體上限
```

---

## <a id="future"></a>10. 未來擴充 / Future Expansion

Phase 2 可以在 `docker-compose.yml` 中新增更多服務，以支援更強大的訂房系統與後台管理：

```yaml
services:
  # ... 現有服務 ...

  # PostgreSQL 資料庫 (儲存訂房紀錄、房態、公告欄內容)
  postgres:
    image: postgres:16-alpine
    container_name: 8688bnb-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: 8688bnb
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - 8688bnb_net

  # Redis 快取 (用於 Webhook 或高頻查詢)
  redis:
    image: redis:7-alpine
    container_name: 8688bnb-redis
    restart: unless-stopped
    networks:
      - 8688bnb_net
```

然後在 NPM 新增 Proxy Host 指向新服務即可。

### 未來重點功能架構 (Phase 2+)

1. **完整訂房系統 (API & UI/UX)**：優化網站前端預約體驗，搭配強健的後端 API 處理庫存扣留與訂單建立。
2. **圖片顯示與儲存管理**：優化網站各頁面（如首頁 Gallery、房型照片）的圖片顯示，並為每頁建立更佳的圖檔儲存與管理機制。
3. **Admin 後台管理**：
   - **內容管理 (CMS)**：老闆可自行管理網站內容，例如首頁的**公告欄**。
   - **訂房行事曆 (Calendar UI)**：視覺化呈現每間房的訂房狀況，方便快速查閱與排房。
4. **OTA 平台串接 (Webhooks)**：建立 Webhook 機制，接收 Agoda、Booking.com 等外部平台的通知，自動同步房態與預訂狀態。
5. **穩健升級策略**：在新增上述功能的同時，確保既有架構（Next.js + NPM + Cloudflare Tunnel）穩定運行，建立高擴充性的專案結構。

---

## 安全提醒 / Security Reminders

- ⚠️ **永遠不要** 把 `.env` 檔案 commit 到 Git
- ⚠️ **永遠不要** 在 router 做 Port Forward
- ⚠️ NPM 管理介面 (port 81) **只在區網可用**，不要透過 Tunnel 對外
- ⚠️ 首次登入 NPM 後 **立即修改** 預設密碼
- ✅ 所有對外流量都透過 Cloudflare Tunnel（加密 + DDoS 保護）
- ✅ Website 容器以 non-root 使用者執行 (UID 1001)
