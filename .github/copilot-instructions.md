# GitHub Copilot 指令 / Copilot Instructions

## 项目概述 / Project Overview

这是一个基于 Next.js 16 + shadcn/ui 的全栈区块链应用，集成了 Solana 钱包管理、代币交易、市场分析等功能。

This is a full-stack blockchain application built with Next.js 16 + shadcn/ui, featuring Solana wallet management, token trading, and market analysis capabilities.

## 核心原则 / Core Principles

### 代码审查和错误修复 / Code Review and Error Fixing

在生成或修改代码时，始终遵循以下原则：

1. **类型安全优先** / **Type Safety First**
   - 始终使用 TypeScript 并提供完整的类型定义
   - 避免使用 `any` 类型，使用具体类型或泛型
   - 为所有函数参数和返回值添加类型注解

2. **错误处理** / **Error Handling**
   - 所有异步操作必须包含 try-catch 块
   - API 调用必须处理网络错误和超时
   - 区块链交易必须处理失败和回滚场景
   - 使用有意义的错误消息

3. **代码质量** / **Code Quality**
   - 遵循 ESLint 配置的规则
   - 保持函数简洁，单一职责原则
   - 避免重复代码，提取可复用逻辑
   - 添加必要的注释说明复杂逻辑

## 技术栈 / Tech Stack

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **表单**: React Hook Form + Zod
- **区块链**: Solana Web3.js, SPL Token
- **数据库**: Drizzle ORM + PostgreSQL
- **包管理器**: pnpm 9+ (必须使用)

## 开发规范 / Development Standards

### 1. 组件开发 / Component Development

```tsx
// ✅ 推荐：使用 shadcn/ui 基础组件
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ✅ 推荐：明确的类型定义
interface MyComponentProps {
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
}

// ✅ 推荐：服务端组件（默认）
export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  return <Card>...</Card>;
}

// ✅ 客户端组件必须显式标记（'use client' 必须在文件最顶部）
// 文件: src/components/example.tsx
'use client';

export default function ClientComponent() {
  // ...
}
```

### 2. API 路由 / API Routes

```tsx
// src/app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ✅ 推荐：完整的错误处理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入
    if (!body.data) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // 处理逻辑（假设 processData 函数已定义）
    const result = await processData(body.data);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. 区块链集成 / Blockchain Integration

```tsx
// ✅ 推荐：处理区块链交易错误
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';

async function sendTransaction(
  wallet: { publicKey?: PublicKey },
  transaction: Transaction,
  signer: Keypair
) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL!);
    
    // 验证钱包连接
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // 执行交易
    const signature = await connection.sendTransaction(transaction, [signer]);
    
    // 等待确认
    await connection.confirmTransaction(signature, 'confirmed');
    
    return { success: true, signature };
  } catch (error) {
    // 区分不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        throw new Error('余额不足');
      }
      if (error.message.includes('rejected')) {
        throw new Error('用户取消交易');
      }
    }
    throw error;
  }
}
```

### 4. 表单验证 / Form Validation

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// ✅ 推荐：使用 Zod 进行完整的表单验证
const formSchema = z.object({
  walletAddress: z.string()
    .min(32, '钱包地址格式错误')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, '无效的 Base58 地址'),
  amount: z.number()
    .positive('金额必须大于 0')
    .max(1000000, '金额超过限制'),
  slippage: z.number()
    .min(0.1, '滑点不能小于 0.1%')
    .max(50, '滑点不能大于 50%'),
});

type FormData = z.infer<typeof formSchema>;

export function TransactionForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walletAddress: '',
      amount: 0,
      slippage: 0.5,
    },
  });
  
  // ...
}
```

### 5. 数据库操作 / Database Operations

```tsx
import { db } from '@/lib/db';
import { users, wallets } from '@/lib/schema';

// ✅ 推荐：使用事务处理相关操作
// 假设 UserData 类型已定义
async function createUserWithWallet(userData: UserData) {
  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(userData).returning();
    
    const [wallet] = await tx.insert(wallets).values({
      userId: user.id,
      address: userData.walletAddress,
    }).returning();
    
    return { user, wallet };
  });
}
```

### 6. 环境变量 / Environment Variables

```tsx
// ✅ 推荐：验证环境变量
const requiredEnvVars = [
  'SOLANA_RPC_URL',
  'DATABASE_URL',
  'NEXT_PUBLIC_API_URL',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ✅ 使用类型安全的环境变量
export const config = {
  solanaRpcUrl: process.env.SOLANA_RPC_URL!,
  databaseUrl: process.env.DATABASE_URL!,
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
} as const;
```

### 7. 样式规范 / Styling Guidelines

```tsx
import { cn } from '@/lib/utils';

// ✅ 推荐：使用 Tailwind CSS 和 cn 工具
function MyComponent({ 
  isActive, 
  className, 
  children 
}: { 
  isActive?: boolean; 
  className?: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4",
      "rounded-lg border border-border",
      "bg-background text-foreground",
      isActive && "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </div>
  );
}

// ❌ 避免：内联样式
<div style={{ display: 'flex', gap: '16px' }}>
  {/* 内容 */}
</div>
```

## 常见错误和修复 / Common Errors and Fixes

### 1. 异步组件参数访问

```tsx
// ❌ 错误：直接访问 params
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}

// ✅ 正确：await params
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

### 2. 客户端组件导入服务端代码

```tsx
// ❌ 错误：在客户端组件中导入数据库代码
'use client';
import { db } from '@/lib/db'; // 这会导致错误。

// ✅ 正确：通过 API 路由访问
'use client';
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
```

### 3. 钱包连接检查

```tsx
// ❌ 错误：未检查钱包连接
const signature = await wallet.signTransaction(transaction);

// ✅ 正确：检查钱包状态
if (!wallet?.connected || !wallet?.publicKey) {
  throw new Error('请先连接钱包');
}
const signature = await wallet.signTransaction(transaction);
```

### 4. 数组映射缺少 key

```tsx
// ❌ 错误：没有 key 属性
{items.map(item => <div>{item.name}</div>)}

// ✅ 正确：使用唯一 key
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

### 5. 未处理的 Promise

```tsx
// ❌ 错误：忘记 await 或 .then()
const data = fetchData(); // 返回 Promise，不是数据

// ✅ 正确：正确处理异步
const data = await fetchData();
// 或
fetchData().then(data => console.log(data));
```

## 安全要点 / Security Guidelines

1. **永远不要在客户端代码中暴露私钥或密钥**
2. **验证所有用户输入**，特别是钱包地址和交易金额
3. **使用环境变量存储敏感信息**
4. **实现请求速率限制**以防止 API 滥用
5. **在区块链交易前验证余额和权限**
6. **使用 HTTPS** 进行所有网络通信
7. **在表单提交中实施 CSRF 保护**
8. **清理和验证数据库查询**以防止 SQL 注入

## 性能优化 / Performance Optimization

1. **使用 Next.js 的图片优化组件** (`next/image`)
2. **实现适当的缓存策略** (ISR, SSG, SSR)
3. **使用动态导入懒加载组件**
4. **优化区块链 RPC 调用**，使用批处理和缓存
5. **使用 React.memo** 以避免不必要的重新渲染
6. **实现虚拟滚动**以处理大列表

## 测试 / Testing

在修改代码后，确保：

1. 运行 `pnpm lint` 检查代码规范
2. 运行 `pnpm ts-check` 检查类型错误
3. 测试相关功能是否正常工作
4. 检查控制台是否有错误或警告
5. 验证区块链交易在测试网络上正常运行

## 包管理 / Package Management

```bash
# ✅ 必须使用 pnpm
pnpm install
pnpm add package-name
pnpm add -D dev-package

# ❌ 禁止使用其他包管理器
npm install  # 错误！
yarn add     # 错误！
```

## 资源链接 / Resources

- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 组件](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Drizzle ORM](https://orm.drizzle.team/)

## 代码审查清单 / Code Review Checklist

在提交代码前，请检查：

- [ ] 所有变量和函数都有明确的类型定义
- [ ] 异步操作都有适当的错误处理
- [ ] 没有使用 `any` 类型
- [ ] 组件有清晰的 Props 接口定义
- [ ] API 路由有输入验证和错误处理
- [ ] 区块链交易有失败处理和用户反馈
- [ ] 没有硬编码的密钥或敏感信息
- [ ] 使用了 shadcn/ui 组件而不是自定义基础组件
- [ ] 遵循 Next.js App Router 最佳实践
- [ ] 代码通过 ESLint 和 TypeScript 检查
