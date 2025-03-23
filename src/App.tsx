import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import BatchManagement from "./components/BatchManagement";
import ApplicationManagement from "./components/ApplicationManagement";
import UserManagement from "./components/UserManagement";
import SystemSettings from "./components/SystemSettings";
import ScholarshipApp from "./complete-scholarship-flow";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("adminToken")
  );

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      console.log("Attempting login with:", { username });

      // 显示请求信息，帮助调试
      const apiUrl = "http://localhost:5000/api/admin/login";
      console.log("API URL:", apiUrl);
      console.log("Request payload:", { username, password: "***" });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      // 即使不是200也先获取响应内容
      const data = await response.json();
      console.log(
        "Login response status:",
        response.status,
        response.statusText
      );
      console.log("Login response data:", data);

      if (!response.ok) {
        let errorMessage = data.message || "登录失败";
        if (data.error) {
          console.error("Login error details:", data.error);
          if (data.error === "Invalid password") {
            errorMessage = "密码错误";
          } else if (data.error === "User not found") {
            errorMessage = "用户名不存在";
          }
        }
        throw new Error(errorMessage);
      }

      console.log("Login successful");
      localStorage.setItem("adminToken", data.token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* 前台路由 */}
        <Route path="/student" element={<ScholarshipApp />} />

        {/* 后台路由 */}
        <Route
          path="/admin/login"
          element={
            !isAuthenticated ? (
              <AdminLogin onLogin={handleAdminLogin} />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            isAuthenticated ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/batches"
          element={
            isAuthenticated ? (
              <BatchManagement />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/applications"
          element={
            isAuthenticated ? (
              <ApplicationManagement />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            isAuthenticated ? (
              <UserManagement />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/settings"
          element={
            isAuthenticated ? (
              <SystemSettings />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* 默认路由重定向到前台 */}
        <Route path="/" element={<Navigate to="/student" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
