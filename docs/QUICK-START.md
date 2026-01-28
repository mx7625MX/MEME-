# 🚀 快速开始指南 - 服务器部署

## 📖 目录

1. [前期准备](#前期准备)
2. [一键部署](#一键部署)
3. [安全检查](#安全检查)
4. [监控服务器](#监控服务器)
5. [常见问题](#常见问题)

---

## 🔧 前期准备

### 1. 租赁服务器

推荐配置（月费 $20-30）：
- **CPU**: 4 核
- **内存**: 8 GB
- **存储**: 80 GB SSD
- **服务商**: Vultr 或 DigitalOcean

### 2. 购买域名

推荐域名注册商：
- Namecheap（便宜）
- GoDaddy（服务好）
- 阿里云（国内快）

### 3. 域名 DNS 配置

将域名的 A 记录指向服务器 IP：
```
类型: A
主机: @
值: 你的服务器IP
TTL: 600

类型: A
主机: www
值: 你的服务器IP
TTL: 600
```

---

## ⚡ 一键部署

### 步骤 1: SSH 登录服务器

```bash
ssh root@your-server-ip
```

### 步骤 2: 创建用户并配置 SSH

```bash
# 创建新用户
adduser yourname
usermod -aG sudo yourname

# 在本地生成 SSH 密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 复制公钥到服务器
ssh-copy-id yourname@your-server-ip

# 切换到新用户
su - yourname
```

### 步骤 3: 下载并运行部署脚本

```bash
# 下载脚本
curl -O https://raw.githubusercontent.com/mx7625MX/MEME-/main/scripts/deploy.sh

# 添加执行权限
chmod +x deploy.sh

# 运行部署脚本
bash deploy.sh
```

### 步骤 4: 上传项目代码

```bash
cd ~/meme-master-pro
git clone https://github.com/mx7625MX/MEME-.git .
```

### 步骤 5: 配置环境变量

```bash
nano .env
```

修改域名：
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 步骤 6: 获取 SSL 证书

```bash
# 替换 your-domain.com 为你的域名
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl
chmod 600 ssl/*
```

### 步骤 7: 启动服务

```bash
# 应用 docker 组权限（新终端）
newgrp docker

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 步骤 8: 访问应用

打开浏览器访问：`https://your-domain.com`

---

## 🔒 安全检查

定期运行安全检查脚本：

```bash
# 下载脚本
curl -O https://raw.githubusercontent.com/mx7625MX/MEME-/main/scripts/security-check.sh

# 添加执行权限
chmod +x security-check.sh

# 运行安全检查
bash security-check.sh
```

**建议每周运行一次。**

---

## 📊 监控服务器

实时监控服务器状态：

```bash
# 下载脚本
curl -O https://raw.githubusercontent.com/mx7625MX/MEME-/main/scripts/monitor.sh

# 添加执行权限
chmod +x monitor.sh

# 运行监控（自动刷新）
bash monitor.sh
```

**监控内容**：
- CPU、内存、磁盘使用率
- Docker 容器状态
- 数据库连接状态
- 安全事件
- SSL 证书有效期

---

## ❓ 常见问题

### 1. Docker 无法启动？

```bash
# 应用 docker 组权限
newgrp docker

# 检查 Docker 状态
sudo systemctl status docker
```

### 2. SSL 证书获取失败？

确保：
- 域名 DNS 已正确配置
- 防火墙允许 80 和 443 端口
- Nginx 未运行

```bash
# 检查防火墙
sudo ufw status

# 停止 Nginx（如果已运行）
docker compose stop nginx
```

### 3. 应用无法访问？

```bash
# 查看日志
docker compose logs -f app

# 重启服务
docker compose restart

# 检查容器状态
docker compose ps
```

### 4. 数据库连接失败？

```bash
# 检查数据库状态
docker compose logs postgres

# 进入数据库容器
docker exec -it meme-postgres psql -U memeuser -d mememaster
```

### 5. 磁盘空间不足？

```bash
# 清理 Docker 未使用的资源
docker system prune -a --volumes

# 查看磁盘使用
df -h

# 清理旧的日志文件
find ~/meme-master-pro/app_logs -name "*.log" -mtime +30 -delete
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：`docker compose logs -f`
2. **检查安全**：`bash security-check.sh`
3. **监控状态**：`bash monitor.sh`
4. **查看文档**：`docs/DEPLOYMENT-GUIDE.md`

---

## ✅ 部署检查清单

部署完成后，确认以下事项：

- [ ] 服务正常运行
- [ ] SSL 证书已安装
- [ ] 防火墙已配置
- [ ] 数据库备份已设置
- [ ] 监控脚本已配置
- [ ] 安全检查通过
- [ ] 应用可以正常访问

---

## 💰 成本估算

| 项目 | 价格 | 说明 |
|------|------|------|
| 服务器（4核8GB） | $20-30/月 | Vultr/DigitalOcean |
| 域名 | $10/年 | .com 域名 |
| SSL 证书 | 免费 | Let's Encrypt |
| **总计** | **$250-370/年** | |

---

## 🎯 下一步

1. ✅ 完成基础部署
2. 🔒 运行安全检查
3. 📊 设置监控
4. 💾 配置自动备份
5. 🚀 开始使用

**祝部署顺利！**
