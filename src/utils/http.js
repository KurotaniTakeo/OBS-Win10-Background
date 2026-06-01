/**
 * 网络请求工具
 * 提供HTTP/HTTPS请求功能
 */

const https = require("https");

/**
 * 获取JSON数据
 * @param {string} url - 请求URL
 * @returns {Promise<any>} JSON数据
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "obs-config-server",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error("解析响应失败"));
            }
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        });
      },
    );
    req.on("error", reject);
  });
}

/**
 * 下载文件
 * @param {string} url - 下载URL
 * @param {string} destPath - 目标路径
 * @param {number} redirects - 重定向次数
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath, redirects = 0) {
  const fs = require("fs");

  return new Promise((resolve, reject) => {
    const isZipballApi = url.includes("/zipball/");

    const headers = {
      "User-Agent": "obs-config-server",
    };

    // zipball API 不使用 Accept 头（GitHub 会自动返回 zip）
    if (!isZipballApi) {
      headers["Accept"] = "application/octet-stream";
    }

    console.log(
      `📥 下载 ${url.split("/").pop()} (headers: ${JSON.stringify(headers)})`,
    );

    const req = https.get(url, { headers }, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (redirects >= 5) {
          reject(new Error("下载重定向次数过多"));
          return;
        }
        console.log(`↪️ 重定向到: ${res.headers.location}`);
        downloadFile(res.headers.location, destPath, redirects + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(
          new Error(
            `下载失败: HTTP ${res.statusCode}${res.statusMessage ? " " + res.statusMessage : ""}`,
          ),
        );
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close(resolve);
      });
      fileStream.on("error", reject);
    });
    req.on("error", reject);
  });
}

module.exports = {
  fetchJson,
  downloadFile,
};
