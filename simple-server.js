"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var uuid_1 = require("uuid");
var app = (0, express_1.default)();
var port = 5000;
// 添加路由日志中间件，记录所有请求
app.use(function (req, res, next) {
    console.log("".concat(new Date().toISOString(), " - ").concat(req.method, " ").concat(req.url));
    next();
});
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 模拟数据
var users = [
    {
        id: 1,
        username: "admin",
        name: "系统管理员",
        role: "管理员",
        email: "admin@example.com",
        status: "正常",
        lastLogin: "2024-03-25 10:30:00"
    },
    {
        id: 2,
        username: "student1",
        name: "张三",
        role: "学生",
        email: "zhangsan@example.com",
        status: "正常",
        lastLogin: "2024-03-24 14:25:00"
    },
    {
        id: 3,
        username: "student2",
        name: "李四",
        role: "学生",
        email: "lisi@example.com",
        status: "禁用",
        lastLogin: "2024-03-23 09:15:00"
    }
];
var applications = [
    {
        id: 1,
        name: "张三",
        type: "优秀学生奖学金",
        date: "2024-03-20",
        status: "待审核"
    },
    {
        id: 2,
        name: "李四",
        type: "科技创新奖学金",
        date: "2024-03-19",
        status: "已通过"
    },
    {
        id: 3,
        name: "王五",
        type: "社会工作奖学金",
        date: "2024-03-18",
        status: "已驳回"
    }
];
// 测试API路由
app.get('/api/test', function (req, res) {
    res.status(200).json({ message: 'API服务运行正常' });
});
// 验证Token（简化版）- 对于简单测试，直接放行所有请求
var verifyToken = function (req, res, next) {
    // 为了简化测试，直接放行所有请求
    next();
};
// 仪表盘统计数据
app.get('/api/admin/dashboard/stats', verifyToken, function (req, res) {
    res.status(200).json({
        totalApplications: 156,
        pendingApplications: 23,
        approvedApplications: 89,
        rejectedApplications: 44
    });
});
// 最近申请数据
app.get('/api/admin/dashboard/recent-applications', verifyToken, function (req, res) {
    res.status(200).json(applications);
});
// 获取所有用户
app.get('/api/admin/users', verifyToken, function (req, res) {
    console.log("获取用户列表请求已接收");
    res.status(200).json(users);
});
// 获取单个用户
app.get('/api/admin/users/:id', verifyToken, function (req, res) {
    var userId = parseInt(req.params.id);
    var user = users.find(function (u) { return u.id === userId; });
    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }
    res.status(200).json(user);
});
// 创建用户
app.post('/api/admin/users', verifyToken, function (req, res) {
    var _a = req.body, username = _a.username, name = _a.name, role = _a.role, email = _a.email;
    // 验证必填字段
    if (!username || !name || !role || !email) {
        return res.status(400).json({ message: '所有字段都是必填的' });
    }
    // 检查用户名是否存在
    if (users.some(function (u) { return u.username === username; })) {
        return res.status(400).json({ message: '用户名已存在' });
    }
    // 创建新用户
    var newUser = {
        id: users.length + 1,
        username: username,
        name: name,
        role: role,
        email: email,
        status: "正常",
        // lastLogin可选，可以不设置
    };
    users.push(newUser);
    res.status(201).json(newUser);
});
// 更新用户状态
app.patch('/api/admin/users/:id/status', verifyToken, function (req, res) {
    var userId = parseInt(req.params.id);
    var status = req.body.status;
    if (!status || !['正常', '禁用'].includes(status)) {
        return res.status(400).json({ message: '状态值无效' });
    }
    var userIndex = users.findIndex(function (u) { return u.id === userId; });
    if (userIndex === -1) {
        return res.status(404).json({ message: '用户不存在' });
    }
    // 更新用户状态
    users[userIndex].status = status;
    res.status(200).json({
        message: '用户状态已更新',
        user: users[userIndex]
    });
});
// 重置用户密码
app.post('/api/admin/users/:id/reset-password', verifyToken, function (req, res) {
    var userId = parseInt(req.params.id);
    var newPassword = req.body.newPassword;
    if (!newPassword) {
        return res.status(400).json({ message: '新密码不能为空' });
    }
    var userIndex = users.findIndex(function (u) { return u.id === userId; });
    if (userIndex === -1) {
        return res.status(404).json({ message: '用户不存在' });
    }
    // 实际应用中这里需要加密密码
    res.status(200).json({ message: '密码已重置' });
});
// 删除用户
app.delete('/api/admin/users/:id', verifyToken, function (req, res) {
    var userId = parseInt(req.params.id);
    var userIndex = users.findIndex(function (u) { return u.id === userId; });
    if (userIndex === -1) {
        return res.status(404).json({ message: '用户不存在' });
    }
    // 删除用户
    users = users.filter(function (u) { return u.id !== userId; });
    res.status(200).json({ message: '用户已删除' });
});
// 删除申请
app.delete('/api/admin/applications/:id', verifyToken, function (req, res) {
    var applicationId = parseInt(req.params.id);
    var appIndex = applications.findIndex(function (a) { return a.id === applicationId; });
    if (appIndex === -1) {
        return res.status(404).json({ message: '申请不存在' });
    }
    // 删除申请
    applications = applications.filter(function (a) { return a.id !== applicationId; });
    res.status(200).json({ message: '申请已删除' });
});
// 管理员登录
app.post('/api/admin/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    // 简单演示，固定账号密码
    if (username === 'admin' && password === 'admin123') {
        res.status(200).json({
            message: '登录成功',
            user: {
                id: 1,
                username: 'admin',
                name: '系统管理员',
                role: '管理员',
            },
            token: 'mock_token_' + (0, uuid_1.v4)(),
        });
    }
    else {
        res.status(401).json({ message: '用户名或密码错误' });
    }
});
// 学生登录API（保持与前端的兼容性）
app.post('/api/student/login', function (req, res) {
    var _a = req.body, studentId = _a.studentId, password = _a.password;
    if (studentId === '2022001' && password === '123456') {
        res.status(200).json({
            success: true,
            message: '登录成功',
            studentInfo: {
                id: studentId,
                name: '测试学生',
                department: '计算机科学与技术学院',
                grade: '2022级',
                major: '计算机科学与技术',
            },
            token: 'mock_token_' + (0, uuid_1.v4)(),
        });
    }
    else {
        res.status(401).json({ success: false, message: '学号或密码错误' });
    }
});
// 启动服务器
app.listen(port, function () {
    console.log("\u670D\u52A1\u5668\u8FD0\u884C\u5728 http://localhost:".concat(port));
    console.log("API\u6D4B\u8BD5\u8DEF\u5F84: http://localhost:".concat(port, "/api/test"));
    console.log("\u7BA1\u7406\u5458\u7528\u6237\u5217\u8868\u8DEF\u5F84: http://localhost:".concat(port, "/api/admin/users"));
    console.log("\u7EDF\u8BA1\u6570\u636E\u8DEF\u5F84: http://localhost:".concat(port, "/api/admin/dashboard/stats"));
    console.log("\u7BA1\u7406\u5458\u767B\u5F55\u8DEF\u5F84: http://localhost:".concat(port, "/api/admin/login"));
});
