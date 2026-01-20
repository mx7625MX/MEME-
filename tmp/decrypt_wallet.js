const crypto = require('crypto');

function decrypt(encryptedText) {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync("demo-secret-key", "salt", 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 从之前的响应中提取的加密数据
const wallets = [
  {
    name: "测试钱包",
    address: "2WUXrpxobbJ6ZMvcabNUQcwWB8iciQ9nZMZ2arjGcgqj",
    encryptedMnemonic: "f184fd3237845ef844ec556e5c7410fc:904840e87400838726cad5d4bffd570ea2c01d8c0b88104aabd79a6bfc1ca6ac25ad7a6dc80ade6da291171a4a0a9fa378cbae9c717119076030647fa31f8173c8936385ba9fc2e4fcfe5fa1b7f7b983",
    encryptedPrivateKey: "0bf664c9e3e50f42946dfed023753a64:e22dd540de105511a4b156902bbdf6e8c5085518ba77c20116a743d58cd75f73f9a6ed1d96c307a17340e5941661029a2e6180fa698440e6fea85db569794e32d63f24db1dfa6de3b2037904e2360903ec79435c78eb7b5fbce4d58f9ab7d6cf",
  },
  {
    name: "新测试钱包",
    address: "BBDbPBTDeV9Vm8a1TYUEfiHarBoejEsrMs6rEEtssdcv",
    encryptedMnemonic: "fea40b6dfefdecb345e6e440d83a1ed8:dd88f205b0ce84e73b1b4036c803dcabf76aacb15eca3083c462802bfeda711edb49a23789d3917cd7ee2faee686171faa9f85e8032b32bda502acbb9651ea8a6a71ca7117bbe4e471126caca5510e9f",
    encryptedPrivateKey: "c4d62a8357c547a4a50d4c5950c0ff09:3fb1310e81b80f8d692b07d768052a9e7efe742fbe5aeb6c1d2d973f5d26a2e5084e49a780e82786b8a2dcbb7b5fe125fbffc5c45cb078cec72582db463e95b1130e837f3b215d29e11035b4e0d5e96a71490098fe642b41cab017e6673c0b28",
  }
];

console.log('=== 钱包信息（仅测试环境） ===\n');

wallets.forEach(wallet => {
  console.log(`钱包名称: ${wallet.name}`);
  console.log(`地址: ${wallet.address}`);
  console.log(`助记词: ${decrypt(wallet.encryptedMnemonic)}`);
  console.log(`私钥: ${decrypt(wallet.encryptedPrivateKey)}`);
  console.log('');
});

console.log('⚠️  警告：这些密钥仅用于测试环境，请妥善保管！');
console.log('⚠️  在生产环境中，私钥绝不应该明文存储或传输！');
