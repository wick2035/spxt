import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

interface Application {
  id: string;
  userId: string;
  batchId: string;
  status: "待审核" | "已通过" | "已拒绝";
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  scholarshipItems: any[];
  createdAt: string;
  batch: {
    id: string;
    name: string;
    type: string;
  };
  user?: {
    id: string;
    name: string;
    studentId: string;
  };
}

const ApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewResult, setReviewResult] = useState<"已通过" | "已拒绝">(
    "已通过"
  );
  const [reviewComment, setReviewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBatchId, setFilterBatchId] = useState<string>("all");
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [testApiStatus, setTestApiStatus] = useState<string | null>(null);

  // 获取所有申请
  const fetchApplications = async () => {
    setLoading(true);
    try {
      console.log("正在获取申请列表...");
      // 构建查询参数
      let url = "http://localhost:5000/api/applications/admin";
      const params = new URLSearchParams();

      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }

      if (filterBatchId !== "all") {
        params.append("batchId", filterBatchId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        console.warn("API 端点不存在，可能是服务器未启动或路由配置错误");
        setError("服务器暂时不可用，请稍后再试");
        return;
      }

      if (!response.ok) {
        throw new Error(
          `获取申请列表失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("成功获取申请数据:", data);
      setApplications(data);
      setError(null);
    } catch (err) {
      console.error("获取申请错误:", err);
      setError("获取申请列表失败，请确保服务器已启动");
    } finally {
      setLoading(false);
    }
  };

  // 获取批次列表用于筛选
  const fetchBatches = async () => {
    try {
      console.log("正在获取批次列表...");
      const response = await fetch("http://localhost:5000/api/batches", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        console.warn("批次API端点不存在");
        return;
      }

      if (!response.ok) {
        throw new Error(
          `获取批次列表失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("成功获取批次列表:", data);
      setBatches(data);
    } catch (err) {
      console.error("获取批次列表错误:", err);
    }
  };

  // 测试API连接
  const testApiConnection = async () => {
    try {
      setTestApiStatus("正在测试连接...");

      const response = await fetch("http://localhost:5000/api/test");

      if (response.ok) {
        console.log("API连接成功");
        setTestApiStatus("连接成功");

        // 连接成功后刷新申请数据
        fetchApplications();

        return true;
      } else {
        console.error("API连接失败:", response.status);
        setTestApiStatus(`连接失败 (${response.status})`);
        return false;
      }
    } catch (error) {
      console.error("API连接错误:", error);
      setTestApiStatus("连接错误");
      return false;
    }
  };

  // 创建测试申请数据
  const createTestApplication = async () => {
    try {
      console.log("创建测试申请数据...");
      const response = await fetch(
        "http://localhost:5000/api/test/create-application",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "创建测试申请失败");
        throw new Error(`创建测试申请失败: ${response.status}`);
      }

      const data = await response.json();
      console.log("创建测试申请结果:", data);
      alert(`测试申请创建成功！批次: ${data.batch.name}`);

      // 刷新申请列表
      fetchApplications();
    } catch (err) {
      console.error("创建测试申请错误:", err);
      setTestApiStatus("创建测试申请失败");
    }
  };

  // 初始加载
  useEffect(() => {
    fetchApplications();
    fetchBatches();
  }, []);

  // 筛选条件变化时重新获取数据
  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterBatchId]);

  const handleReview = (application: Application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
    setReviewComment("");
    setReviewResult("已通过");
  };

  const submitReview = async () => {
    if (selectedApplication) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/applications/${selectedApplication.id}/review`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: reviewResult,
              reviewComment,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("审核申请失败");
        }

        // 刷新申请列表
        alert("申请审核成功");
        fetchApplications();
        setShowReviewModal(false);
        setSelectedApplication(null);
      } catch (err) {
        console.error("审核申请错误:", err);
        setError("审核申请失败");
      }
    }
  };

  // 查看申请详情
  const viewApplicationDetail = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/applications/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("获取申请详情失败");
      }

      const data = await response.json();
      setSelectedApplication(data);
      // 这里可以添加跳转到详情页面的逻辑，或者打开详情模态框
      console.log("申请详情:", data);
    } catch (err) {
      console.error("获取申请详情错误:", err);
      setError("获取申请详情失败");
    }
  };

  // 删除申请
  const deleteApplication = async (id: string) => {
    if (window.confirm("确定要删除这条申请记录吗？此操作不可撤销。")) {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/applications/${id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        // 检查内容类型，确保是JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("返回的不是JSON格式:", await response.text());
          throw new Error("服务器返回了非JSON格式的响应");
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("删除失败:", errorData);
          throw new Error(errorData.message || "删除申请失败");
        }

        const data = await response.json();
        console.log("删除成功:", data);
        alert(data.message || "申请删除成功");
        // 刷新申请列表
        fetchApplications();
      } catch (err: any) {
        console.error("删除申请错误:", err);
        alert(err.message || "删除申请失败，请稍后再试");
        setError("删除申请失败，请稍后再试");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AdminLayout>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>申请管理</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={testApiConnection}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              测试API连接
            </button>
            <button
              onClick={createTestApplication}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              创建测试申请
            </button>
          </div>
        </div>

        {/* API测试状态 */}
        {testApiStatus && (
          <div
            style={{
              margin: "10px 0",
              padding: "10px",
              backgroundColor: testApiStatus.includes("失败")
                ? "#ffebee"
                : "#e8f5e9",
              color: testApiStatus.includes("失败") ? "#d32f2f" : "#2e7d32",
              borderRadius: "4px",
            }}
          >
            {testApiStatus}
          </div>
        )}

        {/* 过滤器 */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
          <div>
            <label style={{ marginRight: "10px" }}>状态筛选:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="all">全部状态</option>
              <option value="待审核">待审核</option>
              <option value="已通过">已通过</option>
              <option value="已拒绝">已拒绝</option>
            </select>
          </div>
          <div>
            <label style={{ marginRight: "10px" }}>批次筛选:</label>
            <select
              value={filterBatchId}
              onChange={(e) => setFilterBatchId(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <option value="all">全部批次</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        {/* 加载提示 */}
        {loading ? (
          <div>正在加载...</div>
        ) : (
          /* 申请列表 */
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
                  <th style={{ padding: "12px", textAlign: "left" }}>学号</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>批次</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>类型</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    申请日期
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>状态</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      暂无申请数据
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr
                      key={application.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "12px" }}>
                        {application.user?.name || "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {application.user?.studentId || "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {application.batch?.name}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {application.batch?.type}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            backgroundColor:
                              application.status === "已通过"
                                ? "#e8f5e9"
                                : application.status === "待审核"
                                ? "#fff3e0"
                                : "#ffebee",
                            color:
                              application.status === "已通过"
                                ? "#2e7d32"
                                : application.status === "待审核"
                                ? "#f57c00"
                                : "#c62828",
                          }}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleReview(application)}
                            disabled={application.status !== "待审核"}
                            style={{
                              padding: "4px 8px",
                              backgroundColor:
                                application.status === "待审核"
                                  ? "#1976d2"
                                  : "#ccc",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor:
                                application.status === "待审核"
                                  ? "pointer"
                                  : "not-allowed",
                            }}
                          >
                            审核
                          </button>
                          <button
                            onClick={() => deleteApplication(application.id)}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#c62828",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 审核模态框 */}
        {showReviewModal && selectedApplication && (
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
                padding: "20px",
                borderRadius: "8px",
                width: "500px",
              }}
            >
              <h3 style={{ marginBottom: "20px" }}>审核申请</h3>
              <div style={{ marginBottom: "15px" }}>
                <p>
                  <strong>申请人：</strong>
                  {selectedApplication.user?.name || "-"}
                </p>
                <p>
                  <strong>学号：</strong>
                  {selectedApplication.user?.studentId || "-"}
                </p>
                <p>
                  <strong>批次：</strong>
                  {selectedApplication.batch?.name}
                </p>
                <p>
                  <strong>类型：</strong>
                  {selectedApplication.batch?.type}
                </p>
                <p>
                  <strong>申请时间：</strong>
                  {new Date(selectedApplication.createdAt).toLocaleString()}
                </p>
                <div>
                  <strong>奖学金项目：</strong>
                  <ul
                    style={{
                      maxHeight: "150px",
                      overflowY: "auto",
                      margin: "10px 0",
                    }}
                  >
                    {selectedApplication.scholarshipItems.map((item, index) => (
                      <li key={index}>
                        {item.name} - {item.score}分
                        {item.description && ` (${item.description})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  审核结果
                </label>
                <select
                  value={reviewResult}
                  onChange={(e) =>
                    setReviewResult(e.target.value as "已通过" | "已拒绝")
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="已通过">通过</option>
                  <option value="已拒绝">拒绝</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  审核意见
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    height: "100px",
                  }}
                  placeholder="请输入审核意见"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f0f0f0",
                    border: "none",
                    borderRadius: "4px",
                    marginRight: "10px",
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={submitReview}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ApplicationManagement;
