import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Sidebar.css";

const navItems = [
  {
    to: "/",
    label: "首页",
    roles: ["admin", "pi", "secretary", "director", "chief", "viewer"],
  },
  { to: "/application", label: "专业组及PI备案申请", roles: ["admin", "pi"] },
  {
    to: "/pi-records",
    label: "PI备案列表",
    roles: ["admin", "pi", "secretary", "director", "chief"],
  },
  {
    to: "/specialties",
    label: "备案专业名称",
    roles: ["admin", "pi", "secretary", "director", "chief", "viewer"],
  },
];

function Sidebar() {
  const { currentUser, hasRole } = useContext(AuthContext);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">研</div>
        <div>
          <div className="sidebar__title">临床试验专业组</div>
          <div className="sidebar__subtitle">重庆医科大学附属第二医院</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        {navItems
          .filter((item) => !item.roles?.length || hasRole(item.roles))
          .map((item) => (
            <NavLink
              key={item.to}
              to={currentUser ? item.to : "/login"}
              className={({ isActive }) =>
                [
                  "sidebar__link",
                  isActive && currentUser ? "is-active" : "",
                ].join(" ")
              }
              end={item.to === "/"}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>
      <div className="sidebar__foot">
        <div className="sidebar__foot-title">数据日常</div>
        <p className="sidebar__foot-text">请每天更新在研试验与人员轮转情况。</p>
      </div>
    </aside>
  );
}

export default Sidebar;
