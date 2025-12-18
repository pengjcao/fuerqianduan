import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppDataContext } from "../context/AppDataContext";
import { AuthContext } from "../context/AuthContext";
import "./Topbar.css";

const titleMap = {
  "/": "首页",
  "/application": "专业组及 PI 备案申请",
  "/pi-records": "PI 备案列表 / 审批",
  "/specialties": "备案专业名称",
};

function Topbar() {
  const location = useLocation();
  const { summary } = useContext(AppDataContext);
  const { currentUser, logout, roleLabels } = useContext(AuthContext);
  const navigate = useNavigate();
  const title = titleMap[location.pathname] ?? "临床试验专业组";

  return (
    <header className="topbar">
      <div>
        <div className="topbar__title">{title}</div>
        <div className="topbar__subtitle">
          系统为演示环境，数据来自本地 mock，可按文档完整功能逐步扩展。
        </div>
      </div>
      <div className="topbar__actions">
        <button className="btn ghost">导出报表</button>
        {currentUser ? (
          <>
            <div className="topbar__user small">
              <span>{currentUser.displayName}</span>
              <span className="muted">
                {roleLabels[currentUser.role] ?? currentUser.role} ·{" "}
                {currentUser.dept}
              </span>
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              退出
            </button>
          </>
        ) : (
          <button
            className="btn primary"
            type="button"
            onClick={() => navigate("/login")}
          >
            登录
          </button>
        )}
      </div>
    </header>
  );
}

export default Topbar;
