#!/usr/bin/env python3

import requests
import time
import json

API_BASE = "http://localhost:5000/api"
WALLET_ID = "28d60621-57cd-4924-8d31-dae8f1986392"  # Solana钱包

print("=" * 50)
print("Meme Master Pro 性能测试")
print("=" * 50)
print()

# 测试1：发币API（包含捆绑买入）
print("\033[1;33m[测试1] 发币API (包含捆绑买入)\033[0m")
start_time = time.time()

launch_payload = {
    "walletId": WALLET_ID,
    "chain": "solana",
    "platform": "raydium",
    "tokenName": f"TestToken{int(time.time())}",
    "tokenSymbol": f"TEST{str(int(time.time()))[-4:]}",
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
    launch_time = launch_end_time - start_time

    launch_data = launch_response.json()

    if launch_data.get("success"):
        print(f"\033[0;32m✓ 发币成功\033[0m")
        print(f"响应时间: {launch_time:.3f} 秒")

        token_address = launch_data.get("data", {}).get("token", {}).get("address")
        token_symbol = launch_data.get("data", {}).get("token", {}).get("symbol")

        print(f"代币地址: {token_address}")
        print(f"代币符号: {token_symbol}")
    else:
        print(f"\033[0;31m✗ 发币失败\033[0m")
        print(f"错误: {launch_data.get('error', 'Unknown error')}")
        exit(1)
except Exception as e:
    print(f"\033[0;31m✗ 发币请求失败\033[0m")
    print(f"错误: {str(e)}")
    exit(1)

print()

# 测试2：闪电卖出API
print("\033[1;33m[测试2] 闪电卖出API\033[0m")
sell_start_time = time.time()

sell_payload = {
    "walletId": WALLET_ID,
    "tokenAddress": token_address,
    "tokenSymbol": token_symbol,
    "amount": "500000000",
    "slippage": "5"
}

try:
    sell_response = requests.post(f"{API_BASE}/portfolios/sell", json=sell_payload)
    sell_end_time = time.time()
    sell_time = sell_end_time - sell_start_time

    sell_data = sell_response.json()

    if sell_data.get("success"):
        print(f"\033[0;32m✓ 卖出成功\033[0m")
        print(f"响应时间: {sell_time:.3f} 秒")
    else:
        print(f"\033[0;31m✗ 卖出失败\033[0m")
        print(f"错误: {sell_data.get('error', 'Unknown error')}")
except Exception as e:
    print(f"\033[0;31m✗ 卖出请求失败\033[0m")
    print(f"错误: {str(e)}")

print()

# 汇总结果
total_time = launch_time + sell_time
avg_time = total_time / 2

print("=" * 50)
print("\033[1;33m测试结果汇总\033[0m")
print("=" * 50)
print(f"发币时间: {launch_time:.3f} 秒")
print(f"卖出时间: {sell_time:.3f} 秒")
print(f"\033[0;32m总时间: {total_time:.3f} 秒\033[0m")
print()
print("平均每步耗时:")
print(f"  - 平均: {avg_time:.3f} 秒/步")
print()
