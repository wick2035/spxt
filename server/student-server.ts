import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/api/test', (req, res) => {
  console.log('API测试请求');
  res.json({ message: 'API服务器正常运行' });
});

// 学生登录API
app.post('/api/student/login', (req, res) => {
  const { studentId, password } = req.body;
  console.log('学生登录请求:', { studentId, password: '***' });
  
  // 简化的登录验证，仅用于测试
  if (studentId && password) {
    res.json({ 
      success: true, 
      token: 'student-token-' + Date.now(),
      studentInfo: {
        id: studentId,
        name: '学生用户',
        department: '计算机科学与技术',
        grade: '2022级',
        major: '计算机科学与技术'
      }
    });
  } else {
    res.status(400).json({ success: false, message: '学号和密码不能为空' });
  }
});

// 获取可用批次
app.get('/api/student/batches', (req, res) => {
  console.log('获取学生可用批次列表');
  
  // 返回测试批次数据
  const batches = [
    {
      id: '1',
      year: '2023',
      term: '春季',
      name: '2023年春季奖学金',
      deadline: '2023-06-30',
      status: '开放中'
    },
    {
      id: '2',
      year: '2023',
      term: '秋季',
      name: '2023年秋季奖学金',
      deadline: '2023-12-30',
      status: '开放中'
    }
  ];
  
  res.json(batches);
});

// 获取学生申请记录
app.get('/api/student/applications/:studentId', (req, res) => {
  const { studentId } = req.params;
  console.log(`获取学生 ${studentId} 的申请记录`);
  
  // 返回测试申请记录
  const applications = [
    {
      id: '101',
      year: '2023',
      term: '春季',
      date: '2023-04-15',
      name: '2023年春季奖学金',
      type: '学习优秀奖学金',
      score: '92',
      status: '已通过',
      editable: false
    },
    {
      id: '102',
      year: '2023',
      term: '秋季',
      date: '2023-10-20',
      name: '2023年秋季奖学金',
      type: '科研创新奖学金',
      score: '88',
      status: '待审核',
      editable: true
    }
  ];
  
  res.json(applications);
});

// 创建学生申请
app.post('/api/student/applications', (req, res) => {
  const { studentId, batchId, scholarshipItems } = req.body;
  console.log('创建学生申请:', { studentId, batchId, scholarshipItems });
  
  // 简化处理，直接返回成功
  res.status(201).json({ 
    success: true, 
    message: '申请提交成功', 
    applicationId: 'new-app-' + Date.now() 
  });
});

// 撤回申请
app.delete('/api/student/applications/:id', (req, res) => {
  const { id } = req.params;
  const { studentId } = req.query;
  console.log(`撤回申请 ${id}, 学生: ${studentId}`);
  
  // 简化处理，直接返回成功
  res.json({ success: true, message: '申请已成功撤回' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`简化版学生服务器运行在 http://localhost:${port}`);
}); 