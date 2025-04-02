import React, { useEffect } from "react";

// 定义类型
interface ScholarshipItem {
  id: number;
  type: string;
  level: string;
  name: string;
  file: File | null;
  files: File[] | null;
  score: string;
}

interface Application {
  id: string;
  year: string;
  term: string;
  date: string;
  name: string;
  type: string;
  score: string;
  status: string;
  editable: boolean;
  batchId: string;
  scholarshipItems?: any[] | string;
}

interface Batch {
  id: string;
  year: string;
  term: string;
  name: string;
  deadline: string;
  status: string;
}

interface StudentInfo {
  id: string;
  name: string;
  department: string;
  grade: string;
  major: string;
}

function ScholarshipApp() {
  // 使用React状态钩子
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [serverStatus, setServerStatus] = React.useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");
  const [studentInfo, setStudentInfo] = React.useState<StudentInfo | null>(
    null
  );
  const [studentId, setStudentId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState<
    "dashboard" | "apply" | "applications"
  >("dashboard");
  const [currentSubpage, setCurrentSubpage] = React.useState<
    "batchSelect" | "applicationForm" | "applicationList"
  >("batchSelect");
  const [selectedBatch, setSelectedBatch] = React.useState<Batch | null>(null);

  // 申请项目相关状态
  const [scholarshipItems, setScholarshipItems] = React.useState<
    ScholarshipItem[]
  >([
    {
      id: 1,
      type: "",
      level: "",
      name: "",
      file: null,
      files: null,
      score: "",
    },
  ]);
  const [currentItemIndex, setCurrentItemIndex] = React.useState(0);

  // 批次和申请记录
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);

  // 编辑相关状态
  const [editMode, setEditMode] = React.useState(false);
  const [editApplicationId, setEditApplicationId] = React.useState("");

  // 定义颜色常量
  const colors = {
    primary: "#8E9AA9",
    secondary: "#D0D1CC",
    accent: "#B4A599",
    background: "#F5F5F3",
    text: "#3C4654",
    border: "#E0E2E0",
    success: "#A8B9A8",
    error: "#C9A9A6",
    warning: "#D6C9A3",
  };

  // 检查服务器连接状态
  const checkServerConnection = async () => {
    try {
      console.log("正在检查服务器连接状态...");
      const response = await fetch("http://localhost:5000/api/test");

      if (response.ok) {
        const data = await response.json();
        console.log("服务器连接正常:", data);
        setServerStatus("connected");
        return true;
      } else {
        const errorText = await response.text();
        console.error("服务器连接异常:", response.status, errorText);
        setServerStatus("disconnected");
        return false;
      }
    } catch (error) {
      console.error("服务器连接检查失败:", error);
      setServerStatus("disconnected");
      return false;
    }
  };

  // 检查本地存储中的登录状态
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    const storedStudentInfo = localStorage.getItem("studentInfo");

    if (token && storedStudentInfo) {
      setIsLoggedIn(true);
      setStudentInfo(JSON.parse(storedStudentInfo));
      // 加载批次和申请数据
      fetchBatches();
      fetchApplications(JSON.parse(storedStudentInfo).id);
    }

    // 检查服务器连接状态
    checkServerConnection();
  }, []);

  // 获取可用批次
  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/student/batches");

      if (!response.ok) {
        throw new Error("获取批次数据失败");
      }

      const data = await response.json();
      console.log("获取到的批次数据:", data);
      setBatches(data);
    } catch (error) {
      console.error("获取批次错误:", error);
      setErrorMessage("无法获取奖学金批次，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 获取申请记录
  const fetchApplications = async (studentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/student/applications/${studentId}`
      );

      if (!response.ok) {
        throw new Error("获取申请记录失败");
      }

      const data = await response.json();
      console.log("获取到的申请记录:", data);
      setApplications(data);
    } catch (error) {
      console.error("获取申请记录错误:", error);
      setErrorMessage("无法获取申请记录，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 登录处理函数
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !password) {
      setErrorMessage("学号和密码不能为空");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      // 检查API服务器是否可用
      try {
        console.log("检查服务器连接状态...");
        const testResponse = await fetch("http://localhost:5000/api/test");
        if (!testResponse.ok) {
          throw new Error("API服务器不可用，请确保后端服务已启动");
        }
        console.log("API服务器可用，尝试登录...");
      } catch (error) {
        console.error("API服务器连接失败:", error);
        throw new Error("无法连接到服务器，请确保后端服务已启动");
      }

      console.log("尝试登录...");
      const response = await fetch("http://localhost:5000/api/student/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("服务器返回错误:", response.status, errorText);
        throw new Error(
          `登录失败 (${response.status}): ${errorText.substring(0, 100)}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "登录失败，请检查学号和密码");
      }

      console.log("登录成功:", data);

      // 保存登录状态和学生信息
      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentInfo", JSON.stringify(data.studentInfo));

      setStudentInfo(data.studentInfo);
      setIsLoggedIn(true);

      // 加载批次和申请数据
      fetchBatches();
      fetchApplications(data.studentInfo.id);
    } catch (error: any) {
      console.error("登录错误:", error);
      setErrorMessage(error.message || "登录失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentInfo");
    setIsLoggedIn(false);
    setStudentInfo(null);
    setApplications([]);
    setBatches([]);
  };

  // 批次选择处理
  const handleSelectBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentSubpage("applicationForm");
  };

  // 返回批次选择
  const handleBackToBatchSelect = () => {
    setCurrentSubpage("batchSelect");
    setSelectedBatch(null);
  };

  // 奖学金项目变更
  const handleItemChange = (field: string, value: string) => {
    const updatedItems = [...scholarshipItems];
    updatedItems[currentItemIndex] = {
      ...updatedItems[currentItemIndex],
      [field]: value,
    };
    setScholarshipItems(updatedItems);
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const updatedItems = [...scholarshipItems];
      updatedItems[currentItemIndex] = {
        ...updatedItems[currentItemIndex],
        files: files, // Store multiple files
      };
      setScholarshipItems(updatedItems);
    }
  };

  // 添加奖学金项目
  const handleAddItem = () => {
    const newItem: ScholarshipItem = {
      id: scholarshipItems.length + 1,
      type: "",
      level: "",
      name: "",
      file: null,
      files: null,
      score: "",
    };
    setScholarshipItems([...scholarshipItems, newItem]);
    setCurrentItemIndex(scholarshipItems.length);
  };

  // 删除当前项目
  const handleRemoveItem = () => {
    if (scholarshipItems.length <= 1) return;

    const updatedItems = [...scholarshipItems];
    updatedItems.splice(currentItemIndex, 1);
    setScholarshipItems(updatedItems);

    if (currentItemIndex >= updatedItems.length) {
      setCurrentItemIndex(updatedItems.length - 1);
    }
  };

  // 切换到上一个项目
  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  // 切换到下一个项目
  const handleNextItem = () => {
    if (currentItemIndex < scholarshipItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode) {
      handleUpdateApplication();
    } else {
      handleCreateApplication();
    }
  };

  // 计算总分 - 所有项目分数的总和
  const calculateTotalScore = (items: ScholarshipItem[]): string => {
    const sum = items.reduce((total, item) => {
      const score = parseInt(item.score) || 0;
      return total + score;
    }, 0);
    return sum.toString();
  };

  // 提交申请
  const handleCreateApplication = async () => {
    if (!selectedBatch) {
      setErrorMessage("请选择奖学金批次");
      return;
    }

    if (
      scholarshipItems.length === 0 ||
      scholarshipItems.some((item) => !item.type || !item.level || !item.name)
    ) {
      setErrorMessage("请完善奖学金申请项目信息");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      // 计算总分 - 所有项目分数之和
      const totalScore = scholarshipItems.reduce((sum, item) => {
        const itemScore = parseInt(item.score || "0", 10);
        return sum + itemScore;
      }, 0);

      console.log("计算总分:", totalScore);

      // 准备文件上传
      const formData = new FormData();
      formData.append("studentId", studentInfo?.id || "");
      formData.append("batchId", selectedBatch.id);
      formData.append("totalScore", totalScore.toString());

      // 添加奖学金项目信息
      const scholarshipItemsData = scholarshipItems.map((item) => ({
        type: item.type,
        level: item.level,
        name: item.name,
        score: item.score,
      }));
      formData.append("scholarshipItems", JSON.stringify(scholarshipItemsData));

      // 添加文件
      scholarshipItems.forEach((item, index) => {
        if (item.files && item.files.length > 0) {
          item.files.forEach((file) => {
            formData.append("files", file);
          });
        }
      });

      console.log("提交申请:", formData);

      const response = await fetch(
        "http://localhost:5000/api/student/applications",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("申请提交失败，请稍后再试");
      }

      const data = await response.json();
      console.log("申请提交结果:", data);

      // 提交成功后的处理
      setSuccessMessage("申请提交成功！");

      // 重置表单
      setTimeout(() => {
        setCurrentSubpage("applicationList");
        setScholarshipItems([
          {
            id: 1,
            type: "",
            level: "",
            name: "",
            file: null,
            files: null,
            score: "",
          },
        ]);
        setCurrentItemIndex(0);
        setSuccessMessage("");
        // 刷新申请列表
        fetchApplications(studentInfo?.id || "");
      }, 2000);
    } catch (error: any) {
      console.error("申请提交错误:", error);
      setErrorMessage(error.message || "申请提交失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新申请
  const handleUpdateApplication = async () => {
    if (!studentInfo || !selectedBatch || !editApplicationId) {
      setErrorMessage("缺少必要信息，无法更新申请");
      return;
    }

    // 验证是否有项目
    if (scholarshipItems.length === 0) {
      setErrorMessage("请至少添加一个奖学金申请项目");
      return;
    }

    // 验证项目数据完整性
    const incompleteItem = scholarshipItems.find(
      (item) => !item.type || !item.level || !item.name || !item.score
    );

    if (incompleteItem) {
      setErrorMessage("请完整填写所有申请项目信息");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      // 计算总分
      const totalScore = calculateTotalScore(scholarshipItems);

      // 准备申请数据
      const applicationData = {
        studentId: studentInfo.id,
        batchId: selectedBatch.id,
        scholarshipItems: scholarshipItems.map((item) => ({
          type: item.type,
          level: item.level,
          name: item.name,
          score: item.score,
        })),
        totalScore: totalScore,
      };

      console.log("准备更新申请:", applicationData);

      // 发送更新请求到API
      const response = await fetch(
        `http://localhost:5000/api/student/applications/${editApplicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`更新申请失败: ${errorText}`);
      }

      const result = await response.json();
      console.log("申请更新结果:", result);

      // 更新本地应用状态
      const updatedApplications = applications.map((app) => {
        if (app.id === editApplicationId) {
          return {
            ...app,
            scholarshipItems: applicationData.scholarshipItems,
            score: totalScore, // 更新总分
          };
        }
        return app;
      });

      setApplications(updatedApplications);

      // 重置状态
      setEditMode(false);
      setEditApplicationId("");
      setCurrentSubpage("applicationList");
      setCurrentPage("applications");
      setScholarshipItems([
        {
          id: 1,
          type: "",
          level: "",
          name: "",
          file: null,
          files: null,
          score: "",
        },
      ]);
      setCurrentItemIndex(0);

      // 显示成功信息
      setSuccessMessage("申请已成功更新");
      setTimeout(() => setSuccessMessage(""), 3000);

      // 重新加载申请列表
      await fetchApplications(studentInfo.id);
    } catch (error) {
      console.error("更新申请错误:", error);
      setErrorMessage("更新申请失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 撤回申请
  const handleWithdrawApplication = async (id: string) => {
    if (!studentInfo) return;

    if (window.confirm("确定要撤回此申请吗?")) {
      try {
        setIsLoading(true);

        const response = await fetch(
          `http://localhost:5000/api/student/applications/${id}?studentId=${studentInfo.id}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "撤回申请失败");
        }

        console.log("申请撤回成功:", data);
        alert("申请已成功撤回");

        // 刷新申请记录
        fetchApplications(studentInfo.id);
      } catch (error: any) {
        console.error("撤回申请错误:", error);
        setErrorMessage(error.message || "撤回申请失败，请稍后再试");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 修改申请
  const handleEditApplication = (application: Application) => {
    try {
      console.log("编辑申请:", application);
      // 先检查批次信息是否已加载，如果没有则先加载批次信息
      if (batches.length === 0) {
        setIsLoading(true);
        fetch("http://localhost:5000/api/student/batches")
          .then((response) => {
            if (!response.ok) {
              throw new Error("无法获取批次信息");
            }
            return response.json();
          })
          .then((data) => {
            setBatches(data);
            continueEditApplication(application, data);
          })
          .catch((error) => {
            console.error("获取批次数据失败:", error);
            setErrorMessage("获取批次信息失败，无法修改申请");
            setIsLoading(false);
          });
      } else {
        continueEditApplication(application, batches);
      }
    } catch (error) {
      console.error("准备编辑申请失败:", error);
      setErrorMessage("准备编辑申请失败，请稍后再试");
    }
  };

  // 继续编辑申请过程
  const continueEditApplication = (
    application: Application,
    availableBatches: Batch[]
  ) => {
    // 获取批次信息
    const batch = availableBatches.find((b) => b.id === application.batchId);
    if (!batch) {
      // 如果找不到对应批次，创建一个临时批次对象用于显示
      const tempBatch: Batch = {
        id: application.batchId,
        year: application.year,
        term: application.term,
        name: application.name,
        deadline: application.date,
        status: "进行中",
      };

      setSelectedBatch(tempBatch);
    } else {
      setSelectedBatch(batch);
    }

    // 解析申请项目数据
    let applicationItems: ScholarshipItem[] = [];

    try {
      // 尝试解析scholarshipItems
      if (application.scholarshipItems) {
        const parsedItems =
          typeof application.scholarshipItems === "string"
            ? JSON.parse(application.scholarshipItems)
            : application.scholarshipItems;

        applicationItems = parsedItems.map((item: any, index: number) => ({
          id: index + 1,
          type: item.type || "",
          level: item.level || "",
          name: item.name || "",
          score: item.score || "",
          file: null,
          files: null,
        }));
      }
    } catch (error) {
      console.error("解析申请项目数据失败:", error);
      applicationItems = [
        {
          id: 1,
          type: "",
          level: "",
          name: "",
          file: null,
          files: null,
          score: "",
        },
      ];
    }

    // 如果没有项目数据，添加一个空项目
    if (applicationItems.length === 0) {
      applicationItems = [
        {
          id: 1,
          type: "",
          level: "",
          name: "",
          file: null,
          files: null,
          score: "",
        },
      ];
    }

    // 设置批次和申请项目数据
    setScholarshipItems(applicationItems);
    setCurrentItemIndex(0);

    // 设置编辑模式
    setEditMode(true);
    setEditApplicationId(application.id);
    setIsLoading(false);

    // 切换页面并设置子页面为申请表单
    setCurrentPage("apply");
    setCurrentSubpage("applicationForm");

    console.log("正在编辑申请:", application.id, "项目数据:", applicationItems);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditApplicationId("");
    setCurrentSubpage("applicationList");
    setScholarshipItems([
      {
        id: 1,
        type: "",
        level: "",
        name: "",
        file: null,
        files: null,
        score: "",
      },
    ]);
    setCurrentItemIndex(0);
  };

  // 渲染顶部导航
  const renderTopNav = () => {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "1rem 2rem",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: "bold", color: colors.text }}>
          奖学金评定系统
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ color: colors.text, fontSize: "0.9rem" }}>
            {studentInfo ? `${studentInfo.name} (${studentInfo.id})` : "学生"}
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: colors.primary,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            退出
          </button>
        </div>
      </div>
    );
  };

  // 加载中提示
  const renderLoadingState = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          width: "100%",
        }}
      >
        <div style={{ color: colors.primary, fontSize: "1rem" }}>加载中...</div>
      </div>
    );
  };

  // 错误提示
  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <div
        style={{
          backgroundColor: colors.error,
          color: "white",
          padding: "0.75rem 1rem",
          borderRadius: "4px",
          margin: "1rem 0",
          fontSize: "0.9rem",
        }}
      >
        {errorMessage}
      </div>
    );
  };

  // 渲染批次选择
  const renderBatchSelection = () => {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ color: colors.text, marginBottom: "1.5rem" }}>
          选择奖学金批次
        </h2>

        {renderErrorMessage()}

        {isLoading ? (
          renderLoadingState()
        ) : (
          <>
            {batches.length === 0 ? (
              <div style={{ color: colors.text, padding: "1rem 0" }}>
                当前没有可申请的奖学金批次
              </div>
            ) : (
              <div style={{ display: "grid", gridGap: "1rem" }}>
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          color: colors.text,
                        }}
                      >
                        {batch.name}
                      </div>
                      <div
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          backgroundColor:
                            batch.status === "开放中"
                              ? colors.success
                              : batch.status === "即将截止"
                              ? colors.warning
                              : colors.secondary,
                          color: "white",
                        }}
                      >
                        {batch.status}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        {`${batch.year}年${batch.term} · 截止日期: ${batch.deadline}`}
                      </div>
                      <button
                        onClick={() => handleSelectBatch(batch)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: colors.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        申请
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // 渲染申请记录页面
  const renderApplicationListPage = () => {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ color: colors.text, marginBottom: "1.5rem" }}>申请记录</h2>

        {renderErrorMessage()}

        {isLoading ? (
          renderLoadingState()
        ) : (
          <>
            {applications.length === 0 ? (
              <div style={{ color: colors.text, padding: "1rem 0" }}>
                暂无申请记录
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: colors.background,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: "normal",
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        批次
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: "normal",
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        类型
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: "normal",
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        得分
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: "normal",
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        状态
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: "normal",
                          color: colors.text,
                          fontSize: "0.9rem",
                        }}
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "1rem",
                            color: colors.text,
                            fontSize: "0.9rem",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>{app.name}</div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: colors.primary,
                            }}
                          >
                            {`${app.year}年${app.term} · ${app.date}`}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: colors.text,
                            fontSize: "0.9rem",
                          }}
                        >
                          {app.type}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: colors.text,
                            fontSize: "0.9rem",
                          }}
                        >
                          {app.score}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-block",
                              padding: "0.3rem 0.6rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              backgroundColor:
                                app.status === "已通过"
                                  ? colors.success
                                  : app.status === "待审核"
                                  ? colors.warning
                                  : colors.error,
                              color: "white",
                            }}
                          >
                            {app.status}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: colors.text,
                            fontSize: "0.9rem",
                          }}
                        >
                          {app.editable && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleEditApplication(app)}
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  backgroundColor: colors.primary,
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                }}
                              >
                                修改
                              </button>
                              <button
                                onClick={() =>
                                  handleWithdrawApplication(app.id)
                                }
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  backgroundColor: colors.error,
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                }}
                              >
                                撤回
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // 渲染登录页面
  const renderLoginPage = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: colors.background,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "2rem",
            width: "360px",
          }}
        >
          <h2
            style={{
              color: colors.text,
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            学生奖学金系统
          </h2>

          {/* 服务器连接状态 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              padding: "0.5rem",
              backgroundColor:
                serverStatus === "connected"
                  ? `${colors.success}30`
                  : serverStatus === "disconnected"
                  ? `${colors.error}30`
                  : `${colors.warning}30`,
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor:
                  serverStatus === "connected"
                    ? colors.success
                    : serverStatus === "disconnected"
                    ? colors.error
                    : colors.warning,
                marginRight: "0.5rem",
              }}
            />
            <span
              style={{
                fontSize: "0.9rem",
                color:
                  serverStatus === "connected"
                    ? colors.success
                    : serverStatus === "disconnected"
                    ? colors.error
                    : colors.warning,
              }}
            >
              {serverStatus === "connected"
                ? "服务器连接正常"
                : serverStatus === "disconnected"
                ? "无法连接到服务器"
                : "正在检查服务器连接..."}
            </span>
            {serverStatus === "disconnected" && (
              <button
                onClick={checkServerConnection}
                style={{
                  marginLeft: "0.5rem",
                  backgroundColor: "transparent",
                  border: "none",
                  color: colors.primary,
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                重试
              </button>
            )}
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: colors.error,
                color: "white",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: colors.text,
                  fontSize: "0.9rem",
                }}
              >
                学号
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="请输入学号"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: colors.text,
                  fontSize: "0.9rem",
                }}
              >
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: colors.primary,
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                cursor: "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>

          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.85rem",
              color: colors.primary,
              textAlign: "center",
            }}
          >
            测试账号: 2022001, 密码: 123456
          </div>
        </div>
      </div>
    );
  };

  // 渲染申请表单页面
  const renderApplicationFormPage = () => {
    return (
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: colors.background,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ color: colors.text, margin: 0 }}>
              {editMode ? "修改申请" : "奖学金申请"}
            </h2>
            <button
              onClick={editMode ? handleCancelEdit : handleBackToBatchSelect}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: colors.primary,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              返回
            </button>
          </div>

          {selectedBatch && (
            <div
              style={{
                backgroundColor: `${colors.primary}10`,
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  color: colors.text,
                  fontSize: "1.1rem",
                  marginTop: 0,
                  marginBottom: "0.5rem",
                }}
              >
                {selectedBatch.name}
              </h3>
              <p
                style={{
                  color: colors.text,
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                <span style={{ marginRight: "1rem" }}>
                  学年: {selectedBatch.year}
                </span>
                <span style={{ marginRight: "1rem" }}>
                  学期: {selectedBatch.term}
                </span>
                <span>截止日期: {selectedBatch.deadline}</span>
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                backgroundColor: `${colors.error}20`,
                color: colors.error,
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                backgroundColor: `${colors.success}20`,
                color: colors.success,
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    color: colors.text,
                    fontSize: "1rem",
                    margin: 0,
                  }}
                >
                  申请项目 {currentItemIndex + 1}/{scholarshipItems.length}
                </h3>
                <div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid " + colors.primary,
                      borderRadius: "4px",
                      color: colors.primary,
                      padding: "0.4rem 0.75rem",
                      marginRight: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    添加项目
                  </button>
                  {scholarshipItems.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRemoveItem}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid " + colors.error,
                        borderRadius: "4px",
                        color: colors.error,
                        padding: "0.4rem 0.75rem",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      删除项目
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label
                    htmlFor="itemType"
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    奖学金类型 *
                  </label>
                  <select
                    id="itemType"
                    value={
                      scholarshipItems[currentItemIndex]
                        ? scholarshipItems[currentItemIndex].type
                        : ""
                    }
                    onChange={(e) => handleItemChange("type", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid " + colors.border,
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                      color: colors.text,
                    }}
                    required
                  >
                    <option value="">请选择类型</option>
                    <option value="学习优秀类">学习优秀类</option>
                    <option value="科研创新类">科研创新类</option>
                    <option value="社会工作类">社会工作类</option>
                    <option value="文体特长类">文体特长类</option>
                    <option value="志愿服务类">志愿服务类</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="itemLevel"
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    奖学金级别 *
                  </label>
                  <select
                    id="itemLevel"
                    value={
                      scholarshipItems[currentItemIndex]
                        ? scholarshipItems[currentItemIndex].level
                        : ""
                    }
                    onChange={(e) => handleItemChange("level", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid " + colors.border,
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                      color: colors.text,
                    }}
                    required
                  >
                    <option value="">请选择级别</option>
                    <option value="国家级">国家级</option>
                    <option value="省级">省级</option>
                    <option value="市级">市级</option>
                    <option value="校级">校级</option>
                    <option value="院级">院级</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label
                    htmlFor="itemName"
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    奖项名称 *
                  </label>
                  <input
                    id="itemName"
                    type="text"
                    value={
                      scholarshipItems[currentItemIndex]
                        ? scholarshipItems[currentItemIndex].name
                        : ""
                    }
                    onChange={(e) => handleItemChange("name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid " + colors.border,
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                      color: colors.text,
                      boxSizing: "border-box",
                    }}
                    placeholder="例如：数学竞赛一等奖"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="itemScore"
                    style={{
                      display: "block",
                      color: colors.text,
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    分数 *
                  </label>
                  <input
                    id="itemScore"
                    type="number"
                    value={
                      scholarshipItems[currentItemIndex]
                        ? scholarshipItems[currentItemIndex].score
                        : ""
                    }
                    onChange={(e) => handleItemChange("score", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid " + colors.border,
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                      color: colors.text,
                      boxSizing: "border-box",
                    }}
                    placeholder="分数"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="itemFile"
                  style={{
                    display: "block",
                    color: colors.text,
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  证明材料
                </label>
                <input
                  id="itemFile"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0",
                    fontSize: "0.9rem",
                    color: colors.text,
                  }}
                />
                <p
                  style={{
                    color: colors.primary,
                    fontSize: "0.8rem",
                    margin: "0.25rem 0 0 0",
                  }}
                >
                  支持PDF、JPG、PNG格式，大小不超过5MB
                </p>
                {scholarshipItems[currentItemIndex].files &&
                  scholarshipItems[currentItemIndex].files!.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: colors.text,
                          marginBottom: "0.25rem",
                        }}
                      >
                        已选择的文件：
                      </p>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {scholarshipItems[currentItemIndex].files!.map(
                          (file, index) => (
                            <li
                              key={index}
                              style={{
                                fontSize: "0.8rem",
                                color: colors.text,
                                marginBottom: "0.25rem",
                              }}
                            >
                              {file.name}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>

            {scholarshipItems.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={handlePreviousItem}
                  disabled={currentItemIndex === 0}
                  style={{
                    backgroundColor:
                      currentItemIndex === 0
                        ? colors.secondary
                        : colors.primary,
                    border: "none",
                    borderRadius: "4px",
                    color: "white",
                    padding: "0.5rem 1rem",
                    cursor: currentItemIndex === 0 ? "default" : "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  上一项
                </button>
                <button
                  type="button"
                  onClick={handleNextItem}
                  disabled={currentItemIndex === scholarshipItems.length - 1}
                  style={{
                    backgroundColor:
                      currentItemIndex === scholarshipItems.length - 1
                        ? colors.secondary
                        : colors.primary,
                    border: "none",
                    borderRadius: "4px",
                    color: "white",
                    padding: "0.5rem 1rem",
                    cursor:
                      currentItemIndex === scholarshipItems.length - 1
                        ? "default"
                        : "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  下一项
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: "1rem",
                borderTop: "1px solid " + colors.border,
              }}
            >
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading
                    ? colors.secondary
                    : colors.primary,
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                  padding: "0.75rem 2rem",
                  cursor: isLoading ? "default" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? "提交中..." : editMode ? "更新申请" : "提交申请"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 登录页面
  if (!isLoggedIn) {
    return renderLoginPage();
  }

  // 主界面
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: colors.background,
      }}
    >
      {/* 侧边栏 */}
      <div
        style={{
          width: "250px",
          background: "white",
          borderRight: `1px solid ${colors.border}`,
          padding: "1rem",
        }}
      >
        <h2
          style={{
            color: colors.text,
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          奖学金评定系统
        </h2>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setCurrentPage("dashboard")}
            style={{
              width: "100%",
              padding: "0.75rem",
              textAlign: "left",
              background:
                currentPage === "dashboard"
                  ? `${colors.secondary}40`
                  : "transparent",
              color: currentPage === "dashboard" ? colors.primary : colors.text,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            仪表盘
          </button>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => {
              setCurrentPage("apply");
              setCurrentSubpage("batchSelect");
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              textAlign: "left",
              background:
                currentPage === "apply"
                  ? `${colors.secondary}40`
                  : "transparent",
              color: currentPage === "apply" ? colors.primary : colors.text,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            申报奖学金
          </button>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setCurrentPage("applications")}
            style={{
              width: "100%",
              padding: "0.75rem",
              textAlign: "left",
              background:
                currentPage === "applications"
                  ? `${colors.secondary}40`
                  : "transparent",
              color:
                currentPage === "applications" ? colors.primary : colors.text,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            我的申请
          </button>
        </div>
        <div style={{ position: "absolute", bottom: "1rem", width: "218px" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.75rem",
              textAlign: "center",
              background: "transparent",
              color: colors.error,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <h2 style={{ color: colors.text, marginBottom: "1.5rem" }}>
          {currentPage === "dashboard" && "仪表盘"}
          {currentPage === "apply" &&
            (currentSubpage === "batchSelect"
              ? "选择申请批次"
              : `申报 ${selectedBatch?.name}`)}
          {currentPage === "applications" && "我的申请"}
        </h2>

        {/* 仪表盘内容 */}
        {currentPage === "dashboard" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  color: colors.text,
                  marginBottom: "1rem",
                  fontSize: "1rem",
                }}
              >
                待申报奖学金
              </h3>
              <p
                style={{
                  color: colors.text,
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                3
              </p>
            </div>
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  color: colors.text,
                  marginBottom: "1rem",
                  fontSize: "1rem",
                }}
              >
                审核中
              </h3>
              <p
                style={{
                  color: colors.text,
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                1
              </p>
            </div>
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  color: colors.text,
                  marginBottom: "1rem",
                  fontSize: "1rem",
                }}
              >
                已获得奖学金
              </h3>
              <p
                style={{
                  color: colors.text,
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                2
              </p>
            </div>
          </div>
        )}

        {/* 渲染顶部导航 */}
        {renderTopNav()}

        {/* 渲染批次选择 */}
        {currentPage === "apply" &&
          currentSubpage === "batchSelect" &&
          renderBatchSelection()}

        {/* 渲染申请表单页面 */}
        {currentPage === "apply" &&
          currentSubpage === "applicationForm" &&
          renderApplicationFormPage()}

        {/* 渲染申请记录页面 */}
        {currentPage === "applications" && renderApplicationListPage()}
      </div>
    </div>
  );
}

export default ScholarshipApp;
