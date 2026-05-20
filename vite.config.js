import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理所有 /api 开头的请求到后端服务器
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true, // 改变请求头中的 origin
        secure: false, // 如果是 https 接口，需要配置这个参数
        // 可选：重写路径，如果后端 API 路径不是 /api 开头，可以在这里重写
        rewrite: (path) => path.replace(/^\/api/, ""),
        // 确保所有请求头（包括自定义 header 如 cao）都被传递
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // 确保所有请求头都被传递
            Object.keys(req.headers).forEach((key) => {
              proxyReq.setHeader(key, req.headers[key]);
            });
          });
        },
      },
    },
  },
});
