# Meme Master Pro 部署指南

## 目录
- [前置要求](#前置要求)
- [Docker 部署（推荐）](#docker-部署推荐)
- [手动部署](#手动部署)
- [云平台部署](#云平台部署)
- [常见问题](#常见问题)

---

## 前置要求

### 系统要求
- **操作系统**: Linux (Ubuntu 20.04+)、macOS 或 Windows (WSL2)
- **内存**: 最小 2GB，推荐 4GB+
- **磁盘**: 最小 10GB 可用空间
- **CPU**: 最小 2 核

### 软件要求
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 24+ (如果手动部署)
- **pnpm**: 9.0.0+

---

## Docker 部署（推荐）

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd meme-master-pro
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```bash
# 数据库配置
DATABASE_URL=postgresql://memeuser:memepassword123@localhost:5432/mememaster

# 钱包加密密钥（重要！请生成一个安全的随机字符串）
WALLET_ENCRYPTION_KEY=your-secure-random-key-here

# RPC 配置（可选）
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

### 3. 生成安全的加密密钥

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -base64 32
```

将生成的密钥填入 `.env` 文件的 `WALLET_ENCRYPTION_KEY`。

### 4. 一键部署

```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 测试应用
curl http://localhost:5000
```

### 6. 常用命令

```bash
# 查看日志
docker-compose logs -f app

# 重启应用
docker-compose restart app

# 停止服务
docker-compose down

# 停止服务并删除数据
docker-compose down -v

# 进入容器
docker-compose exec app bash

# 更新代码
git pull
docker-compose up -d --build
```

---

## 手动部署

### 1. 安装依赖

**Ubuntu/Debian:**
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm@9.0.0

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

**macOS:**
```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装依赖
brew install node@24 pnpm postgresql
```

### 2. 配置数据库

```bash
# 启动 PostgreSQL
sudo systemctl start postgresql

# 创建用户和数据库
sudo -u postgres psql << EOF
CREATE USER memeuser WITH PASSWORD 'memepassword123';
CREATE DATABASE mememaster OWNER memeuser;
GRANT ALL PRIVILEGES ON DATABASE mememaster TO memeuser;
EOF
```

### 3. 安装项目依赖

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 构建项目
pnpm run build
```

### 4. 配置环境变量

```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件，配置数据库连接：
```bash
DATABASE_URL=postgresql://memeuser:memepassword123@localhost:5432/mememaster
```

### 5. 启动应用

**开发模式:**
```bash
pnpm run dev
```

**生产模式:**
```bash
pnpm run build
pnpm run start
```

### 6. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start "pnpm run start" --name meme-master

# 查看状态
pm2 status

# 查看日志
pm2 logs meme-master

# 重启应用
pm2 restart meme-master

# 设置开机自启
pm2 startup
pm2 save
```

---

## 云平台部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署（自动）

### Railway 部署

1. 连接 GitHub 仓库
2. 添加 PostgreSQL 插件
3. 配置环境变量
4. 部署

### AWS ECS 部署

1. 创建 ECR 仓库
2. 推送 Docker 镜像
3. 创建 ECS 任务定义
4. 配置负载均衡器
5. 部署服务

---

## 生产环境优化

### 1. 使用 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install -y nginx

# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/meme-master

# 创建软链接
sudo ln -s /etc/nginx/sites-available/meme-master /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 2. 配置 SSL 证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 3. 配置防火墙

```bash
# UFW 防火墙
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. 定期备份

```bash
# 备份数据库
docker exec meme-master-postgres pg_dump -U memeuser mememaster > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i meme-master-postgres psql -U memeuser mememaster < backup_20250127.sql
```

---

## 常见问题

### 1. 数据库连接失败

**错误信息**: `Connection refused`

**解决方案:**
- 检查 PostgreSQL 是否运行
- 检查 DATABASE_URL 配置
- 检查防火墙设置

### 2. 端口被占用

**错误信息**: `Port 5000 is already in use`

**解决方案:**
```bash
# 查找占用端口的进程
lsof -i :5000

# 杀死进程
kill -9 <PID>

# 或修改端口
export PORT=3000
```

### 3. 依赖安装失败

**解决方案:**
```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install
```

### 4. Docker 容器无法启动

**解决方案:**
```bash
# 查看日志
docker-compose logs app

# 重新构建
docker-compose build --no-cache

# 检查磁盘空间
df -h
```

---

## 监控和维护

### 应用监控

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs postgres

# 查看容器资源使用
docker stats
```

### 性能优化

1. **数据库优化**
   - 定期 VACUUM
   - 创建索引
   - 调整连接池大小

2. **应用优化**
   - 启用 CDN
   - 配置缓存
   - 压缩静态资源

3. **安全加固**
   - 定期更新依赖
   - 配置防火墙
   - 启用 HTTPS

---

## 技术支持

如有问题，请提交 Issue 或联系技术支持。
