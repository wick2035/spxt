import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

interface User {
  id: string | number;
  username: string;
  name: string;
  role: "学生" | "管理员";
  email: string;
  status: "正常" | "禁用";
  lastLogin?: string;
  password?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("正在从simple-server请求用户数据...");

      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          // simple-server.js 中的验证中间件已经设置为放行所有请求
          // 但为了保持一致性，仍然保留此头部
          Authorization: `Bearer ${
            localStorage.getItem("adminToken") || "mock_token"
          }`,
        },
      });

      if (!response.ok) {
        throw new Error("获取用户数据失败");
      }

      const data = await response.json();
      console.log("获取到的用户数据:", data);
      setUsers(data || []);
    } catch (err) {
      console.error("获取用户列表失败:", err);
      setError(
        "获取用户数据失败，请确认是否启动了 simple-server.js (npx ts-node simple-server.ts)"
      );

      // 回退到测试数据
      setUsers([
        {
          id: "1",
          username: "student1",
          name: "张三",
          role: "学生",
          email: "zhangsan@example.com",
          status: "正常",
          lastLogin: "2024-03-15 14:30:00",
        },
        {
          id: "2",
          username: "admin1",
          name: "李四",
          role: "管理员",
          email: "lisi@example.com",
          status: "正常",
          lastLogin: "2024-03-15 15:20:00",
        },
        {
          id: "3",
          username: "student2",
          name: "王五",
          role: "学生",
          email: "wangwu@example.com",
          status: "禁用",
          lastLogin: "2024-03-14 09:15:00",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (newUser.username && newUser.name && newUser.role && newUser.email) {
      try {
        setIsLoading(true);
        setError(null);

        console.log("正在提交新用户数据:", newUser);

        const response = await fetch("http://localhost:5000/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
          body: JSON.stringify({
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            email: newUser.email,
            password: newUser.password || "123456", // 使用默认密码
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "添加用户失败");
        }

        const data = await response.json();
        console.log("添加用户成功:", data);

        // 更新用户列表
        setUsers([...users, data]);
        setShowAddModal(false);
        setNewUser({});
        setSuccessMessage("用户添加成功");

        // 3秒后清除成功消息
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: any) {
        console.error("添加用户失败:", err);
        setError(err.message || "添加用户失败，请稍后再试");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("请填写所有必填字段");
    }
  };

  const toggleUserStatus = async (userId: string | number) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      setIsLoading(true);
      setError(null);

      const newStatus = user.status === "正常" ? "禁用" : "正常";
      console.log(`正在更新用户 ${userId} 的状态为: ${newStatus}`);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "更新用户状态失败");
      }

      const data = await response.json();
      console.log("更新用户状态成功:", data);

      // 更新本地用户列表
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, status: newStatus };
          }
          return user;
        })
      );

      setSuccessMessage(`用户状态已更新为: ${newStatus}`);

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("更新用户状态失败:", err);
      setError(err.message || "更新用户状态失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理重置密码
  const handleResetPassword = async (userId: string | number) => {
    try {
      if (
        !window.confirm("确定要重置该用户的密码吗？将重置为默认密码：123456")
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log(`正在重置用户 ${userId} 的密码`);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/reset-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "重置密码失败");
      }

      const data = await response.json();
      console.log("重置密码成功:", data);

      setSuccessMessage("密码已重置为: 123456");

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("重置密码失败:", err);
      setError(err.message || "重置密码失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除用户
  const handleDeleteUser = async (userId: string | number) => {
    try {
      if (!window.confirm("确定要删除该用户吗？此操作不可撤销。")) {
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log(`正在删除用户 ${userId}`);

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("adminToken") || "mock_token"
            }`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "删除用户失败");
      }

      const data = await response.json();
      console.log("删除用户成功:", data);

      // 从用户列表中移除该用户
      setUsers(users.filter((user) => user.id !== userId));

      setSuccessMessage("用户已成功删除");

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("删除用户失败:", err);
      setError(err.message || "删除用户失败，请稍后再试");
    } finally {
      setIsLoading(false);
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
          <h2>用户管理</h2>
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
            添加用户
          </button>
        </div>

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

        {successMessage && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "10px 15px",
              borderRadius: "4px",
              marginBottom: "20px",
              color: "#2e7d32",
            }}
          >
            {successMessage}
          </div>
        )}

        {isLoading && !showAddModal ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            加载中...
          </div>
        ) : (
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
                  <th style={{ padding: "12px", textAlign: "left" }}>用户名</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>姓名</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>角色</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>邮箱</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>状态</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    最后登录
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{user.username}</td>
                    <td style={{ padding: "12px" }}>{user.name}</td>
                    <td style={{ padding: "12px" }}>{user.role}</td>
                    <td style={{ padding: "12px" }}>{user.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          backgroundColor:
                            user.status === "正常" ? "#e8f5e9" : "#ffebee",
                          color: user.status === "正常" ? "#2e7d32" : "#c62828",
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{user.lastLogin || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor:
                            user.status === "正常" ? "#dc3545" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                        disabled={isLoading}
                      >
                        {user.status === "正常" ? "禁用" : "启用"}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                        disabled={isLoading}
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        disabled={isLoading}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 添加用户模态框 */}
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
              <h3 style={{ marginBottom: "20px" }}>添加用户</h3>

              {error && showAddModal && (
                <div
                  style={{
                    backgroundColor: "#ffebee",
                    padding: "10px 15px",
                    borderRadius: "4px",
                    marginBottom: "15px",
                    color: "#c62828",
                    fontSize: "0.9rem",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  用户名 *
                </label>
                <input
                  type="text"
                  value={newUser.username || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  姓名 *
                </label>
                <input
                  type="text"
                  value={newUser.name || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  角色 *
                </label>
                <select
                  value={newUser.role || ""}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as "学生" | "管理员",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                >
                  <option value="">请选择角色</option>
                  <option value="学生">学生</option>
                  <option value="管理员">管理员</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  邮箱 *
                </label>
                <input
                  type="email"
                  value={newUser.email || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  密码
                </label>
                <input
                  type="password"
                  value={newUser.password || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                  placeholder="默认密码: 123456"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({});
                    setError(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f5f5f5",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleAddUser}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "提交中..." : "确定"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
