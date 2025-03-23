import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

interface Batch {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "未开始" | "进行中" | "已结束";
}

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatch, setNewBatch] = useState<Partial<Batch>>({});
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [testApiStatus, setTestApiStatus] = useState<string | null>(null);

  // 获取批次列表
  const fetchBatches = async () => {
    setLoading(true);
    try {
      console.log("正在获取批次数据...");
      const response = await fetch("http://localhost:5000/api/batches", {
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
          `获取批次数据失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("成功获取批次数据:", data);
      setBatches(data);
      setError(null);
    } catch (err) {
      console.error("获取批次错误:", err);
      setError("获取批次数据失败，请确保服务器已启动");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchBatches();
  }, []);

  // 添加批次
  const handleAddBatch = async () => {
    if (
      newBatch.name &&
      newBatch.type &&
      newBatch.startDate &&
      newBatch.endDate
    ) {
      try {
        const response = await fetch("http://localhost:5000/api/batches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            name: newBatch.name,
            type: newBatch.type,
            startDate: newBatch.startDate,
            endDate: newBatch.endDate,
            status: "未开始",
          }),
        });

        if (!response.ok) {
          throw new Error("创建批次失败");
        }

        // 刷新批次列表
        fetchBatches();
        setShowAddModal(false);
        setNewBatch({});
      } catch (err) {
        console.error("创建批次错误:", err);
        setError("创建批次失败");
      }
    }
  };

  // 编辑批次
  const handleEditBatch = async () => {
    if (!editBatch) return;

    try {
      console.log("更新批次:", editBatch);
      const response = await fetch(
        `http://localhost:5000/api/batches/${editBatch.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editBatch),
        }
      );

      if (!response.ok) {
        throw new Error("更新批次失败");
      }

      // 刷新批次列表
      alert("批次更新成功");
      fetchBatches();
      setShowEditModal(false);
      setEditBatch(null);
    } catch (err) {
      console.error("更新批次错误:", err);
      setError("更新批次失败");
    }
  };

  // 删除批次
  const handleDeleteBatch = async (id: string) => {
    if (window.confirm("确定要删除此批次吗？")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/batches/${id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 400) {
          const errorData = await response.json();
          alert(errorData.message || "删除失败，该批次可能有关联的申请");
          return;
        }

        if (!response.ok) {
          throw new Error("删除批次失败");
        }

        // 刷新批次列表
        alert("批次删除成功");
        fetchBatches();
      } catch (err) {
        console.error("删除批次错误:", err);
        setError("删除批次失败");
      }
    }
  };

  // 更新批次状态
  const handleUpdateStatus = async (
    id: string,
    status: "未开始" | "进行中" | "已结束"
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/batches/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("更新状态失败");
      }

      // 刷新批次列表
      fetchBatches();
    } catch (err) {
      console.error("更新状态错误:", err);
      setError("更新状态失败");
    }
  };

  // 打开编辑模态框
  const openEditModal = (batch: Batch) => {
    setEditBatch(batch);
    setShowEditModal(true);
  };

  // 测试API连接
  const testApiConnection = async () => {
    try {
      setTestApiStatus("正在测试连接...");

      const response = await fetch("http://localhost:5000/api/test");

      if (response.ok) {
        console.log("API连接成功");
        setTestApiStatus("连接成功");

        // 连接成功后刷新批次数据
        fetchBatches();

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

  // 创建测试批次
  const createTestBatch = async () => {
    try {
      const testBatch = {
        name: `测试批次 ${new Date().toLocaleString()}`,
        type: "测试类",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "未开始",
      };

      console.log("创建测试批次:", testBatch);

      const response = await fetch("http://localhost:5000/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testBatch),
      });

      if (!response.ok) {
        throw new Error(
          `创建批次失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("创建批次成功:", data);

      // 刷新批次列表
      fetchBatches();
      setTestApiStatus("创建测试批次成功");
    } catch (err) {
      console.error("创建测试批次错误:", err);
      setTestApiStatus("创建测试批次失败");
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
          <h2>批次管理</h2>
          <div>
            <button
              onClick={testApiConnection}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              测试API连接
            </button>
            <button
              onClick={createTestBatch}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              创建测试批次
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              新建批次
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

        {/* 错误提示 */}
        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        {/* 加载提示 */}
        {loading ? (
          <div>正在加载...</div>
        ) : (
          /* 批次列表 */
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
                    批次名称
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>类型</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    开始日期
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    结束日期
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>状态</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      暂无批次数据
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr
                      key={batch.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "12px" }}>{batch.name}</td>
                      <td style={{ padding: "12px" }}>{batch.type}</td>
                      <td style={{ padding: "12px" }}>{batch.startDate}</td>
                      <td style={{ padding: "12px" }}>{batch.endDate}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            backgroundColor:
                              batch.status === "进行中"
                                ? "#e8f5e9"
                                : batch.status === "未开始"
                                ? "#e3f2fd"
                                : "#f5f5f5",
                            color:
                              batch.status === "进行中"
                                ? "#2e7d32"
                                : batch.status === "未开始"
                                ? "#1976d2"
                                : "#666",
                          }}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => openEditModal(batch)}
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
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          删除
                        </button>
                        <div style={{ display: "inline-block" }}>
                          <select
                            value={batch.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                batch.id,
                                e.target.value as "未开始" | "进行中" | "已结束"
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                            }}
                          >
                            <option value="未开始">未开始</option>
                            <option value="进行中">进行中</option>
                            <option value="已结束">已结束</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 新建批次模态框 */}
        {showAddModal && (
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
                width: "400px",
              }}
            >
              <h3 style={{ marginBottom: "20px" }}>新建批次</h3>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  批次名称
                </label>
                <input
                  type="text"
                  value={newBatch.name || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  类型
                </label>
                <select
                  value={newBatch.type || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">请选择类型</option>
                  <option value="学习类">学习类</option>
                  <option value="科研类">科研类</option>
                  <option value="社会工作类">社会工作类</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  开始日期
                </label>
                <input
                  type="date"
                  value={newBatch.startDate || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, startDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  结束日期
                </label>
                <input
                  type="date"
                  value={newBatch.endDate || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, endDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
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
                  onClick={() => setShowAddModal(false)}
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
                  onClick={handleAddBatch}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑批次模态框 */}
        {showEditModal && editBatch && (
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
                width: "400px",
              }}
            >
              <h3 style={{ marginBottom: "20px" }}>编辑批次</h3>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  批次名称
                </label>
                <input
                  type="text"
                  value={editBatch.name || ""}
                  onChange={(e) =>
                    setEditBatch({ ...editBatch, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  类型
                </label>
                <select
                  value={editBatch.type || ""}
                  onChange={(e) =>
                    setEditBatch({ ...editBatch, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  <option value="学习类">学习类</option>
                  <option value="科研类">科研类</option>
                  <option value="社会工作类">社会工作类</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  开始日期
                </label>
                <input
                  type="date"
                  value={editBatch.startDate || ""}
                  onChange={(e) =>
                    setEditBatch({ ...editBatch, startDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  结束日期
                </label>
                <input
                  type="date"
                  value={editBatch.endDate || ""}
                  onChange={(e) =>
                    setEditBatch({ ...editBatch, endDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
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
                  onClick={() => setShowEditModal(false)}
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
                  onClick={handleEditBatch}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BatchManagement;
