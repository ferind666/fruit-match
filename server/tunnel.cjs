/**
 * 自动重连隧道脚本
 * 使用: node tunnel.cjs
 * 隧道断开后自动重试，每 5 秒一次
 */
const { spawn } = require('child_process');

function startTunnel() {
  console.log('[隧道] 正在连接...');

  const lt = spawn('npx', ['localtunnel', '--port', '3000'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  lt.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(text.trim());
    // 提取 URL
    const match = text.match(/https:\/\/[^\s]+\.loca\.lt/);
    if (match) {
      console.log('\n========================================');
      console.log('  🌐 公网地址: ' + match[0]);
      console.log('  手机/平板打开此链接即可玩游戏');
      console.log('========================================\n');
    }
  });

  lt.stderr.on('data', (data) => {
    console.error('[隧道错误]', data.toString().trim());
  });

  lt.on('close', (code) => {
    console.log(`[隧道] 已断开 (code=${code})，5秒后重连...`);
    setTimeout(startTunnel, 5000);
  });
}

console.log('🍎 水果消消乐 - 公网隧道（自动重连）');
console.log('按 Ctrl+C 停止\n');
startTunnel();