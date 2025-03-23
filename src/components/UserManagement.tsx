import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

interface User {
  id: number;
  username: string;
  name: string;
  role: "学生" | "管理员";
  email: string;
  status: "正常" | "禁用";
  lastLogin?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "student1",
      name: "张三",
      role: "学生",
      email: "zhangsan@example.com",
      status: "正常",
      lastLogin: "2024-03-15 14:30:00",
    },
    {
      id: 2,
      username: "admin1",
      name: "李四",
      role: "管理员",
      email: "lisi@example.com",
      status: "正常",
      lastLogin: "2024-03-15 15:20:00",
    },
    {
      id: 3,
      username: "student2",
      name: "王五",
      role: "学生",
      email: "wangwu@example.com",
      status: "禁用",
      lastLogin: "2024-03-14 09:15:00",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});

  const handleAddUser = () => {
    if (newUser.username && newUser.name && newUser.role && newUser.email) {
      const user: User = {
        id: users.length + 1,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role as "学生" | "管理员",
        email: newUser.email,
        status: "正常",
      };
      setUsers([...users, user]);
      setShowAddModal(false);
      setNewUser({});
    }
  };

  const toggleUserStatus = (userId: number) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            status: user.status === "正常" ? "禁用" : "正常",
          };
        }
        return user;
      })
    );
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

        {/* 用户列表 */}
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
                <th style={{ padding: "12px", textAlign: "left" }}>最后登录</th>
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
                      }}
                    >
                      {user.status === "正常" ? "禁用" : "启用"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  用户名
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
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  姓名
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
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  角色
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
                >
                  <option value="">请选择角色</option>
                  <option value="学生">学生</option>
                  <option value="管理员">管理员</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  邮箱
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
                  onClick={() => setShowAddModal(false)}
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
                >
                  确定
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
