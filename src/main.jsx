import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App.jsx";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import "antd/dist/reset.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            fontFamily:
              "'Segoe UI', 'PingFang SC', system-ui, -apple-system, sans-serif",
            colorPrimary: "#2563eb",
            borderRadius: 8,
          },
        }}
      >
        <AuthProvider>
          <AppDataProvider>
            <App />
          </AppDataProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>
);
