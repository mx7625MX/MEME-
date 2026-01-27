#!/bin/bash

# ============================================
# 快速部署脚本 - Vercel + Supabase
# ============================================
# 用途：单人用户快速部署 Meme Master Pro
# 耗时：约 30 分钟
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Meme Master Pro - 快速部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

# ============================================
# 步骤 1：检查前置条件
# ============================================
print_step "步骤 1/7：检查前置条件"

# 检查 Git
if ! command -v git &> /dev/null; then
    print_error "Git 未安装，请先安装 Git"
    exit 1
fi
print_success "Git 已安装"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js"
    exit 1
fi
print_success "Node.js 已安装"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm
fi
print_success "pnpm 已安装"

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI 未安装，正在安装..."
    pnpm add -g vercel
fi
print_success "Vercel CLI 已安装"

echo ""

# ============================================
# 步骤 2：初始化 Git 仓库
# ============================================
print_step "步骤 2/7：初始化 Git 仓库"

if [ -d ".git" ]; then
    print_warning "Git 仓库已存在，跳过初始化"
else
    git init
    print_success "Git 仓库已初始化"

    git add .
    print_success "文件已添加到暂存区"

    git commit -m "Initial commit: Meme Master Pro"
    print_success "已创建初始提交"
fi

echo ""

# ============================================
# 步骤 3：连接 GitHub
# ============================================
print_step "步骤 3/7：连接 GitHub 仓库"

read -p "请输入你的 GitHub 用户名: " GITHUB_USERNAME
read -p "请输入你的仓库名称 (默认: meme-master-pro): " REPO_NAME
REPO_NAME=${REPO_NAME:-meme-master-pro}

# 检查是否已连接远程仓库
if git remote get-url origin &> /dev/null; then
    print_warning "远程仓库已存在，跳过连接"
else
    GITHUB_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

    print_warning "请先在 GitHub 上创建仓库: https://github.com/new"
    read -p "仓库创建完成后按回车继续..."

    git remote add origin $GITHUB_URL
    print_success "已连接到 GitHub 仓库"

    git branch -M main

    print_warning "正在推送到 GitHub..."
    git push -u origin main
    print_success "代码已推送到 GitHub"
fi

echo ""

# ============================================
# 步骤 4：配置环境变量
# ============================================
print_step "步骤 4/7：配置环境变量"

read -p "请输入 Supabase DATABASE_URL: " DATABASE_URL
read -p "请输入钱包私钥 (0x...): " WALLET_PRIVATE_KEY
read -p "请输入 Solana RPC URL (默认: https://api.mainnet-beta.solana.com): " SOLANA_RPC_URL
SOLANA_RPC_URL=${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}
read -p "请输入 Jito RPC URL (可选，直接回车跳过): " JITO_RPC_URL
read -p "请输入 Jito Bundle URL (可选，直接回车跳过): " JITO_BUNDLE_URL

print_success "环境变量配置完成"

echo ""

# ============================================
# 步骤 5：部署到 Vercel
# ============================================
print_step "步骤 5/7：部署到 Vercel"

# 检查是否已登录 Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "需要登录 Vercel..."
    vercel login
    print_success "已登录 Vercel"
fi

# 首次部署
print_warning "正在部署到 Vercel..."
vercel

print_success "预览部署完成"

echo ""

# ============================================
# 步骤 6：配置生产环境变量
# ============================================
print_step "步骤 6/7：配置生产环境变量"

print_warning "正在配置环境变量..."

vercel env add DATABASE_URL production <<< $DATABASE_URL
print_success "DATABASE_URL 已配置"

vercel env add WALLET_PRIVATE_KEY production <<< $WALLET_PRIVATE_KEY
print_success "WALLET_PRIVATE_KEY 已配置"

vercel env add SOLANA_RPC_URL production <<< $SOLANA_RPC_URL
print_success "SOLANA_RPC_URL 已配置"

if [ -n "$JITO_RPC_URL" ]; then
    vercel env add JITO_RPC_URL production <<< $JITO_RPC_URL
    print_success "JITO_RPC_URL 已配置"
fi

if [ -n "$JITO_BUNDLE_URL" ]; then
    vercel env add JITO_BUNDLE_URL production <<< $JITO_BUNDLE_URL
    print_success "JITO_BUNDLE_URL 已配置"
fi

echo ""

# ============================================
# 步骤 7：部署到生产环境
# ============================================
print_step "步骤 7/7：部署到生产环境"

print_warning "正在部署到生产环境..."
vercel --prod

print_success "生产环境部署完成！"

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署成功！${NC}"
echo "=========================================="
echo ""
echo "接下来的步骤："
echo ""
echo "1. 📊 初始化 Supabase 数据库"
echo "   - 访问: https://app.supabase.com"
echo "   - 创建新项目"
echo "   - 复制 SQL 脚本并执行"
echo ""
echo "2. 🔐 配置 Jito（可选）"
echo "   - 访问: https://www.jito.wtf"
echo "   - 获取 Shred Key"
echo "   - 在应用设置中配置"
echo ""
echo "3. 🧪 测试交易"
echo "   - 创建测试钱包"
echo "   - 充入少量 SOL"
echo "   - 执行测试交易"
echo ""
echo "4. 📱 访问应用"
echo "   - 应用 URL: https://$REPO_NAME.vercel.app"
echo ""
echo "=========================================="
echo ""
print_warning "提示："
echo "- 查看日志: vercel logs"
echo "- 更新应用: git push origin main"
echo "- 查看数据库: Supabase Dashboard"
echo ""
