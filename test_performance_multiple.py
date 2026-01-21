#!/usr/bin/env python3

import requests
import time
import statistics

API_BASE = "http://localhost:5000/api"
WALLET_ID = "28d60621-57cd-4924-8d31-dae8f1986392"  # Solana钱包

def test_launch_and_sell(test_num):
    """测试一次完整的发币到卖出流程"""
    
    # 测试1：发币API（包含捆绑买入）
    print(f"  测试 #{test_num}: 发币中...", end=" ")
    launch_start_time = time.time()

    launch_payload = {
        "walletId": WALLET_ID,
        "chain": "solana",
        "platform": "raydium",
        "tokenName": f"TestToken{int(time.time())}{test_num}",
        "tokenSymbol": f"TEST{str(int(time.time()))[-4:]}{test_num}",
        "totalSupply": "1000000000",
        "liquidity": "10",
        "imageUrl": "",
        "imageKey": "",
        "bundleBuyEnabled": True,
        "useSpecifiedTokenForBundleBuy": False,
        "bundleBuyAmount": "0.1",
        "bundleBuyTokenSymbol": "",
        "website": "",
        "twitter": "",
        "telegram": "",
        "discord": "",
        "addLiquidity": True,
        "liquidityTokenPercent": "50",
        "pairTokenSymbol": "auto",
        "pairTokenAmount": "1",
        "lockLiquidity": True,
        "lockDuration": "7"
    }

    try:
        launch_response = requests.post(f"{API_BASE}/tokens/launch", json=launch_payload)
        launch_end_time = time.time()
        launch_time = launch_end_time - launch_start_time

        launch_data = launch_response.json()

        if launch_data.get("success"):
            token_address = launch_data.get("data", {}).get("token", {}).get("address")
            token_symbol = launch_data.get("data", {}).get("token", {}).get("symbol")
            
            print(f"\033[0;32m✓\033[0m ({launch_time:.3f}s)", end=" ")
            
            # 测试2：闪电卖出API
            print("卖出中...", end=" ")
            sell_start_time = time.time()

            sell_payload = {
                "walletId": WALLET_ID,
                "chain": "solana",
                "tokenAddress": token_address,
                "tokenSymbol": token_symbol,
                "amount": "500000000",
                "slippage": "5"
            }

            try:
                sell_response = requests.post(f"{API_BASE}/tokens/sell", json=sell_payload)
                sell_end_time = time.time()
                sell_time = sell_end_time - sell_start_time

                if sell_response.status_code == 200:
                    sell_data = sell_response.json()
                    if sell_data.get("success"):
                        print(f"\033[0;32m✓\033[0m ({sell_time:.3f}s)")
                        return launch_time, sell_time
                    else:
                        print(f"\033[0;31m✗\033[0m ({sell_time:.3f}s) - {sell_data.get('error', 'Unknown')}")
                        return launch_time, sell_time
                else:
                    print(f"\033[0;31m✗\033[0m ({sell_time:.3f}s) - HTTP {sell_response.status_code}")
                    return launch_time, sell_time
            except Exception as e:
                print(f"\033[0;31m✗\033[0m - {str(e)}")
                return launch_time, 0
        else:
            print(f"\033[0;31m✗\033[0m ({launch_time:.3f}s) - {launch_data.get('error', 'Unknown')}")
            return launch_time, 0
    except Exception as e:
        print(f"\033[0;31m✗\033[0m - {str(e)}")
        return 0, 0

def main():
    print("=" * 60)
    print("Meme Master Pro 性能测试 - 多轮测试")
    print("=" * 60)
    print()
    
    NUM_TESTS = 10
    launch_times = []
    sell_times = []
    total_times = []
    
    print(f"开始进行 {NUM_TESTS} 轮测试...\n")
    
    for i in range(1, NUM_TESTS + 1):
        launch_time, sell_time = test_launch_and_sell(i)
        
        if launch_time > 0 and sell_time > 0:
            launch_times.append(launch_time)
            sell_times.append(sell_time)
            total_times.append(launch_time + sell_time)
        
        # 短暂延迟，避免请求过快
        if i < NUM_TESTS:
            time.sleep(0.1)
    
    print()
    print("=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    if len(total_times) > 0:
        print(f"\n成功完成: {len(total_times)}/{NUM_TESTS} 轮测试\n")
        
        print("发币API性能:")
        print(f"  - 最快: {min(launch_times):.3f} 秒")
        print(f"  - 最慢: {max(launch_times):.3f} 秒")
        print(f"  - 平均: {statistics.mean(launch_times):.3f} 秒")
        print(f"  - 中位数: {statistics.median(launch_times):.3f} 秒")
        print(f"  - 标准差: {statistics.stdev(launch_times) if len(launch_times) > 1 else 0:.3f} 秒")
        
        print("\n闪电卖出API性能:")
        print(f"  - 最快: {min(sell_times):.3f} 秒")
        print(f"  - 最慢: {max(sell_times):.3f} 秒")
        print(f"  - 平均: {statistics.mean(sell_times):.3f} 秒")
        print(f"  - 中位数: {statistics.median(sell_times):.3f} 秒")
        print(f"  - 标准差: {statistics.stdev(sell_times) if len(sell_times) > 1 else 0:.3f} 秒")
        
        print("\n完整流程性能 (发币 -> 买入 -> 卖出):")
        print(f"  - 最快: {min(total_times):.3f} 秒")
        print(f"  - 最慢: {max(total_times):.3f} 秒")
        print(f"  - 平均: {statistics.mean(total_times):.3f} 秒")
        print(f"  - 中位数: {statistics.median(total_times):.3f} 秒")
        print(f"  - 标准差: {statistics.stdev(total_times) if len(total_times) > 1 else 0:.3f} 秒")
        
        avg_total = statistics.mean(total_times)
        print("\n性能评估:")
        if avg_total < 0.1:
            print(f"  \033[0;32m✓ 极快\033[0m - 平均全程 {avg_total:.3f} 秒 (< 0.1秒)")
        elif avg_total < 0.5:
            print(f"  \033[0;32m✓ 非常快\033[0m - 平均全程 {avg_total:.3f} 秒 (< 0.5秒)")
        elif avg_total < 1:
            print(f"  \033[0;32m✓ 快速\033[0m - 平均全程 {avg_total:.3f} 秒 (< 1秒)")
        elif avg_total < 3:
            print(f"  \033[1;33m⚠ 一般\033[0m - 平均全程 {avg_total:.3f} 秒 (< 3秒)")
        else:
            print(f"  \033[0;31m✗ 慢\033[0m - 平均全程 {avg_total:.3f} 秒 (> 3秒)")
    else:
        print("\033[0;31m测试失败，无法完成任何一轮测试\033[0m")
    
    print()

if __name__ == "__main__":
    main()
