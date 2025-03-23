import React from "react";
import AdminLayout from "./AdminLayout";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const stats = [
    { label: "总申请数", value: "156", icon: "📝" },
    { label: "待审核", value: "23", icon: "⏳" },
    { label: "已通过", value: "89", icon: "✅" },
    { label: "已驳回", value: "44", icon: "❌" },
  ];

  const recentApplications = [
    {
      id: 1,
      name: "张三",
      type: "优秀学生奖学金",
      date: "2024-03-20",
      status: "待审核",
    },
    {
      id: 2,
      name: "李四",
      type: "科技创新奖学金",
      date: "2024-03-19",
      status: "已通过",
    },
    {
      id: 3,
      name: "王五",
      type: "社会工作奖学金",
      date: "2024-03-18",
      status: "已驳回",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h2 style={{ marginBottom: "20px" }}>仪表盘</h2>

        {/* 统计卡片 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginRight: "15px" }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 最近申请 */}
        <div>
          <h3 style={{ marginBottom: "15px" }}>最近申请</h3>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>申请人</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    奖学金类型
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    申请日期
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>状态</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{app.name}</td>
                    <td style={{ padding: "12px" }}>{app.type}</td>
                    <td style={{ padding: "12px" }}>{app.date}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          backgroundColor:
                            app.status === "待审核"
                              ? "#e3f2fd"
                              : app.status === "已通过"
                              ? "#e8f5e9"
                              : "#ffebee",
                          color:
                            app.status === "待审核"
                              ? "#1976d2"
                              : app.status === "已通过"
                              ? "#2e7d32"
                              : "#c62828",
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "8px",
                        }}
                      >
                        查看
                      </button>
                      <button
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
