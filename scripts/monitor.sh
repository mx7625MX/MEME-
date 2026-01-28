#!/bin/bash

# ============================================
# 服务器监控脚本
# ============================================
# 用途：实时监控服务器状态和应用健康
# 使用方法：bash monitor.sh
# ============================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_section() {
    echo ""
    echo -e "${CYAN}➤ $1${NC}"
    echo ""
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取 CPU 使用率
get_cpu_usage() {
    echo $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
}

# 获取内存使用率
get_memory_usage() {
    free | awk '/Mem/{printf("%.1f"), $3/$2 * 100.0}'
}

# 获取磁盘使用率
get_disk_usage() {
    df -h / | awk 'NR==2 {print $5}' | sed 's/%//'
}

# 获取网络连接数
get_network_connections() {
    ss -s | awk '/TCP:/ {print $4}'
}

# 监控 Docker 容器
monitor_docker_containers() {
    print_section "Docker 容器状态"

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        return 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行"
        return 1
    fi

    # 显示容器状态
    echo -e "${CYAN}容器名称${NC} | ${CYAN}状态${NC} | ${CYAN}CPU${NC} | ${CYAN}内存${NC}"
    echo "----------------------------------------"

    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n +2

    echo ""

    # 检查是否有异常容器
    unhealthy_containers=$(docker ps -q --filter "health=unhealthy")
    if [ -n "$unhealthy_containers" ]; then
        print_warning "检测到不健康的容器:"
        echo "$unhealthy_containers" | while read container_id; do
            docker inspect --format='{{.Name}}: {{.State.Health.Status}}' "$container_id"
        done
    else
        print_info "所有容器状态正常"
    fi
}

# 监控应用日志
monitor_app_logs() {
    print_section "应用错误日志（最近 50 行）"

    cd ~/meme-master-pro 2>/dev/null || {
        print_warning "未找到项目目录"
        return 1
    }

    if docker compose ps app &> /dev/null; then
        docker compose logs --tail=50 app 2>&1 | grep -i "error\|exception\|fatal" || print_info "没有检测到错误"
    else
        print_warning "应用容器未运行"
    fi
}

# 监控数据库
monitor_database() {
    print_section "数据库状态"

    cd ~/meme-master-pro 2>/dev/null || {
        print_warning "未找到项目目录"
        return 1
    }

    if docker compose ps postgres &> /dev/null; then
        # 检查数据库连接
        if docker exec meme-postgres pg_isready -U memeuser &> /dev/null; then
            print_info "数据库连接正常"

            # 显示数据库大小
            db_size=$(docker exec meme-postgres psql -U memeuser -d mememaster -t -c "SELECT pg_size_pretty(pg_database_size('mememaster'));" | xargs)
            echo "  数据库大小: $db_size"

            # 显示连接数
            connections=$(docker exec meme-postgres psql -U memeuser -d mememaster -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)
            echo "  活动连接: $connections"
        else
            print_error "数据库连接失败"
        fi
    else
        print_warning "数据库容器未运行"
    fi
}

# 监控系统资源
monitor_system_resources() {
    print_section "系统资源使用情况"

    # CPU 使用率
    cpu_usage=$(get_cpu_usage)
    echo -e "CPU 使用率: ${CYAN}${cpu_usage}%${NC}"

    # 内存使用率
    memory_usage=$(get_memory_usage)
    echo -e "内存使用率: ${CYAN}${memory_usage}%${NC}"

    # 磁盘使用率
    disk_usage=$(get_disk_usage)
    if [ $disk_usage -gt 80 ]; then
        echo -e "磁盘使用率: ${RED}${disk_usage}%${NC} (警告)"
    else
        echo -e "磁盘使用率: ${CYAN}${disk_usage}%${NC}"
    fi

    # 网络连接
    network_conn=$(get_network_connections)
    echo -e "网络连接数: ${CYAN}${network_conn}${NC}"

    # 系统负载
    load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo -e "系统负载: ${CYAN}${load_avg}${NC}"

    echo ""
    # 磁盘详细信息
    df -h | grep -E "^/dev|^Filesystem"
}

# 监控安全事件
monitor_security_events() {
    print_section "安全事件"

    # 检查失败的登录尝试（最近 1 小时）
    failed_logins=$(sudo grep "Failed password" /var/log/auth.log 2>/dev/null | grep "$(date +%Y-%m-%d)" | wc -l)
    if [ $failed_logins -gt 0 ]; then
        print_warning "今天检测到 $failed_logins 次失败的登录尝试"
    else
        print_info "没有检测到失败的登录尝试"
    fi

    # 检查防火墙状态
    if ufw status | grep -q "Status: active"; then
        print_info "防火墙已启用"
    else
        print_error "防火墙未启用"
    fi
}

# 监控 SSL 证书
monitor_ssl_certificates() {
    print_section "SSL 证书状态"

    if [ -d "/etc/letsencrypt/live" ]; then
        certificates=$(sudo find /etc/letsencrypt/live -mindepth 2 -maxdepth 2 -type d)
        if [ -n "$certificates" ]; then
            echo "$certificates" | while read cert_path; do
                domain=$(basename "$cert_path")
                expiry=$(sudo openssl x509 -enddate -noout -in "$cert_path/fullchain.pem" | cut -d= -f2)
                expiry_date=$(date -d "$expiry" +%s)
                current_date=$(date +%s)
                days_left=$(( ($expiry_date - $current_date) / 86400 ))

                if [ $days_left -lt 7 ]; then
                    print_error "$domain: 将在 $days_left 天后过期！"
                elif [ $days_left -lt 30 ]; then
                    print_warning "$domain: 将在 $days_left 天后过期"
                else
                    print_info "$domain: 有效期还有 $days_left 天"
                fi
            done
        else
            print_warning "未找到 SSL 证书"
        fi
    else
        print_warning "Let's Encrypt 未安装"
    fi
}

# 主监控流程
clear
print_header "服务器实时监控"
echo ""

while true; do
    clear
    print_header "服务器实时监控 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # 系统资源
    monitor_system_resources

    # Docker 容器
    monitor_docker_containers

    # 数据库
    monitor_database

    # 安全事件
    monitor_security_events

    # SSL 证书
    monitor_ssl_certificates

    # 应用日志
    monitor_app_logs

    # 下次刷新时间
    echo ""
    echo -e "${CYAN}按 Ctrl+C 退出，将在 30 秒后自动刷新...${NC}"

    # 等待 30 秒
    sleep 30
done
