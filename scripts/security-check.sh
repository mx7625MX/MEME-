#!/bin/bash

# ============================================
# 服务器安全检查脚本
# ============================================
# 用途：检查服务器安全配置
# 使用方法：bash security-check.sh
# ============================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}➤ $1${NC}"
    echo ""
}

# 检查函数
check_ssh_root_login() {
    if grep -q "^PermitRootLogin.*no" /etc/ssh/sshd_config; then
        print_info "Root SSH 登录已禁用"
        return 0
    else
        print_warning "Root SSH 登录未禁用"
        return 1
    fi
}

check_ssh_password_auth() {
    if grep -q "^PasswordAuthentication.*no" /etc/ssh/sshd_config; then
        print_info "SSH 密码认证已禁用"
        return 0
    else
        print_warning "SSH 密码认证未禁用"
        return 1
    fi
}

check_firewall() {
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            print_info "防火墙已启用"
            return 0
        else
            print_warning "防火墙未启用"
            return 1
        fi
    else
        print_error "UFW 未安装"
        return 1
    fi
}

check_fail2ban() {
    if systemctl is-active --quiet fail2ban; then
        print_info "Fail2ban 服务正在运行"
        return 0
    else
        print_warning "Fail2ban 服务未运行"
        return 1
    fi
}

check_automatic_updates() {
    if command -v unattended-upgrade &> /dev/null; then
        print_info "自动更新已安装"
        return 0
    else
        print_warning "自动更新未安装"
        return 1
    fi
}

check_docker_security() {
    # 检查 Docker 是否在运行
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            print_info "Docker 服务正在运行"

            # 检查是否有暴露的端口
            exposed_ports=$(docker ps --format "{{.Ports}}" | grep -o "0.0.0.0:[0-9]*" | cut -d: -f2 | sort -u)
            if [ -n "$exposed_ports" ]; then
                print_warning "Docker 容器暴露了以下端口到 0.0.0.0:"
                echo "$exposed_ports" | while read port; do
                    echo "  - 端口 $port"
                done
            else
                print_info "没有 Docker 容器暴露端口到 0.0.0.0"
            fi

            return 0
        else
            print_warning "Docker 服务未运行"
            return 1
        fi
    else
        print_warning "Docker 未安装"
        return 1
    fi
}

check_ssl_certificate() {
    if [ -d "/etc/letsencrypt/live" ]; then
        certificates=$(sudo find /etc/letsencrypt/live -mindepth 2 -maxdepth 2 -type d)
        if [ -n "$certificates" ]; then
            print_info "SSL 证书已安装:"
            echo "$certificates" | while read cert_path; do
                domain=$(basename "$cert_path")
                expiry=$(sudo openssl x509 -enddate -noout -in "$cert_path/fullchain.pem" | cut -d= -f2)
                echo "  - $domain (过期时间: $expiry)"
            done
            return 0
        else
            print_warning "未找到 SSL 证书"
            return 1
        fi
    else
        print_warning "Let's Encrypt 未安装"
        return 1
    fi
}

check_disk_space() {
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -lt 80 ]; then
        print_info "磁盘空间充足: ${disk_usage}% 已使用"
        return 0
    else
        print_warning "磁盘空间不足: ${disk_usage}% 已使用"
        return 1
    fi
}

check_memory_usage() {
    memory_usage=$(free | awk '/Mem/{printf("%.0f"), $3/$2 * 100.0}')
    if [ $(echo "$memory_usage < 80" | bc -l) -eq 1 ]; then
        print_info "内存使用正常: ${memory_usage}%"
        return 0
    else
        print_warning "内存使用较高: ${memory_usage}%"
        return 1
    fi
}

check_system_updates() {
    updates=$(apt list --upgradable 2>/dev/null | wc -l)
    if [ $updates -eq 0 ]; then
        print_info "系统已是最新版本"
        return 0
    else
        print_warning "有 $updates 个可用更新"
        return 1
    fi
}

check_failed_login_attempts() {
    if [ -f "/var/log/auth.log" ]; then
        failed_logins=$(sudo grep "Failed password" /var/log/auth.log | wc -l)
        if [ $failed_logins -eq 0 ]; then
            print_info "没有检测到失败的登录尝试"
            return 0
        else
            print_warning "检测到 $failed_logins 次失败的登录尝试"
            return 1
        fi
    fi
}

check_open_ports() {
    open_ports=$(ss -tuln | awk 'NR>1 {print $5}' | grep -o ":[0-9]*$" | cut -d: -f2 | sort -u | tr '\n' ' ')
    print_info "开放的端口: $open_ports"
}

check_system_time() {
    if systemctl is-active --quiet systemd-timesyncd; then
        print_info "时间同步服务正在运行"
        return 0
    else
        print_warning "时间同步服务未运行"
        return 1
    fi
}

# 主检查流程
clear
echo ""
print_header "服务器安全检查报告"
echo ""

# 基础安全检查
print_section "1. 基础安全配置"

check_ssh_root_login
check_ssh_password_auth
check_firewall
check_fail2ban
check_automatic_updates

# 系统状态检查
print_section "2. 系统状态"

check_disk_space
check_memory_usage
check_system_updates
check_system_time

# 服务安全检查
print_section "3. 服务安全"

check_docker_security
check_ssl_certificate

# 安全威胁检查
print_section "4. 安全威胁"

check_failed_login_attempts
check_open_ports

# 总结
echo ""
print_header "检查完成"
echo ""

# 生成报告文件
REPORT_FILE="/tmp/security-check-report.txt"
{
    echo "安全检查报告 - $(date)"
    echo "========================================"
    echo ""
} > "$REPORT_FILE"

echo "报告已保存到: $REPORT_FILE"

# 建议
echo ""
print_section "安全建议"

if ! check_ssh_root_login > /dev/null 2>&1; then
    echo "• 禁用 Root SSH 登录: 编辑 /etc/ssh/sshd_config，设置 PermitRootLogin no"
fi

if ! check_ssh_password_auth > /dev/null 2>&1; then
    echo "• 禁用 SSH 密码认证: 编辑 /etc/ssh/sshd_config，设置 PasswordAuthentication no"
fi

if ! check_firewall > /dev/null 2>&1; then
    echo "• 启用防火墙: sudo ufw enable"
fi

if ! check_fail2ban > /dev/null 2>&1; then
    echo "• 启用 Fail2ban: sudo systemctl enable fail2ban && sudo systemctl start fail2ban"
fi

if ! check_automatic_updates > /dev/null 2>&1; then
    echo "• 安装自动更新: sudo apt install unattended-upgrades"
fi

echo ""
print_info "定期运行此脚本以确保服务器安全：bash security-check.sh"
echo ""
