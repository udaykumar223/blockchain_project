/**
 * Unified Runner Script for Secure Land Record Verification System
 * 
 * Orchestrates:
 * 1. Hardhat Local Blockchain Node (port 8545)
 * 2. Smart Contract Auto-Deployment
 * 3. Express Backend API Server (port 5000)
 * 4. React + Vite Frontend Portal (port 3000)
 * 
 * Provides single-terminal execution and clean graceful shutdown.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;

const children = [];

function log(tag, msg, color = '\x1b[36m') {
  const reset = '\x1b[0m';
  console.log(`${color}[${tag}]${reset} ${msg}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: port,
        path: '/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 1000,
      },
      (res) => {
        resolve(true);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(JSON.stringify({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }));
    req.end();
  });
}

async function waitForPort(port, maxAttempts = 30, intervalMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const isUp = await checkPort(port);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

function cleanup() {
  log('SYSTEM', 'Shutting down all services...', '\x1b[33m');
  for (const child of children) {
    try {
      if (isWin && child.pid) {
        // Kill whole process tree on Windows
        execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      } else if (child.pid) {
        child.kill('SIGTERM');
      }
    } catch {
      // Ignore cleanup errors
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {});

async function main() {
  console.log('\n================================================================');
  console.log('   🏛️  SECURE LAND RECORD VERIFICATION SYSTEM');
  console.log('   Enterprise Blockchain Audit & Verification Portal');
  console.log('================================================================\n');

  // Step 1: Check or start Hardhat Node
  const nodeAlreadyRunning = await checkPort(8545);
  if (nodeAlreadyRunning) {
    log('CHAIN', 'Hardhat Node is already active on http://127.0.0.1:8545', '\x1b[32m');
  } else {
    log('CHAIN', 'Starting Hardhat local blockchain on port 8545...', '\x1b[34m');
    const chainProcess = spawn(npxCmd, ['hardhat', 'node'], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin,
    });
    children.push(chainProcess);

    chainProcess.stderr.on('data', (d) => {
      const str = d.toString();
      if (!str.includes('Warning') && str.trim()) {
        log('CHAIN-ERR', str.trim(), '\x1b[31m');
      }
    });

    const isUp = await waitForPort(8545);
    if (!isUp) {
      log('CHAIN', 'Failed to connect to Hardhat node within 15 seconds.', '\x1b[31m');
      cleanup();
      return;
    }
    log('CHAIN', 'Hardhat local blockchain initialized successfully.', '\x1b[32m');
  }

  // Step 2: Ensure contract is deployed
  log('DEPLOY', 'Ensuring smart contract is deployed to local network...', '\x1b[35m');
  try {
    execSync(`${npxCmd} hardhat run scripts/deploy.js --network localhost`, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: isWin,
    });
    const depPath = path.join(ROOT_DIR, 'deployment', 'deployment.json');
    if (fs.existsSync(depPath)) {
      const dep = JSON.parse(fs.readFileSync(depPath, 'utf8'));
      log('DEPLOY', `Smart contract live at: ${dep.contractAddress}`, '\x1b[32m');
      log('DEPLOY', `Authorized Registrar:   ${dep.registrar}`, '\x1b[32m');
    }
  } catch (err) {
    log('DEPLOY', `Deployment warning: ${err.message}`, '\x1b[33m');
  }

  // Step 3: Start Express Backend API
  log('BACKEND', 'Launching Express REST API on port 5000...', '\x1b[36m');
  const backendProcess = spawn(nodeCmd, ['backend/server.js'], {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  children.push(backendProcess);

  backendProcess.stdout.on('data', (d) => {
    const text = d.toString().trim();
    if (text) log('API', text, '\x1b[36m');
  });
  backendProcess.stderr.on('data', (d) => {
    const text = d.toString().trim();
    if (text) log('API-ERR', text, '\x1b[31m');
  });

  // Wait 1.5s for backend
  await new Promise((r) => setTimeout(r, 1500));

  // Step 4: Start React + Vite Frontend
  log('FRONTEND', 'Launching React + Vite web dashboard on port 3000...', '\x1b[32m');
  const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWin,
  });
  children.push(frontendProcess);

  frontendProcess.stdout.on('data', (d) => {
    const text = d.toString().trim();
    if (text.includes('Local:') || text.includes('ready')) {
      log('FRONTEND', text, '\x1b[32m');
    }
  });

  await new Promise((r) => setTimeout(r, 1500));

  console.log('\n================================================================');
  console.log('   ✨ ALL SYSTEMS OPERATIONAL!');
  console.log('   -------------------------------------------------------------');
  console.log('   🌐 Web Portal:        http://localhost:3000');
  console.log('   ⚙️  API Server:        http://localhost:5000/api/health');
  console.log('   ⛓️  Blockchain RPC:    http://127.0.0.1:8545');
  console.log('   -------------------------------------------------------------');
  console.log('   Press Ctrl+C at any time in this window to stop all services.');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  cleanup();
});
