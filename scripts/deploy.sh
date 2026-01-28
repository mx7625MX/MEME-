#!/bin/bash

# ============================================
# Meme Master Pro 自动化部署脚本
# ============================================
# 用途：一键部署到 Ubuntu 服务器
# 使用方法：bash deploy.sh
# ============================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
    print_error "请不要使用 root 用户运行此脚本！"
    print_info "请创建一个普通用户并使用 sudo 运行。"
    exit 1
fi

print_info "==================================="
print_info "Meme Master Pro 部署脚本"
print_info "==================================="

# ============================================
# 1. 系统更新
# ============================================
print_info "步骤 1/10: 更新系统..."
sudo apt update && sudo apt upgrade -y
print_success "系统更新完成"

# ============================================
# 2. 安装基础软件
# ============================================
print_info "步骤 2/10: 安装基础软件..."
sudo apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    ncdu \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

print_success "基础软件安装完成"

# ============================================
# 3. 配置防火墙
# ============================================
print_info "步骤 3/10: 配置防火墙..."

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
echo "y" | sudo ufw enable

print_success "防火墙配置完成"

# ============================================
# 4. 安装 Docker
# ============================================
print_info "步骤 4/10: 安装 Docker..."

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新包索引
sudo apt update

# 安装 Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

print_success "Docker 安装完成"
print_warning "请运行 'newgrp docker' 或重新登录以应用 docker 组权限"

# ============================================
# 5. 安装 Certbot（SSL 证书）
# ============================================
print_info "步骤 5/10: 安装 Certbot..."
sudo apt install -y certbot
print_success "Certbot 安装完成"

# ============================================
# 6. 配置 fail2ban
# ============================================
print_info "步骤 6/10: 配置 fail2ban..."

# 创建自定义配置
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = $USER@$(hostname)

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 86400
EOF

# 启动 fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

print_success "fail2ban 配置完成"

# ============================================
# 7. 创建项目目录
# ============================================
print_info "步骤 7/10: 创建项目目录..."

PROJECT_DIR="$HOME/meme-master-pro"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

print_success "项目目录创建完成: $PROJECT_DIR"

# ============================================
# 8. 生成随机密码和密钥
# ============================================
print_info "步骤 8/10: 生成安全密钥..."

# 生成数据库密码
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# 生成 Redis 密码
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# 生成加密密钥
ENCRYPTION_KEY=$(openssl rand -hex 32)
ENCRYPTION_SALT=$(openssl rand -hex 16)

print_success "安全密钥生成完成"

# ============================================
# 9. 创建环境变量文件
# ============================================
print_info "步骤 9/10: 创建环境变量文件..."

cat > .env <<EOF
# 数据库配置
DB_PASSWORD=$DB_PASSWORD

# Redis 配置
REDIS_PASSWORD=$REDIS_PASSWORD

# 加密密钥（必须保存！）
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_SALT=$ENCRYPTION_SALT

# 环境配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
EOF

# 设置权限
chmod 600 .env

print_success "环境变量文件创建完成"
print_warning "请保存以下信息到安全的地方："
echo ""
echo "=========================================="
echo "数据库密码: $DB_PASSWORD"
echo "Redis 密码: $REDIS_PASSWORD"
echo "加密密钥: $ENCRYPTION_KEY"
echo "加密盐值: $ENCRYPTION_SALT"
echo "=========================================="
echo ""

# ============================================
# 10. 创建部署文档
# ============================================
print_info "步骤 10/10: 创建部署说明..."

cat > DEPLOY_INSTRUCTIONS.md <<'EOF'
# 部署后续步骤

## 1. 上传项目代码

将项目代码上传到服务器：
```bash
cd ~/meme-master-pro
git clone https://github.com/mx7625MX/MEME-.git .
```

## 2. 配置域名

编辑 `.env` 文件，修改域名：
```bash
nano .env
```

将 `your-domain.com` 替换为你的实际域名。

## 3. 获取 SSL 证书

替换 `your-domain.com` 为你的域名：
```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

复制证书到项目目录：
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl
chmod 600 ssl/*
```

## 4. 启动服务

```bash
docker compose up -d
```

## 5. 查看日志

```bash
docker compose logs -f
```

## 6. 配置自动备份

创建备份脚本：
```bash
nano ~/backup-db.sh
```

添加以下内容：
```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec meme-postgres pg_dump -U memeuser mememaster > $BACKUP_DIR/mememaster_$DATE.sql
gzip $BACKUP_DIR/mememaster_$DATE.sql
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "Backup completed: $BACKUP_DIR/mememaster_$DATE.sql.gz"
```

设置权限和定时任务：
```bash
chmod +x ~/backup-db.sh
crontab -e
```

添加：
```
0 2 * * * /home/yourname/backup-db.sh
```

## 7. 监控服务状态

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f app

# 重启服务
docker compose restart
```

## 8. 访问应用

打开浏览器访问：`https://your-domain.com`

## 9. 更新应用

```bash
cd ~/meme-master-pro
git pull
docker compose up -d --build
```

## 10. 故障排查

查看详细日志：
```bash
docker compose logs app
docker compose logs postgres
docker compose logs nginx
```

进入容器调试：
```bash
docker exec -it meme-app bash
```
EOF

print_success "部署说明创建完成"

# ============================================
# 完成
# ============================================
echo ""
print_info "==================================="
print_success "部署准备完成！"
print_info "==================================="
echo ""
print_info "下一步操作："
echo "1. 查看 DEPLOY_INSTRUCTIONS.md 文件"
echo "2. 上传项目代码到服务器"
echo "3. 配置域名和 SSL 证书"
echo "4. 启动 Docker 服务"
echo ""
print_warning "重要提示："
echo "• 请将上面生成的密码和密钥保存到安全的地方"
echo "• 不要将 .env 文件提交到 Git"
echo "• 定期备份数据库"
echo ""
