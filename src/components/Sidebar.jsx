import { useContext, useMemo, useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { keshiDepartmentApi } from "../api";
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
  {
    to: "/publish-notice",
    label: "发布通知",
    roles: ["admin", "secretary", "director", "chief"],
  },
  {
    to: "/notice-group",
    label: "通知分组管理",
    roles: ["admin", "secretary", "director", "chief"],
  },
  {
    label: "专业组资质",
    roles: ["admin", "pi", "secretary", "director", "chief"],
    children: [
      {
        to: "/keshi",
        label: "科室管理",
        roles: ["admin", "pi", "secretary", "director", "chief"],
        children: [],
      },
      {
        label: "机构",
        children: [
          {
            to: "/institution/team",
            label: "研究团队",
            roles: ["admin", "pi", "secretary", "director", "chief"],
          },
          {
            to: "/institution/files",
            label: "文件体系",
            roles: ["admin", "secretary", "director", "chief"],
          },
        ],
      },
      // I期临床试验研究室暂时不显示
      // {
      //   label: "I期临床试验研究室",
      //   children: [],
      // },
    ],
  },
];

function Sidebar() {
  const { currentUser, hasRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [keshiList, setKeshiList] = useState([]);
  const [professionalGroupsMap, setProfessionalGroupsMap] = useState({}); // 科室ID -> 专业组列表

  // 获取科室列表（用于侧边栏下级菜单展示）
  useEffect(() => {
    const canSeeKeshiMenu = hasRole(["admin", "pi", "secretary", "director", "chief"]);
    if (!currentUser || !canSeeKeshiMenu) return;

    const fetchKeshiList = async () => {
      try {
        const res = await keshiDepartmentApi.getList();
        if (res?.success) {
          setKeshiList(res.data || []);
        } else {
          setKeshiList([]);
        }
      } catch (e) {
        console.error("获取科室列表失败(侧边栏):", e);
        setKeshiList([]);
      }
    };

    fetchKeshiList();
  }, [currentUser, hasRole]);

  // 为每个科室加载专业组列表
  useEffect(() => {
    const canSeeKeshiMenu = hasRole(["admin", "pi", "secretary", "director", "chief"]);
    if (!currentUser || !canSeeKeshiMenu || !keshiList.length) return;

    const fetchAllProfessionalGroups = async () => {
      const groupsMap = {};
      const promises = keshiList.map(async (keshi) => {
        try {
          const res = await keshiDepartmentApi.listProfessionalGroup(keshi.id);
          if (res?.success) {
            groupsMap[keshi.id] = res.data || [];
          } else {
            groupsMap[keshi.id] = [];
          }
        } catch (e) {
          console.error(`获取科室 ${keshi.id} 的专业组列表失败:`, e);
          groupsMap[keshi.id] = [];
        }
      });
      await Promise.all(promises);
      setProfessionalGroupsMap(groupsMap);
    };

    fetchAllProfessionalGroups();
  }, [currentUser, hasRole, keshiList]);

  const computedNavItems = useMemo(() => {
    // 把"科室管理"菜单动态注入科室子项（下一级标题），并为每个科室注入专业组（第三级）
    const inject = (items) =>
      items.map((item) => {
        if (!item) return item;

        if (item.label === "科室管理") {
          const children = (keshiList || []).map((d) => {
            // 获取该科室的专业组列表
            const groups = professionalGroupsMap[d.id] || [];
            // 为每个科室创建子菜单，包含专业组
            const groupChildren = groups.map((group) => ({
              to: `/keshi/${d.id}/group/${group.id}`,
              label: group.groupPath || `专业组-${group.id}`,
              roles: item.roles,
            }));
            
            return {
              to: `/keshi/${d.id}`,
              label: d.keshi || `科室-${d.id}`,
              roles: item.roles,
              children: groupChildren.length > 0 ? groupChildren : undefined,
            };
          });
          return {
            ...item,
            children,
          };
        }

        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: inject(item.children),
          };
        }
        return item;
      });

    return inject(navItems);
  }, [keshiList, professionalGroupsMap]);

  const isPathMatch = (itemPath) => {
    if (!itemPath) return false;
    if (itemPath === "/") return location.pathname === "/";
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  // 检查路径是否匹配某个菜单项或其子项
  const isItemActive = (item) => {
    if (item.to) {
      return isPathMatch(item.to);
    }
    if (item.children) {
      return item.children.some((child) => {
        if (child.to) {
          return isPathMatch(child.to);
        }
        if (child.children) {
          return child.children.some((subChild) => {
            if (subChild.to) {
              return isPathMatch(subChild.to);
            }
            if (subChild.children) {
              return subChild.children.some((subSubChild) => isPathMatch(subSubChild.to));
            }
            return false;
          });
        }
        return false;
      });
    }
    return false;
  };

  // 检查某个菜单项是否应该展开（如果其子项中有激活的）
  const shouldExpand = (item, parentKey = "") => {
    if (!item.children || item.children.length === 0) return false;
    const key = parentKey ? `${parentKey}-${item.label}` : item.label;
    return item.children.some((child) => {
      if (child.to && isPathMatch(child.to)) return true;
      if (child.children) {
        return child.children.some((subChild) => {
          if (subChild.to && isPathMatch(subChild.to)) return true;
          if (subChild.children) {
            return subChild.children.some((subSubChild) => isPathMatch(subSubChild.to));
          }
          return false;
        });
      }
      return false;
    });
  };

  // 初始化展开状态：如果当前路径匹配某个子菜单，自动展开父菜单
  useEffect(() => {
    const autoExpand = (items, parentKey = "") => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          const key = parentKey ? `${parentKey}-${item.label}` : item.label;
          if (shouldExpand(item, parentKey)) {
            setExpandedItems((prev) => ({ ...prev, [key]: true }));
          }
          autoExpand(item.children, key);
        }
      });
    };
    autoExpand(computedNavItems);
  }, [location.pathname, computedNavItems]);

  // 切换展开/收起
  const toggleExpand = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 渲染菜单项
  const renderNavItem = (item, level = 0, parentKey = "") => {
    const key = parentKey ? `${parentKey}-${item.label}` : item.label;
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[key] !== undefined ? expandedItems[key] : isActive;

    // 权限检查
    if (item.roles && !hasRole(item.roles)) {
      return null;
    }

    // 如果有子菜单，检查子菜单权限
    if (hasChildren) {
      const visibleChildren = item.children.filter(
        (child) => !child.roles || hasRole(child.roles)
      );
      if (visibleChildren.length === 0) {
        return null;
      }
    }

    // 既能跳转又能展开的菜单项（例如：科室管理、科室）
    if (item.to && hasChildren) {
      return (
        <div key={key} className="sidebar__group">
          <div
            className={[
              "sidebar__group-header",
              isActive ? "is-active" : "",
              `sidebar__group-header--level-${level}`,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              toggleExpand(key);
              if (currentUser) {
                navigate(item.to);
              } else {
                navigate("/login");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <span>{item.label}</span>
            <span className="sidebar__group-arrow">{isExpanded ? "▼" : "▶"}</span>
          </div>
          {isExpanded && (
            <div className="sidebar__group-children">
              {item.children.map((child) => renderNavItem(child, level + 1, key))}
            </div>
          )}
        </div>
      );
    }

    if (item.to) {
      // 普通菜单项
      return (
        <NavLink
          key={key}
          to={currentUser ? item.to : "/login"}
          className={({ isActive: navIsActive }) =>
            [
              "sidebar__link",
              `sidebar__link--level-${level}`,
              (navIsActive || isActive) && currentUser ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          end={item.to === "/"}
        >
          <span>{item.label}</span>
        </NavLink>
      );
    }

    // 有子菜单的父项
    return (
      <div key={key} className="sidebar__group">
        <div
          className={[
            "sidebar__group-header",
            isActive ? "is-active" : "",
            `sidebar__group-header--level-${level}`,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => toggleExpand(key)}
          style={{ cursor: "pointer" }}
        >
          <span>{item.label}</span>
          <span className="sidebar__group-arrow">{isExpanded ? "▼" : "▶"}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="sidebar__group-children">
            {item.children.map((child) => renderNavItem(child, level + 1, key))}
          </div>
        )}
      </div>
    );
  };

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
        {computedNavItems
          .filter((item) => !item.roles?.length || hasRole(item.roles))
          .map((item) => renderNavItem(item))}
      </nav>
      <div className="sidebar__foot">
        <div className="sidebar__foot-title">数据日常</div>
        <p className="sidebar__foot-text">请每天更新在研试验与人员轮转情况。</p>
      </div>
    </aside>
  );
}

export default Sidebar;
