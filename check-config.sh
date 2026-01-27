#!/bin/bash

# ============================================
# 配置检查脚本
# ============================================
# 用途：检查环境变量和配置是否正确
# ============================================

echo "=========================================="
echo "  配置检查脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查计数
CHECKS_PASSED=0
CHECKS_FAILED=0

# 打印结果
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((CHECKS_FAILED++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================
# 检查 1：环境变量
# ============================================
echo "📋 检查环境变量..."
echo ""

# 检查 DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    if [[ $DATABASE_URL == postgresql://* ]]; then
        print_result 0 "DATABASE_URL 格式正确"
    else
        print_result 1 "DATABASE_URL 格式错误（应以 postgresql:// 开头）"
    fi
else
    print_result 1 "DATABASE_URL 未设置"
fi

# 检查 WALLET_PRIVATE_KEY
if [ -n "$WALLET_PRIVATE_KEY" ]; then
    if [[ $WALLET_PRIVATE_KEY == 0x* ]] && [ ${#WALLET_PRIVATE_KEY} -eq 66 ]; then
        print_result 0 "WALLET_PRIVATE_KEY 格式正确"
    else
        print_result 1 "WALLET_PRIVATE_KEY 格式错误（应为 66 字符，以 0x 开头）"
    fi
else
    print_result 1 "WALLET_PRIVATE_KEY 未设置"
fi

# 检查 SOLANA_RPC_URL
if [ -n "$SOLANA_RPC_URL" ]; then
    print_result 0 "SOLANA_RPC_URL 已设置"
else
    print_warning "SOLANA_RPC_URL 未设置（将使用默认值）"
fi

# 检查 JITO_RPC_URL（可选）
if [ -n "$JITO_RPC_URL" ]; then
    print_result 0 "JITO_RPC_URL 已设置"
else
    print_warning "JITO_RPC_URL 未设置（可选，不影响基本功能）"
fi

# 检查 JITO_BUNDLE_URL（可选）
if [ -n "$JITO_BUNDLE_URL" ]; then
    print_result 0 "JITO_BUNDLE_URL 已设置"
else
    print_warning "JITO_BUNDLE_URL 未设置（可选，不影响基本功能）"
fi

echo ""

# ============================================
# 检查 2：文件结构
# ============================================
echo "📋 检查文件结构..."
echo ""

# 检查关键文件
FILES=(
    "package.json"
    "next.config.ts"
    "tsconfig.json"
    ".env.local"
    "src/app/page.tsx"
    "src/services/blockchain/jitoService.ts"
    "src/lib/jitoKeyManager.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result 0 "文件存在: $file"
    else
        print_result 1 "文件缺失: $file"
    fi
done

echo ""

# ============================================
# 检查 3：依赖
# ============================================
echo "📋 检查依赖..."
echo ""

# 检查 node_modules
if [ -d "node_modules" ]; then
    print_result 0 "node_modules 目录存在"
else
    print_result 1 "node_modules 目录不存在（请运行: pnpm install）"
fi

# 检查关键依赖
if [ -f "package.json" ]; then
    DEPS=(
        "next"
        "react"
        "@solana/web3.js"
        "coze-coding-dev-sdk"
    )

    for dep in "${DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            print_result 0 "依赖已安装: $dep"
        else
            print_result 1 "依赖缺失: $dep"
        fi
    done
fi

echo ""

# ============================================
# 检查 4：Git 配置
# ============================================
echo "📋 检查 Git 配置..."
echo ""

if [ -d ".git" ]; then
    print_result 0 "Git 仓库已初始化"

    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        print_result 0 "远程仓库已连接: $REMOTE_URL"
    else
        print_warning "远程仓库未连接"
    fi
else
    print_result 1 "Git 仓库未初始化"
fi

echo ""

# ============================================
# 检查 5：Vercel 配置
# ============================================
echo "📋 检查 Vercel 配置..."
echo ""

if [ -f ".vercel/project.json" ]; then
    print_result 0 "Vercel 项目已配置"

    PROJECT_ID=$(grep -o '"projectId":"[^"]*"' .vercel/project.json | cut -d'"' -f4)
    ORG_ID=$(grep -o '"orgId":"[^"]*"' .vercel/project.json | cut -d'"' -f4)

    echo "   - Project ID: $PROJECT_ID"
    echo "   - Org ID: $ORG_ID"
else
    print_warning "Vercel 项目未配置（请运行: vercel）"
fi

echo ""

# ============================================
# 检查 6：构建测试
# ============================================
echo "📋 测试构建..."
echo ""

print_warning "正在运行 TypeScript 类型检查..."
if pnpm exec tsc --noEmit &> /dev/null; then
    print_result 0 "TypeScript 类型检查通过"
else
    print_result 1 "TypeScript 类型检查失败"
fi

echo ""

# ============================================
# 总结
# ============================================
echo "=========================================="
echo "  检查总结"
echo "=========================================="
echo ""

echo -e "${GREEN}✅ 通过: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ 失败: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！可以开始部署了。${NC}"
    echo ""
    echo "下一步："
    echo "1. 运行部署脚本: ./quick-deploy.sh"
    echo "2. 或者手动部署: vercel --prod"
else
    echo -e "${RED}⚠️  发现 $CHECKS_FAILED 个问题，请修复后再部署。${NC}"
    echo ""
    echo "常见解决方案："
    echo "- 缺失文件: 检查项目是否完整"
    echo "- 依赖问题: 运行 pnpm install"
    echo "- Git 问题: 运行 git init"
    echo "- 环境变量: 检查 .env.local 文件"
fi

echo ""
echo "=========================================="

# 返回检查结果
if [ $CHECKS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
