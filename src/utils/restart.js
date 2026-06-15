/**
 * 服务器重启工具
 * 提供服务器重启功能，供 server.js 和更新路由共用
 */

const { spawn } = require("child_process");

/**
 * 延迟重启服务器
 * 生成一个独立子进程运行新的服务器实例后退出当前进程
 * @param {number} delay - 延迟毫秒数
 */
function scheduleServerRestart(delay = 800) {
  setTimeout(() => {
    const nodePath = process.execPath;
    const scriptPath = process.argv[1] || __filename;

    const child = spawn(nodePath, [scriptPath], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    process.exit(0);
  }, delay);
}

module.exports = {
  scheduleServerRestart,
};
