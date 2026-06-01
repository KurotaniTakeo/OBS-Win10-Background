/**
 * 配置管理模块
 * 提供配置文件的读写、迁移和默认配置管理
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.dirname(path.dirname(__dirname));
const CONFIG_DIR = path.join(ROOT_DIR, "configs");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_CONFIG_FILE = path.join(CONFIG_DIR, "config.default.json");

// 旧位置的配置文件路径（用于迁移）
const LEGACY_ROOT_CONFIG_FILE = path.join(ROOT_DIR, "config.json");
const LEGACY_ROOT_DEFAULT_CONFIG_FILE = path.join(
  ROOT_DIR,
  "config.default.json",
);
const LEGACY_CONFIG_DIR = path.join(path.dirname(__dirname), "config");
const LEGACY_CONFIG_FILE = path.join(LEGACY_CONFIG_DIR, "config.json");
const LEGACY_DEFAULT_CONFIG_FILE = path.join(
  LEGACY_CONFIG_DIR,
  "config.default.json",
);

/**
 * 确保配置目录存在，并迁移旧配置文件
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // 迁移根目录的 config.json
  if (fs.existsSync(LEGACY_ROOT_CONFIG_FILE) && !fs.existsSync(CONFIG_FILE)) {
    try {
      fs.renameSync(LEGACY_ROOT_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已迁移根目录 config.json 到 configs 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_ROOT_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已复制根目录 config.json 到 configs 目录");
    }
  }

  // 迁移根目录的 config.default.json
  if (
    fs.existsSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE) &&
    !fs.existsSync(DEFAULT_CONFIG_FILE)
  ) {
    try {
      fs.renameSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已迁移根目录 config.default.json 到 configs 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已复制根目录 config.default.json 到 configs 目录");
    }
  }

  // 迁移旧位置的 config.json
  if (fs.existsSync(LEGACY_CONFIG_FILE) && !fs.existsSync(CONFIG_FILE)) {
    try {
      fs.renameSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已迁移旧位置 config.json 到 configs 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已复制旧位置 config.json 到 configs 目录");
    }
  }

  // 迁移旧位置的 config.default.json
  if (
    fs.existsSync(LEGACY_DEFAULT_CONFIG_FILE) &&
    !fs.existsSync(DEFAULT_CONFIG_FILE)
  ) {
    try {
      fs.renameSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已迁移旧位置 config.default.json 到 configs 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已复制旧位置 config.default.json 到 configs 目录");
    }
  }
}

/**
 * 读取默认配置
 * @returns {Object} 默认配置对象
 */
function readDefaultConfig() {
  ensureConfigDir();

  if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
    const raw = fs.readFileSync(DEFAULT_CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  }

  // 如果默认配置文件不存在，返回硬编码的默认配置
  return {
    isFirstLaunch: true,
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont",
    fontSize: 18,
    themeColor: "#0078d4",
    sidebarBgColor: "rgb(20, 20, 30)",
    showTitleBar: true,
    enableTitleBarFont: true,
    logoIcon: "",
    navIconsBlack: "",
    bottomIcon: "",
    windowTitle: "OBS Windows 10 Background",
    windowTitleFont:
      "Segoe UI, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    windowTitleFontSize: 18,
    titleBarButtons: "&#xE921;,&#xE923;,&#xE8BB;",
  };
}

/**
 * 读取用户配置
 * @returns {Object} 用户配置对象（包含currentProfile和profiles）
 */
function readConfig() {
  ensureConfigDir();

  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const data = JSON.parse(raw);

    // 检查是否为旧格式配置文件（直接包含配置项）
    if (!data.profiles && !data.currentProfile) {
      console.log("🔁 检测到旧格式配置文件，正在迁移...");
      // 将旧配置迁移为新格式
      const oldConfig = { ...data };
      delete oldConfig._comment;

      // 提取全局配置项
      const { isFirstLaunch, ...profileConfig } = oldConfig;

      const newData = {
        isFirstLaunch: isFirstLaunch !== undefined ? isFirstLaunch : true,
        currentProfile: "default",
        profiles: {
          default: {
            name: "默认配置",
            isDefault: true,
            config: profileConfig,
          },
        },
        _comment: "配置文件支持多个配置切换。默认配置不可删除和修改名称。",
      };
      saveConfig(newData);
      return newData;
    }

    // 确保存在全局 isFirstLaunch
    if (data.isFirstLaunch === undefined) {
      data.isFirstLaunch = true;
    }

    return data;
  }

  // 如果配置文件不存在，返回默认配置
  const defaultConfigData = readDefaultConfig();
  const newData = {
    currentProfile: "default",
    profiles: {
      default: {
        name: "默认配置",
        isDefault: true,
        config: defaultConfigData,
      },
    },
    _comment: "配置文件支持多个配置切换。默认配置不可删除和修改名称。",
  };
  return newData;
}

/**
 * 保存配置
 * @param {Object} config - 要保存的配置对象（包含currentProfile和profiles）
 */
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4), "utf8");
}

/**
 * 获取当前激活的配置
 * @returns {Object} 当前配置对象（包含全局 isFirstLaunch）
 */
function getCurrentConfig() {
  const data = readConfig();
  const currentProfile = data.currentProfile || "default";

  let config;
  if (data.profiles && data.profiles[currentProfile]) {
    config = { ...data.profiles[currentProfile].config };
  } else if (data.profiles && data.profiles.default) {
    // 如果找不到当前配置，返回默认配置
    config = { ...data.profiles.default.config };
  } else {
    config = readDefaultConfig();
  }

  // 添加全局 isFirstLaunch
  config.isFirstLaunch =
    data.isFirstLaunch !== undefined ? data.isFirstLaunch : true;

  return config;
}

/**
 * 保存当前激活配置的更改
 * @param {Object} newConfig - 新的配置对象
 */
function saveCurrentConfig(newConfig) {
  const data = readConfig();
  const currentProfile = data.currentProfile || "default";

  if (data.profiles && data.profiles[currentProfile]) {
    // 提取全局配置项
    const { isFirstLaunch, ...profileConfig } = newConfig;

    // 保存全局配置
    if (isFirstLaunch !== undefined) {
      data.isFirstLaunch = isFirstLaunch;
    }

    // 保存配置项（不包含全局配置）
    data.profiles[currentProfile].config = profileConfig;
    saveConfig(data);
  }
}

/**
 * 获取所有配置列表
 * @returns {Array} 配置列表 [{ id, name, isDefault, isCurrent }]
 */
function getProfileList() {
  const data = readConfig();
  const profiles = data.profiles || {};
  const currentProfile = data.currentProfile || "default";

  return Object.keys(profiles).map((id) => ({
    id,
    name: profiles[id].name,
    isDefault: profiles[id].isDefault || false,
    isCurrent: id === currentProfile,
  }));
}

/**
 * 切换配置
 * @param {string} profileId - 要切换到的配置ID
 * @returns {Object} 切换后的配置对象
 */
function switchProfile(profileId) {
  const data = readConfig();

  if (!data.profiles || !data.profiles[profileId]) {
    throw new Error(`配置 "${profileId}" 不存在`);
  }

  data.currentProfile = profileId;
  saveConfig(data);

  return data.profiles[profileId].config;
}

/**
 * 新建配置
 * @param {string} name - 配置名称
 * @returns {Object} 新配置的信息 { id, name }
 */
function createProfile(name) {
  const data = readConfig();

  // 生成唯一ID
  const id = `profile_${Date.now()}`;

  // 使用默认配置作为新配置的模板（不包含全局配置项）
  const defaultConfigData = readDefaultConfig();
  const { isFirstLaunch, ...profileConfig } = defaultConfigData;

  data.profiles[id] = {
    name: name,
    isDefault: false,
    config: { ...profileConfig },
  };

  saveConfig(data);

  return { id, name };
}

/**
 * 重命名配置
 * @param {string} profileId - 配置ID
 * @param {string} newName - 新名称
 */
function renameProfile(profileId, newName) {
  const data = readConfig();

  if (!data.profiles || !data.profiles[profileId]) {
    throw new Error(`配置 "${profileId}" 不存在`);
  }

  if (data.profiles[profileId].isDefault) {
    throw new Error("默认配置不能重命名");
  }

  data.profiles[profileId].name = newName;
  saveConfig(data);
}

/**
 * 复制配置
 * @param {string} profileId - 要复制的配置ID
 * @returns {Object} 新配置的信息 { id, name }
 */
function duplicateProfile(profileId) {
  const data = readConfig();

  if (!data.profiles || !data.profiles[profileId]) {
    throw new Error(`配置 "${profileId}" 不存在`);
  }

  const sourceProfile = data.profiles[profileId];
  const newId = `profile_${Date.now()}`;
  const newName = `${sourceProfile.name} 副本`;

  // 复制配置时不包含全局配置项（如果存在）
  const { isFirstLaunch, ...profileConfig } = sourceProfile.config;

  data.profiles[newId] = {
    name: newName,
    isDefault: false,
    config: { ...profileConfig },
  };

  saveConfig(data);

  return { id: newId, name: newName };
}

/**
 * 删除配置
 * @param {string} profileId - 要删除的配置ID
 */
function deleteProfile(profileId) {
  const data = readConfig();

  if (!data.profiles || !data.profiles[profileId]) {
    throw new Error(`配置 "${profileId}" 不存在`);
  }

  if (data.profiles[profileId].isDefault) {
    throw new Error("默认配置不能删除");
  }

  // 如果删除的是当前配置，切换到默认配置
  if (data.currentProfile === profileId) {
    data.currentProfile = "default";
  }

  delete data.profiles[profileId];
  saveConfig(data);
}

/**
 * 重置配置为默认值
 * @returns {Object} 默认配置对象
 */
function resetConfig() {
  const defaultConfig = readDefaultConfig();
  const { isFirstLaunch, ...profileConfig } = defaultConfig;

  const data = {
    isFirstLaunch: isFirstLaunch !== undefined ? isFirstLaunch : true,
    currentProfile: "default",
    profiles: {
      default: {
        name: "默认配置",
        isDefault: true,
        config: profileConfig,
      },
    },
    _comment: "配置文件支持多个配置切换。默认配置不可删除和修改名称。",
  };
  saveConfig(data);
  return defaultConfig;
}

/**
 * 获取配置目录路径
 * @returns {string} 配置目录路径
 */
function getConfigDir() {
  return CONFIG_DIR;
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件路径
 */
function getConfigFile() {
  return CONFIG_FILE;
}

module.exports = {
  ensureConfigDir,
  readDefaultConfig,
  readConfig,
  saveConfig,
  getCurrentConfig,
  saveCurrentConfig,
  getProfileList,
  switchProfile,
  createProfile,
  renameProfile,
  duplicateProfile,
  deleteProfile,
  resetConfig,
  getConfigDir,
  getConfigFile,
};
