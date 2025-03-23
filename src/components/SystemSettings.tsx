import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

interface SystemSettingsConfig {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maxApplicationsPerUser: number;
  allowNewApplications: boolean;
  maintenanceMode: boolean;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsConfig>({
    siteName: "奖学金管理系统",
    siteDescription: "用于管理学生奖学金申请和评审的系统",
    contactEmail: "admin@example.com",
    maxApplicationsPerUser: 3,
    allowNewApplications: true,
    maintenanceMode: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] =
    useState<SystemSettingsConfig>(settings);

  const handleSave = () => {
    setSettings(editedSettings);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSettings(settings);
    setIsEditing(false);
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
          <h2>系统设置</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              编辑设置
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleCancel}
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
                onClick={handleSave}
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
          )}
        </div>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              网站名称
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedSettings.siteName}
                onChange={(e) =>
                  setEditedSettings({
                    ...editedSettings,
                    siteName: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <div style={{ padding: "8px" }}>{settings.siteName}</div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              网站描述
            </label>
            {isEditing ? (
              <textarea
                value={editedSettings.siteDescription}
                onChange={(e) =>
                  setEditedSettings({
                    ...editedSettings,
                    siteDescription: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  height: "100px",
                }}
              />
            ) : (
              <div style={{ padding: "8px" }}>{settings.siteDescription}</div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              联系邮箱
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedSettings.contactEmail}
                onChange={(e) =>
                  setEditedSettings({
                    ...editedSettings,
                    contactEmail: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <div style={{ padding: "8px" }}>{settings.contactEmail}</div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              每个用户最大申请数量
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedSettings.maxApplicationsPerUser}
                onChange={(e) =>
                  setEditedSettings({
                    ...editedSettings,
                    maxApplicationsPerUser: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <div style={{ padding: "8px" }}>
                {settings.maxApplicationsPerUser}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              允许新申请
            </label>
            {isEditing ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  type="checkbox"
                  checked={editedSettings.allowNewApplications}
                  onChange={(e) =>
                    setEditedSettings({
                      ...editedSettings,
                      allowNewApplications: e.target.checked,
                    })
                  }
                />
                <span>启用</span>
              </div>
            ) : (
              <div style={{ padding: "8px" }}>
                {settings.allowNewApplications ? "是" : "否"}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              维护模式
            </label>
            {isEditing ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  type="checkbox"
                  checked={editedSettings.maintenanceMode}
                  onChange={(e) =>
                    setEditedSettings({
                      ...editedSettings,
                      maintenanceMode: e.target.checked,
                    })
                  }
                />
                <span>启用</span>
              </div>
            ) : (
              <div style={{ padding: "8px" }}>
                {settings.maintenanceMode ? "是" : "否"}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
