/**
 * 格式化后端时间：支持 LocalDateTime 数组 [year, month, day, hour, minute, second?]、ISO 字符串、时间戳
 */
export function formatBackendDateTime(value) {
  if (value == null || value === "") return "-";

  try {
    if (Array.isArray(value)) {
      if (value.length < 3) return "-";
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      const date = new Date(year, month - 1, day, hour, minute, second);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}
