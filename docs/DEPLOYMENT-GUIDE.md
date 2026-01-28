# 🚀 Meme Master Pro 服务器部署指南

## 📋 目录

1. [服务器选择](#服务器选择)
2. [安全配置](#安全配置)
3. [Docker 部署](#docker-部署)
4. [数据库配置](#数据库配置)
5. [反向代理配置](#反向代理配置)
6. [SSL 证书配置](#ssl-证书配置)
7. [防火墙配置](#防火墙配置)
8. [监控和维护](#监控和维护)

---

## 🖥️ 服务器选择

### 推荐配置

| 资源 | 最小配置 | 推荐配置 | 高性能配置 |
|------|----------|----------|------------|
| CPU | 2 核 | 4 核 | 8 核 |
| 内存 | 4 GB | 8 GB | 16 GB |
| 存储 | 40 GB SSD | 80 GB SSD | 160 GB SSD |
| 带宽 | 1 Mbps | 5 Mbps | 10 Mbps |
| 价格/月 | $5-10 | $20-30 | $60-100 |

### 推荐云服务商

| 服务商 | 优势 | 价格 | 推荐 |
|--------|------|------|------|
| **Vultr** | 性价比高，全球节点多 | $5/月起 | ⭐⭐⭐⭐⭐ |
| **DigitalOcean** | 稳定可靠，文档完善 | $6/月起 | ⭐⭐⭐⭐⭐ |
| **Linode** | 高性能，适合专业用户 | $5/月起 | ⭐⭐⭐⭐ |
| **AWS** | 功能强大，但价格较高 | $10/月起 | ⭐⭐⭐ |
| **阿里云** | 国内访问快 | ¥30/月起 | ⭐⭐⭐⭐ |

### 推荐地区

- **亚太**：新加坡、东京、香港
- **欧美**：美国（纽约、洛杉矶）、德国（法兰克福）
- **国内用户**：推荐香港或日本节点

---

## 🔒 安全配置

### 1. 初始安全设置

#### 1.1 创建非 root 用户

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 创建新用户（替换 yourname）
adduser yourname

# 添加 sudo 权限
usermod -aG sudo yourname

# 切换到新用户
su - yourname
```

#### 1.2 配置 SSH 密钥登录

```bash
# 在本地生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your-email@example.com"

# 复制公钥到服务器
ssh-copy-id yourname@your-server-ip

# 禁用 root SSH 登录
sudo nano /etc/ssh/sshd_config
```

修改以下配置：
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

重启 SSH 服务：
```bash
sudo systemctl restart sshd
```

#### 1.3 配置防火墙（UFW）

```bash
# 安装 UFW
sudo apt update
sudo apt install ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许特定 IP 访问（可选）
sudo ufw allow from your-ip-address to any

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

#### 1.4 安装 fail2ban（防暴力破解）

```bash
# 安装 fail2ban
sudo apt install fail2ban

# 创建自定义配置
sudo nano /etc/fail2ban/jail.local
```

添加以下内容：
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = your-email@example.com

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 86400
```

启动服务：
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 1.5 安装自动更新

```bash
# 安装 unattended-upgrades
sudo apt install unattended-upgrades

# 配置自动更新
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🐳 Docker 部署

### 2. 安装 Docker

```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 3. 创建 Docker Compose 配置

在服务器上创建项目目录：
```bash
mkdir -p ~/meme-master-pro
cd ~/meme-master-pro
```

创建 `docker-compose.yml`：
```bash
nano docker-compose.yml
```

添加以下内容：
```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: meme-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: memeuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: mememaster
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - meme-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U memeuser -d mememaster"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存（可选）
  redis:
    image: redis:7-alpine
    container_name: meme-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - meme-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Next.js 应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: meme-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://memeuser:${DB_PASSWORD}@postgres:5432/mememaster
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - ENCRYPTION_SALT=${ENCRYPTION_SALT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - meme-network
    volumes:
      - app_logs:/app/logs

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: meme-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - meme-network

volumes:
  postgres_data:
  redis_data:
  app_logs:
  nginx_logs:

networks:
  meme-network:
    driver: bridge
```

### 4. 创建 Dockerfile

```bash
nano Dockerfile
```

添加以下内容：
```dockerfile
# 基础镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 5. 创建环境变量文件

```bash
nano .env
```

添加以下内容（替换为你的实际值）：
```env
# 数据库密码（生成随机密码）
DB_PASSWORD=your_secure_database_password_here

# Redis 密码
REDIS_PASSWORD=your_secure_redis_password_here

# 加密密钥（必须设置！）
ENCRYPTION_KEY=d7c7b3485b5f9e68a6171cd951d12f7c0d658ce03804e731cc3bfd3bf3b0c25f
ENCRYPTION_SALT=194059a198168bda179a45ed149aa003

# 其他环境变量
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

⚠️ **重要**：生成新的随机密码：
```bash
# 生成数据库密码
openssl rand -base64 32

# 生成 Redis 密码
openssl rand -base64 32
```

### 6. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 查看服务状态
docker compose ps
```

---

## 🗄️ 数据库配置

### 7. 数据库备份策略

创建备份脚本：
```bash
nano ~/backup-db.sh
```

添加以下内容：
```bash
#!/bin/bash

# 备份目录
BACKUP_DIR="/home/yourname/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mememaster_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec meme-postgres pg_dump -U memeuser mememaster > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# 上传到云存储（可选）
# aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/

echo "Backup completed: $BACKUP_FILE.gz"
```

设置权限和定时任务：
```bash
chmod +x ~/backup-db.sh

# 添加到 crontab（每天凌晨 2 点备份）
crontab -e
```

添加以下行：
```
0 2 * * * /home/yourname/backup-db.sh >> /home/yourname/backup.log 2>&1
```

### 8. 数据库恢复

```bash
# 恢复数据库
gunzip < /path/to/backup.sql.gz | docker exec -i meme-postgres psql -U memeuser mememaster
```

---

## 🌐 反向代理配置

### 9. 配置 Nginx

创建 `nginx.conf`：
```bash
nano nginx.conf
```

添加以下内容：
```nginx
events {
    worker_connections 1024;
}

http {
    # 限流配置
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # 上传限制
    client_max_body_size 10M;

    # 隐藏 Nginx 版本
    server_tokens off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL 证书配置（见下文）
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 优化
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全限制
        limit_req zone=general burst=20 nodelay;
        limit_conn addr 10;

        # 代理配置
        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # API 路由额外限制
        location /api/ {
            limit_req zone=general burst=10 nodelay;
            proxy_pass http://app:3000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## 🔐 SSL 证书配置

### 10. 安装 Certbot

```bash
# 安装 Certbot
sudo apt install certbot

# 停止 Nginx（如果已启动）
docker compose stop nginx

# 获取 SSL 证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书到项目目录
sudo mkdir -p ~/meme-master-pro/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/meme-master-pro/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/meme-master-pro/ssl/

# 设置权限
sudo chown -R $USER:$USER ~/meme-master-pro/ssl
chmod 600 ~/meme-master-pro/ssl/*

# 重启 Nginx
docker compose start nginx
```

### 11. 自动续期证书

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加自动续期任务
crontab -e
```

添加以下行（每周一凌晨 3 点检查续期）：
```
0 3 * * 1 certbot renew --quiet && docker compose restart nginx
```

---

## 🛡️ 防火墙配置

### 12. 完整防火墙规则

```bash
# 查看当前规则
sudo ufw status numbered

# 只允许必要的端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 限制 Docker 网络
sudo ufw deny from 172.17.0.0/16
sudo ufw deny from 172.18.0.0/16

# 启用日志
sudo ufw logging on

# 重新加载
sudo ufw reload
```

---

## 📊 监控和维护

### 13. 安装监控工具

#### 安装 htop（系统监控）
```bash
sudo apt install htop
```

#### 安装 ncdu（磁盘使用）
```bash
sudo apt install ncdu
```

#### 安装 netdata（实时监控）
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

访问：`http://your-server-ip:19999`

### 14. 日志监控

创建日志监控脚本：
```bash
nano ~/monitor-logs.sh
```

```bash
#!/bin/bash

# 监控错误日志
docker compose logs --tail=100 app | grep -i "error" || echo "No errors found"

# 监控数据库日志
docker compose logs --tail=100 postgres | grep -i "error" || echo "No database errors found"

# 检查磁盘空间
df -h | grep -E "Filesystem|/dev/"

# 检查内存使用
free -h
```

### 15. 定期维护任务

```bash
# 清理 Docker 未使用的资源
docker system prune -a --volumes

# 清理旧的日志文件
find ~/meme-master-pro/app_logs -name "*.log" -mtime +30 -delete

# 更新系统
sudo apt update && sudo apt upgrade -y

# 重启服务（如果需要）
docker compose restart
```

---

## 💰 成本估算

### 月度成本（推荐配置）

| 项目 | 价格 | 说明 |
|------|------|------|
| 服务器（4核8GB） | $20-30 | Vultr/DigitalOcean |
| 域名 | $1-10/月 | .com 域名约 $10/年 |
| SSL 证书 | 免费 | Let's Encrypt |
| 数据库 | 已包含 | 使用 PostgreSQL Docker |
| 总计 | **$21-40/月** | |

### 年度成本
- **最低**：$240-360/年
- **推荐**：$360-480/年

---

## 🎯 快速部署清单

- [ ] 租赁服务器（推荐 4核8GB）
- [ ] 创建非 root 用户
- [ ] 配置 SSH 密钥登录
- [ ] 配置防火墙（UFW）
- [ ] 安装 Docker 和 Docker Compose
- [ ] 创建 docker-compose.yml
- [ ] 创建 Dockerfile
- [ ] 配置环境变量（.env）
- [ ] 配置 Nginx 反向代理
- [ ] 安装 SSL 证书
- [ ] 设置数据库自动备份
- [ ] 配置监控工具
- [ ] 测试所有功能

---

## 🔧 故障排查

### 常见问题

1. **容器无法启动**
   ```bash
   docker compose logs app
   docker compose ps
   ```

2. **数据库连接失败**
   ```bash
   docker compose logs postgres
   ```

3. **SSL 证书问题**
   ```bash
   sudo certbot certificates
   ```

4. **磁盘空间不足**
   ```bash
   df -h
   docker system prune -a --volumes
   ```

---

## 📞 支持

如有问题，请检查：
- Docker 日志：`docker compose logs -f`
- 系统日志：`sudo journalctl -xe`
- Nginx 日志：`docker compose logs nginx`

---

## ✅ 总结

使用自己的服务器部署有以下优势：

1. ✅ **完全控制**：完全掌控服务器和配置
2. ✅ **更高安全性**：可以实施更强的安全措施
3. ✅ **成本可控**：按月付费，价格透明
4. ✅ **数据安全**：数据完全在你控制下
5. ✅ **性能优化**：可以针对需求优化配置

**准备好开始部署了吗？**
