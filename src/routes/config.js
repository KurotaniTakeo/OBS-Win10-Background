/**
 * 配置API路由
 * 处理配置文件相关的请求
 */

const {
  readConfig,
  saveConfig,
  resetConfig,
  getCurrentConfig,
  saveCurrentConfig,
  getProfileList,
  switchProfile,
  createProfile,
  renameProfile,
  duplicateProfile,
  deleteProfile,
} = require("../config/manager");

/**
 * 处理 GET /api/config 请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleGetConfig(req, res) {
  try {
    const config = getCurrentConfig();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(config));
  } catch (error) {
    console.error("❌ 配置读取失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "配置读取失败: " + error.message,
      }),
    );
  }
}

/**
 * 处理 POST /api/config 请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleSaveConfig(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const config = JSON.parse(body);
      saveCurrentConfig(config);
      console.log("✅ 配置已保存到 config.json");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "配置保存成功" }));
    } catch (error) {
      console.error("❌ 配置保存失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置保存失败: " + error.message,
        }),
      );
    }
  });
}

/**
 * 处理 POST /api/config/reset 请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleResetConfig(req, res) {
  try {
    const defaultConfig = resetConfig();
    console.log("🔄 配置已恢复为默认值");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "配置已恢复为默认值",
        config: defaultConfig,
      }),
    );
  } catch (error) {
    console.error("❌ 恢复配置失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "恢复配置失败: " + error.message,
      }),
    );
  }
}

/**
 * 处理 GET /api/profiles 请求 - 获取所有配置列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleGetProfiles(req, res) {
  try {
    const profiles = getProfileList();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, profiles }));
  } catch (error) {
    console.error("❌ 获取配置列表失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "获取配置列表失败: " + error.message,
      }),
    );
  }
}

/**
 * 处理 POST /api/profiles/switch 请求 - 切换配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleSwitchProfile(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { profileId } = JSON.parse(body);
      const config = switchProfile(profileId);
      console.log(`✅ 已切换到配置: ${profileId}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: true, message: "配置切换成功", config }),
      );
    } catch (error) {
      console.error("❌ 配置切换失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置切换失败: " + error.message,
        }),
      );
    }
  });
}

/**
 * 处理 POST /api/profiles/create 请求 - 新建配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleCreateProfile(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { name } = JSON.parse(body);
      const profile = createProfile(name);
      console.log(`✅ 已创建配置: ${name}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: true, message: "配置创建成功", profile }),
      );
    } catch (error) {
      console.error("❌ 配置创建失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置创建失败: " + error.message,
        }),
      );
    }
  });
}

/**
 * 处理 POST /api/profiles/rename 请求 - 重命名配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleRenameProfile(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { profileId, newName } = JSON.parse(body);
      renameProfile(profileId, newName);
      console.log(`✅ 配置已重命名: ${newName}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "配置重命名成功" }));
    } catch (error) {
      console.error("❌ 配置重命名失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置重命名失败: " + error.message,
        }),
      );
    }
  });
}

/**
 * 处理 POST /api/profiles/duplicate 请求 - 复制配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleDuplicateProfile(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { profileId } = JSON.parse(body);
      const profile = duplicateProfile(profileId);
      console.log(`✅ 配置已复制: ${profile.name}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: true, message: "配置复制成功", profile }),
      );
    } catch (error) {
      console.error("❌ 配置复制失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置复制失败: " + error.message,
        }),
      );
    }
  });
}

/**
 * 处理 POST /api/profiles/delete 请求 - 删除配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleDeleteProfile(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { profileId } = JSON.parse(body);
      deleteProfile(profileId);
      console.log(`✅ 配置已删除: ${profileId}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "配置删除成功" }));
    } catch (error) {
      console.error("❌ 配置删除失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置删除失败: " + error.message,
        }),
      );
    }
  });
}

module.exports = {
  handleGetConfig,
  handleSaveConfig,
  handleResetConfig,
  handleGetProfiles,
  handleSwitchProfile,
  handleCreateProfile,
  handleRenameProfile,
  handleDuplicateProfile,
  handleDeleteProfile,
};
