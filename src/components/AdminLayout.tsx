import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/admin/dashboard", label: "仪表盘", icon: "📊" },
    { path: "/admin/batches", label: "批次管理", icon: "📋" },
    { path: "/admin/applications", label: "申请管理", icon: "📝" },
    { path: "/admin/users", label: "用户管理", icon: "👥" },
    { path: "/admin/settings", label: "系统设置", icon: "⚙️" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 侧边栏 */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#1a237e",
          color: "white",
          padding: "20px 0",
        }}
      >
        <div style={{ padding: "0 20px", marginBottom: "30px" }}>
          <h2 style={{ margin: 0 }}>奖学金管理系统</h2>
        </div>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                color: "white",
                textDecoration: "none",
                backgroundColor:
                  location.pathname === item.path ? "#283593" : "transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "20px", marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, backgroundColor: "#f5f5f5", padding: "20px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
