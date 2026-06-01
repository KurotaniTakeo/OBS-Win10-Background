/**
 * API服务 - 处理与后端的所有通信
 */
class ApiService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * 从后端加载配置
   * @returns {Promise<Object>} 配置对象
   */
  async loadConfig() {
    try {
      console.log("📖 正在从服务器加载配置...");
      const response = await fetch(`${this.apiBaseUrl}/config?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const loadedConfig = await response.json();
      console.log("✅ 配置加载成功:", loadedConfig);
      return loadedConfig;
    } catch (error) {
      console.warn("⚠️ 无法从服务器加载配置:", error.message);
      console.warn("请确保配置服务器正在运行 (npm start)");
      return null;
    }
  }

  /**
   * 保存配置到服务器
   * @param {Object} config - 配置对象
   * @returns {Promise<Object>} 服务器响应
   */
  async saveConfig(config) {
    try {
      if (window.location.protocol === "file:") {
        console.warn(
          "⚠️ 当前为 file:// 模式，将尝试保存到本地服务器，失败则下载 config.json",
        );
      }

      console.log("💾 正在保存配置到服务器...");

      const response = await fetch(`${this.apiBaseUrl}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ 配置保存成功:", result);
      return result;
    } catch (error) {
      console.error("❌ 配置保存失败:", error);
      throw error;
    }
  }

  /**
   * 下载配置文件（用于 file:// 模式或服务器不可用时）
   * @param {Object} config - 配置对象
   * @returns {boolean} 是否下载成功
   */
  downloadConfig(config) {
    try {
      const blob = new Blob([JSON.stringify(config, null, 4)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "config.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (downloadError) {
      console.error("❌ 配置下载失败:", downloadError);
      return false;
    }
  }

  /**
   * 重置配置到默认值
   * @returns {Promise<Object>} 服务器响应
   */
  async resetConfig() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/config/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("恢复默认配置失败");
      }

      const result = await response.json();
      console.log("✅ 已恢复默认配置:", result);
      return result;
    } catch (error) {
      console.error("❌ 恢复配置失败:", error);
      throw error;
    }
  }

  /**
   * 获取当前版本信息
   * @returns {Promise<{version: string, repo: string} | null>}
   */
  async getVersion() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/version?t=${Date.now()}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("⚠️ 无法获取版本信息:", error.message);
      return null;
    }
  }

  /**
   * 获取所有配置列表
   * @returns {Promise<Array>} 配置列表
   */
  async getProfiles() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/profiles?t=${Date.now()}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.profiles || [];
    } catch (error) {
      console.error("❌ 获取配置列表失败:", error);
      throw error;
    }
  }

  /**
   * 切换配置
   * @param {string} profileId - 配置ID
   * @returns {Promise<Object>} 切换后的配置
   */
  async switchProfile(profileId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profiles/switch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.config;
    } catch (error) {
      console.error("❌ 配置切换失败:", error);
      throw error;
    }
  }

  /**
   * 新建配置
   * @param {string} name - 配置名称
   * @returns {Promise<Object>} 新建的配置信息 { id, name }
   */
  async createProfile(name) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profiles/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.profile;
    } catch (error) {
      console.error("❌ 配置创建失败:", error);
      throw error;
    }
  }

  /**
   * 重命名配置
   * @param {string} profileId - 配置ID
   * @param {string} newName - 新名称
   * @returns {Promise<Object>} 服务器响应
   */
  async renameProfile(profileId, newName) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profiles/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId, newName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ 配置重命名失败:", error);
      throw error;
    }
  }

  /**
   * 复制配置
   * @param {string} profileId - 配置ID
   * @returns {Promise<Object>} 新配置信息 { id, name }
   */
  async duplicateProfile(profileId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profiles/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.profile;
    } catch (error) {
      console.error("❌ 配置复制失败:", error);
      throw error;
    }
  }

  /**
   * 删除配置
   * @param {string} profileId - 配置ID
   * @returns {Promise<Object>} 服务器响应
   */
  async deleteProfile(profileId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/profiles/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ 配置删除失败:", error);
      throw error;
    }
  }
}
