/**
 * 应用路径管理
 * 统一管理根目录、静态资源目录、配置目录的路径解析
 * 兼容 pkg 打包环境和源码运行环境
 */

const path = require("path");

const isPackaged = typeof process.pkg !== "undefined";

const ROOT_DIR = isPackaged
  ? path.dirname(process.execPath)
  : path.resolve(__dirname, "../..");

const PUBLIC_DIR = isPackaged
  ? path.join(ROOT_DIR, "public")
  : path.join(ROOT_DIR, "public");

const CONFIG_DIR = path.join(ROOT_DIR, "configs");

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  CONFIG_DIR,
  isPackaged,
};
