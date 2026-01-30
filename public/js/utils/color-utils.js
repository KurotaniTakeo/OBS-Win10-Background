/**
 * 颜色转换和处理工具类
 * 处理 HEX、RGB、HSL 格式的颜色转换
 */
class ColorUtils {
  /**
   * 计算颜色亮度（0-255）
   * @param {string} color - HEX或RGB颜色
   * @returns {number} 亮度值
   */
  static getColorBrightness(color) {
    let r, g, b;

    // 处理HEX颜色
    if (color.startsWith("#")) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
    // 处理RGB颜色
    else if (color.startsWith("rgb")) {
      const match = color.match(/\d+/g);
      if (match) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      }
    }

    // 计算亮度（WCAG标准）
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  /**
   * 颜色亮度调整
   * @param {string} color - HEX颜色
   * @param {number} amount - 调整量
   * @returns {string} 调整后的HEX颜色
   */
  static adjustColor(color, amount) {
    const hex = color.replace("#", "");

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    const rr = r.toString(16).padStart(2, "0");
    const gg = g.toString(16).padStart(2, "0");
    const bb = b.toString(16).padStart(2, "0");

    return "#" + rr + gg + bb;
  }

  /**
   * 16进制颜色转RGBA
   * @param {string} hex - HEX颜色
   * @param {number} alpha - 透明度
   * @returns {string} RGBA颜色
   */
  static hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * RGB颜色转HEX
   * @param {string} rgb - RGB颜色
   * @returns {string} HEX颜色
   */
  static rgbToHex(rgb) {
    // 如果已经是HEX格式，直接返回
    if (rgb.startsWith("#")) {
      return rgb;
    }

    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) {
      return "#140014";
    }

    const r = parseInt(match[0]).toString(16).padStart(2, "0");
    const g = parseInt(match[1]).toString(16).padStart(2, "0");
    const b = parseInt(match[2]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  /**
   * HEX转RGB对象
   * @param {string} hex - HEX颜色
   * @returns {Object} RGB对象 {r, g, b}
   */
  static hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  /**
   * HEX转HSL
   * @param {string} hex - HEX颜色
   * @returns {Object} HSL对象 {h, s, l}
   */
  static hexToHsl(hex) {
    const { r, g, b } = ColorUtils.hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
      } else if (max === gNorm) {
        h = ((bNorm - rNorm) / delta + 2) / 6;
      } else {
        h = ((rNorm - gNorm) / delta + 4) / 6;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * HSL转HEX
   * @param {number} h - 色调 (0-360)
   * @param {number} s - 饱和度 (0-100)
   * @param {number} l - 亮度 (0-100)
   * @returns {string} HEX颜色
   */
  static hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  /**
   * 解析颜色输入 - 支持HEX、RGB、HSL格式
   * @param {string} input - 用户输入的颜色字符串
   * @param {string} format - 当前格式 (hex, rgb, hsl)
   * @returns {string|null} - 返回HEX格式颜色，无效返回null
   */
  static parseColorInput(input, format) {
    if (!input) return null;

    input = input.trim();

    try {
      if (format === "hex") {
        const hexMatch = input.match(/^#?([0-9A-Fa-f]{6})$/);
        if (hexMatch) {
          return "#" + hexMatch[1].toUpperCase();
        }
        const shortHexMatch = input.match(/^#?([0-9A-Fa-f]{3})$/);
        if (shortHexMatch) {
          const [r, g, b] = shortHexMatch[1].split("");
          return "#" + r + r + g + g + b + b;
        }
      } else if (format === "rgb") {
        const rgbMatch = input.match(
          /rgb\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)?/,
        );
        if (rgbMatch) {
          const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1])));
          const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2])));
          const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3])));
          return ColorUtils.rgbToHex(`rgb(${r}, ${g}, ${b})`);
        }
      } else if (format === "hsl") {
        const hslMatch = input.match(
          /hsl\(?\s*(\d+)°?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)?/,
        );
        if (hslMatch) {
          const h = parseInt(hslMatch[1]) % 360;
          const s = Math.max(0, Math.min(100, parseInt(hslMatch[2])));
          const l = Math.max(0, Math.min(100, parseInt(hslMatch[3])));
          return ColorUtils.hslToHex(h, s, l);
        }
      }
    } catch (e) {
      console.warn("颜色解析失败:", e);
    }

    return null;
  }
}
