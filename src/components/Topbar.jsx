import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Topbar.css";

const titleMap = {
  "/": "首页",
  "/application": "专业组及 PI 备案申请",
  "/pi-records": "PI 备案列表 / 审批",
  "/specialties": "备案专业名称",
  "/institution/team": "研究团队",
  "/institution/files": "文件体系",
  "/publish-notice": "发布通知",
  "/notice-group": "通知分组管理",
  "/keshi": "科室管理",
};

function Topbar() {
  const location = useLocation();
  const { currentUser, logout, roleLabels } = useContext(AuthContext);
  const navigate = useNavigate();
  const getTitle = () => {
    if (titleMap[location.pathname]) {
      return titleMap[location.pathname];
    }
    if (location.pathname.startsWith("/keshi")) {
      // 匹配 /keshi/:id/group/:groupId
      if (location.pathname.match(/^\/keshi\/\d+\/group\/\d+$/)) {
        return "专业组详情";
      }
      // 匹配 /keshi/:id
      if (location.pathname.match(/^\/keshi\/\d+$/)) {
        return "科室详情";
      }
      return "科室管理";
    }
    return "临床试验专业组";
  };

  const title = getTitle();

  return (
    <header className="topbar">
      <div>
        <div className="topbar__title">{title}</div>
      </div>
      <div className="topbar__actions">
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
