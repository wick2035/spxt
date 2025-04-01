import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

interface RecentApplication {
  id: number;
  name: string;
  type: string;
  date: string;
  status: string;
  scholarshipItems?: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });

  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<RecentApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // 获取仪表盘数据
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("正在从simple-server请求仪表盘数据...");

      // 获取统计数据
      const statsResponse = await fetch(
        "http://localhost:5000/api/admin/dashboard/stats",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error("获取统计数据失败");
      }

      const statsData = await statsResponse.json();
      console.log("获取到的统计数据:", statsData);

      // 获取最近申请
      const applicationsResponse = await fetch(
        "http://localhost:5000/api/admin/dashboard/recent-applications",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
        }
      );

      if (!applicationsResponse.ok) {
        throw new Error("获取最近申请失败");
      }

      const applicationsData = await applicationsResponse.json();
      console.log("获取到的申请数据:", applicationsData);

      // 更新状态
      setStats({
        totalApplications: statsData.totalApplications || 0,
        pendingApplications: statsData.pendingApplications || 0,
        approvedApplications: statsData.approvedApplications || 0,
        rejectedApplications: statsData.rejectedApplications || 0,
      });

      setRecentApplications(applicationsData || []);
    } catch (err) {
      console.error("获取仪表盘数据失败:", err);
      setError(
        "获取数据失败，请确认是否启动了 simple-server.js (npx ts-node simple-server.ts)"
      );
      // 使用测试数据作为备用
      setStats({
        totalApplications: 156,
        pendingApplications: 23,
        approvedApplications: 89,
        rejectedApplications: 44,
      });

      setRecentApplications([
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件加载时获取数据
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 从统计数据生成卡片数据
  const statsCards = [
    {
      label: "总申请数",
      value: stats.totalApplications.toString(),
      icon: "📝",
    },
    {
      label: "待审核",
      value: stats.pendingApplications.toString(),
      icon: "⏳",
    },
    {
      label: "已通过",
      value: stats.approvedApplications.toString(),
      icon: "✅",
    },
    {
      label: "已驳回",
      value: stats.rejectedApplications.toString(),
      icon: "❌",
    },
  ];

  // 查看申请详情
  const handleViewApplication = async (application: RecentApplication) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/applications/${application.id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("获取申请详情失败");
      }

      const data = await response.json();
      setSelectedApplication(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("获取申请详情失败:", err);
      setError("获取申请详情失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染申请详情模态框
  const renderApplicationDetailModal = () => {
    if (!selectedApplication) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            width: "80%",
            maxWidth: "800px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: 0 }}>申请详情</h3>
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>基本信息</h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <strong>申请人：</strong> {selectedApplication.name}
              </div>
              <div>
                <strong>申请类型：</strong> {selectedApplication.type}
              </div>
              <div>
                <strong>申请日期：</strong> {selectedApplication.date}
              </div>
              <div>
                <strong>状态：</strong>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor:
                      selectedApplication.status === "待审核"
                        ? "#e3f2fd"
                        : selectedApplication.status === "已通过"
                        ? "#e8f5e9"
                        : "#ffebee",
                    color:
                      selectedApplication.status === "待审核"
                        ? "#1976d2"
                        : selectedApplication.status === "已通过"
                        ? "#2e7d32"
                        : "#c62828",
                    marginLeft: "8px",
                  }}
                >
                  {selectedApplication.status}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>奖学金项目</h4>
            {selectedApplication.scholarshipItems?.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <strong>类型：</strong> {item.type}
                    </div>
                    <div>
                      <strong>级别：</strong> {item.level}
                    </div>
                    <div>
                      <strong>名称：</strong> {item.name}
                    </div>
                    <div>
                      <strong>分数：</strong> {item.score}
                    </div>
                  </div>

                  {item.fileUrl && (
                    <div>
                      <strong>佐证材料：</strong>
                      <div style={{ marginTop: "10px" }}>
                        {item.fileType?.startsWith("image/") ? (
                          <img
                            src={`http://localhost:5000${item.fileUrl}`}
                            alt={`${item.name}的佐证材料`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "300px",
                              borderRadius: "4px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000${item.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#1976d2",
                              textDecoration: "underline",
                            }}
                          >
                            查看文件 ({item.fileName})
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {selectedApplication.status === "待审核" && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  // 处理驳回逻辑
                  fetch(
                    `http://localhost:5000/api/applications/${selectedApplication.id}/review`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${
                          localStorage.getItem("adminToken") || "mock_token"
                        }`,
                      },
                      body: JSON.stringify({
                        status: "已驳回",
                        reviewComment: "申请材料不符合要求",
                      }),
                    }
                  )
                    .then((response) => {
                      if (response.ok) {
                        setShowDetailModal(false);
                        // 刷新申请列表
                        fetchDashboardData();
                      } else {
                        throw new Error("审核失败");
                      }
                    })
                    .catch((err) => {
                      console.error("审核错误:", err);
                      setError("审核失败，请稍后再试");
                    });
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                驳回
              </button>
              <button
                onClick={() => {
                  // 处理通过逻辑
                  fetch(
                    `http://localhost:5000/api/applications/${selectedApplication.id}/review`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${
                          localStorage.getItem("adminToken") || "mock_token"
                        }`,
                      },
                      body: JSON.stringify({
                        status: "已通过",
                        reviewComment: "申请材料符合要求",
                      }),
                    }
                  )
                    .then((response) => {
                      if (response.ok) {
                        setShowDetailModal(false);
                        // 刷新申请列表
                        fetchDashboardData();
                      } else {
                        throw new Error("审核失败");
                      }
                    })
                    .catch((err) => {
                      console.error("审核错误:", err);
                      setError("审核失败，请稍后再试");
                    });
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                通过
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div>
        <h2 style={{ marginBottom: "20px" }}>仪表盘</h2>

        {error && (
          <div
            style={{
              backgroundColor: "#ffebee",
              padding: "10px 15px",
              borderRadius: "4px",
              marginBottom: "20px",
              color: "#c62828",
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            加载中...
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              {statsCards.map((stat) => (
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
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        申请人
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        奖学金类型
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        申请日期
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        状态
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr
                        key={app.id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
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
                            onClick={() => handleViewApplication(app)}
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
                            onClick={() => {
                              if (window.confirm("确定要删除此申请吗？")) {
                                fetch(
                                  `http://localhost:5000/api/admin/applications/${app.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${
                                        localStorage.getItem("adminToken") ||
                                        "mock_token"
                                      }`,
                                    },
                                  }
                                )
                                  .then((response) => {
                                    if (response.ok) {
                                      alert("申请删除成功");
                                      setRecentApplications(
                                        recentApplications.filter(
                                          (a) => a.id !== app.id
                                        )
                                      );
                                    } else {
                                      throw new Error("删除申请失败");
                                    }
                                  })
                                  .catch((err) => {
                                    console.error("删除申请错误:", err);
                                    alert("删除申请失败，请稍后再试");
                                  });
                              }
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
          </>
        )}

        {/* 申请详情模态框 */}
        {showDetailModal && renderApplicationDetailModal()}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
