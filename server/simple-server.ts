import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'scholarship_system',
  process.env.DB_USER || 'admin888',
  process.env.DB_PASSWORD || '20041118Rr@',
  {
    host: process.env.DB_HOST || 'rm-cn-20s46glw9001i7qo.sqlserver.rds.aliyuncs.com',
    port: parseInt(process.env.DB_PORT || '1433'),
    dialect: 'mssql',
    dialectOptions: {
      options: {
        trustServerCertificate: true
      }
    },
    logging: (msg) => console.log(`SQL: ${msg}`)
  }
);

// 定义一个简单的批次模型
class Batch extends Model {
  public id!: string;
  public name!: string;
  public type!: string;
  public startDate!: string;
  public endDate!: string;
  public status!: string;
}

Batch.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '未开始'
  }
}, {
  sequelize,
  modelName: 'Batch',
  tableName: 'batches',
  timestamps: true
});

// 定义简单的申请模型
class Application extends Model {
  public id!: string;
  public userId!: string;
  public batchId!: string;
  public status!: string;
  public reviewComment?: string;
  public reviewedBy?: string;
  public reviewedAt?: string;
  public scholarshipItems?: any[];
  public filePaths?: string[];
  public createdAt!: Date;
}

Application.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    batchId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Batch,
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '待审核',
    },
    reviewComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scholarshipItems: {
      type: DataTypes.TEXT, // 使用TEXT类型存储JSON数据
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('scholarshipItems');
        if (!rawValue) return [];
        
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          console.error('解析scholarshipItems失败:', e);
          return rawValue;
        }
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue('scholarshipItems', null);
        } else if (typeof value === 'string') {
          this.setDataValue('scholarshipItems', value);
        } else {
          this.setDataValue('scholarshipItems', JSON.stringify(value));
        }
      }
    },
    filePaths: {
      type: DataTypes.TEXT, // 使用TEXT类型存储JSON数据
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('filePaths');
        if (!rawValue) return [];
        
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          console.error('解析filePaths失败:', e);
          return rawValue;
        }
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue('filePaths', null);
        } else if (typeof value === 'string') {
          this.setDataValue('filePaths', value);
        } else {
          this.setDataValue('filePaths', JSON.stringify(value));
        }
      }
    },
  },
  {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
  }
);

// 批次和申请的关联关系
Batch.hasMany(Application, { foreignKey: 'batchId' });
Application.belongsTo(Batch, { foreignKey: 'batchId' });

// 更新批次状态的函数
async function updateBatchStatuses() {
  try {
    const currentDate = new Date();
    console.log("正在更新批次状态，当前日期:", currentDate.toISOString().split('T')[0]);
    
    const batches = await Batch.findAll();
    let statusChanged = false;
    
    for (const batch of batches) {
      const startDate = new Date(batch.startDate);
      const endDate = new Date(batch.endDate);
      let newStatus = batch.status;
      
      // 将日期设置为当天的零点，只比较日期部分
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // 如果当前日期在开始日期之前，状态应为"未开始"
      if (currentDate < startDate) {
        newStatus = '未开始';
      }
      // 如果当前日期在开始日期之后且在结束日期之前或等于结束日期，状态应为"进行中"
      else if (currentDate >= startDate && currentDate <= endDate) {
        newStatus = '进行中';
      }
      // 如果当前日期在结束日期之后，状态应为"已结束"
      else if (currentDate > endDate) {
        newStatus = '已结束';
      }
      
      // 如果状态发生变化，更新数据库
      if (newStatus !== batch.status) {
        console.log(`更新批次 ${batch.id} 的状态从 ${batch.status} 到 ${newStatus}`);
        await batch.update({ status: newStatus });
        statusChanged = true;
      }
    }
    
    console.log("批次状态更新完成");
    return statusChanged;
  } catch (error) {
    console.error("更新批次状态时出错:", error);
    throw error;
  }
}

// 获取所有批次并自动更新状态
app.get('/api/batches', async (req, res) => {
  try {
    console.log('获取批次列表请求');
    
    // 先更新批次状态
    await updateBatchStatuses();
    
    const batches = await Batch.findAll({
      order: [['createdAt', 'DESC']]
    });
    console.log('批次数据:', batches.length);
    res.json(batches);
  } catch (error) {
    console.error('获取批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新批次
app.post('/api/batches', async (req, res) => {
  try {
    console.log('创建批次请求:', req.body);
    const batch = await Batch.create(req.body);
    console.log('创建的批次:', batch);
    res.status(201).json(batch);
  } catch (error) {
    console.error('创建批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新批次信息
app.put('/api/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, startDate, endDate } = req.body;
    
    const batch = await Batch.findByPk(id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: '找不到指定批次' });
    }
    
    // 更新批次信息
    await batch.update({
      name: name || batch.name,
      type: type || batch.type,
      startDate: startDate || batch.startDate,
      endDate: endDate || batch.endDate
    });
    
    // 日期变更后立即更新状态
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const batchStartDate = new Date(batch.startDate);
    const batchEndDate = new Date(batch.endDate);
    batchStartDate.setHours(0, 0, 0, 0);
    batchEndDate.setHours(0, 0, 0, 0);
    
    let newStatus = batch.status;
    
    // 根据当前日期和批次的开始/结束日期确定状态
    if (currentDate < batchStartDate) {
      newStatus = '未开始';
    } else if (currentDate >= batchStartDate && currentDate <= batchEndDate) {
      newStatus = '进行中';
    } else if (currentDate > batchEndDate) {
      newStatus = '已结束';
    }
    
    // 如果状态需要更新，则更新批次状态
    if (newStatus !== batch.status) {
      console.log(`更新批次 ${batch.id} 状态为 ${newStatus}`);
      await batch.update({ status: newStatus });
    }
    
    res.json({ success: true, batch });
  } catch (error) {
    console.error('更新批次出错:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除批次
app.delete('/api/batches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`删除批次 ${id} 请求`);
    
    const batch = await Batch.findByPk(id);
    if (!batch) {
      return res.status(404).json({ message: '找不到批次' });
    }
    
    // 检查是否有关联的申请
    const applicationCount = await Application.count({ where: { batchId: id } });
    if (applicationCount > 0) {
      return res.status(400).json({ message: '该批次有关联的申请，无法删除' });
    }
    
    await batch.destroy();
    console.log('批次删除成功');
    res.json({ message: '批次删除成功' });
  } catch (error) {
    console.error('删除批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新批次状态
app.patch('/api/batches/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`更新批次 ${id} 状态为 ${status}`);
    
    const batch = await Batch.findByPk(id);
    if (!batch) {
      return res.status(404).json({ message: '找不到批次' });
    }
    
    await batch.update({ status });
    console.log('状态更新成功:', batch);
    res.json(batch);
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 申请管理API端点

// 获取所有申请（管理员用）
app.get('/api/applications/admin', async (req, res) => {
  try {
    console.log('获取管理员申请列表请求', req.query);
    
    // 构建查询条件
    const where: any = {};
    
    if (req.query.status && req.query.status !== 'all') {
      where.status = req.query.status;
    }
    
    if (req.query.batchId && req.query.batchId !== 'all') {
      where.batchId = req.query.batchId;
    }
    
    const applications = await Application.findAll({
      where,
      include: [{ model: Batch }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('申请数据:', applications.length);
    res.json(applications);
  } catch (error) {
    console.error('获取申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 审核申请
app.patch('/api/applications/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComment } = req.body;
    console.log(`审核申请 ${id}:`, req.body);
    
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: '找不到申请' });
    }
    
    await application.update({
      status,
      reviewComment,
      reviewedBy: 'admin', // 简化版，直接使用admin
      reviewedAt: new Date()
    });
    
    console.log('申请审核完成:', application);
    res.json(application);
  } catch (error) {
    console.error('审核申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个申请详情
app.get('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`获取申请 ${id} 详情`);
    
    const application = await Application.findByPk(id, {
      include: [{ model: Batch }]
    });
    
    if (!application) {
      return res.status(404).json({ message: '找不到申请' });
    }
    
    console.log('申请详情:', application);
    res.json(application);
  } catch (error) {
    console.error('获取申请详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: 'API服务器正常运行' });
});

// 创建测试申请数据
app.post('/api/test/create-application', async (req, res) => {
  try {
    console.log('创建测试申请数据');
    
    // 首先获取一个可用的批次
    const availableBatch = await Batch.findOne({
      where: {
        status: {
          [Op.ne]: '已结束'  // 不是已结束状态的批次
        }
      }
    });
    
    if (!availableBatch) {
      return res.status(400).json({ message: '没有可用的批次，请先创建批次' });
    }
    
    // 创建测试申请数据
    const scholarshipItems = [
      { name: '学习奖学金', amount: 2000 },
      { name: '科研奖学金', amount: 1500 }
    ];
    
    const testApplication = await Application.create({
      userId: 'test-user-' + Date.now(),
      batchId: availableBatch.id,
      status: '待审核',
      scholarshipItems: scholarshipItems,
    });
    
    console.log('创建的测试申请:', testApplication);
    res.status(201).json({ 
      message: '测试申请创建成功', 
      application: testApplication,
      batch: availableBatch
    });
  } catch (error) {
    console.error('创建测试申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 学生API端点

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
app.get('/api/student/batches', async (req, res) => {
  try {
    console.log('获取学生可用批次列表');
    
    // 更新批次状态
    await updateBatchStatuses();
    
    // 获取所有进行中的批次
    const batches = await Batch.findAll({
      where: { status: '进行中' },
      order: [['createdAt', 'DESC']]
    });
    
    // 转换为前端需要的格式
    const formattedBatches = batches.map(batch => ({
      id: batch.id,
      year: new Date(batch.startDate).getFullYear().toString(),
      term: new Date(batch.startDate).getMonth() < 6 ? '春季' : '秋季',
      name: batch.name,
      deadline: batch.endDate,
      status: '开放中'
    }));
    
    console.log('学生可用批次:', formattedBatches.length);
    res.json(formattedBatches);
  } catch (error) {
    console.error('获取学生批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学生申请记录
app.get('/api/student/applications/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`获取学生 ${studentId} 的申请记录`);
    
    const applications = await Application.findAll({
      where: { userId: studentId },
      include: [{ model: Batch }],
      order: [['createdAt', 'DESC']]
    });
    
    // 转换为前端需要的格式
    const formattedApplications = applications.map(app => {
      const batch = app.get('Batch') as any;
      const rawItems = app.get('scholarshipItems');
      
      console.log("原始数据类型:", typeof rawItems);
      console.log("原始数据:", rawItems);
      
      // 解析scholarshipItems
      let items: Array<{type?: string, level?: string, name?: string, score?: string | number}> = [];
      try {
        if (typeof rawItems === 'string') {
          items = JSON.parse(rawItems);
        } else if (Array.isArray(rawItems)) {
          items = rawItems;
        }
      } catch (error) {
        console.error("解析scholarshipItems失败:", error);
        items = [];
      }
      
      console.log("解析后的项目:", items);
      
      // 计算总分
      let totalScore = 0;
      
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === 'object' && 'score' in item) {
            const itemScore = parseInt(String(item.score || '0'), 10) || 0;
            totalScore += itemScore;
            console.log(`项目: ${item.name || '未命名'}, 分数: ${itemScore}, 当前总分: ${totalScore}`);
          }
        }
      }
      
      console.log(`申请ID ${app.id} 的最终总分: ${totalScore}`);
      
      return {
        id: app.id,
        batchId: app.batchId,
        year: batch ? new Date(batch.startDate).getFullYear().toString() : '未知',
        term: batch ? (new Date(batch.startDate).getMonth() < 6 ? '春季' : '秋季') : '未知',
        date: new Date(app.createdAt).toISOString().split('T')[0],
        name: batch ? batch.name : '未知批次',
        type: batch ? batch.type : '未知类型',
        score: totalScore.toString(), // 使用计算得到的总分
        status: app.status,
        editable: app.status === '待审核', // 只有待审核状态才可编辑
        scholarshipItems: items // 返回解析后的项目数据供编辑使用
      };
    });
    
    console.log('学生申请记录:', formattedApplications.length);
    res.json(formattedApplications);
  } catch (error) {
    console.error('获取学生申请记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const studentId = req.body.studentId;
    const uploadDir = path.join(__dirname, '../uploads', studentId);
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

// 添加静态文件服务，使用绝对路径
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('静态文件目录配置在:', uploadsPath);

// 创建学生申请
app.post('/api/student/applications', upload.array('files'), async (req, res) => {
  try {
    const { studentId, batchId, scholarshipItems, totalScore } = req.body;
    const scholarshipItemsData = JSON.parse(scholarshipItems);

    // 验证批次
    const batch = await Batch.findByPk(batchId);

    if (!batch) {
      return res.status(404).json({ message: "未找到指定的奖学金批次" });
    }

    // 处理上传的文件
    const filePaths = req.files ? (req.files as Express.Multer.File[]).map(file => {
      // 使用相对于uploads目录的路径
      const relativePath = path.relative(uploadsPath, file.path).replace(/\\/g, '/');
      return `/uploads/${relativePath}`;
    }) : [];

    // 创建申请记录
    const application = await Application.create({
      userId: studentId,
      batchId: batchId,
      status: "待审核",
      scholarshipItems: scholarshipItemsData,
      totalScore: parseFloat(totalScore),
      filePaths: filePaths,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("创建申请失败:", error);
    res.status(500).json({ message: "创建申请失败" });
  }
});

// 撤回申请
app.delete('/api/student/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.query;
    console.log(`撤回申请 ${id}, 学生: ${studentId}`);
    
    const application = await Application.findOne({
      where: { id, userId: studentId }
    });
    
    if (!application) {
      return res.status(404).json({ message: '找不到申请或无权操作' });
    }
    
    if (application.status !== '待审核') {
      return res.status(400).json({ message: '只有待审核的申请可以撤回' });
    }
    
    await application.destroy();
    console.log('申请已撤回');
    res.json({ success: true, message: '申请已成功撤回' });
  } catch (error) {
    console.error('撤回申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新学生申请
app.put('/api/student/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, scholarshipItems } = req.body;
    console.log(`更新申请 ${id}, 学生: ${studentId}`, scholarshipItems);
    
    // 查找申请记录
    const application = await Application.findOne({
      where: { id, userId: studentId }
    });
    
    if (!application) {
      return res.status(404).json({ message: '找不到申请或无权操作' });
    }
    
    // 只有待审核状态的申请才能修改
    if (application.status !== '待审核') {
      return res.status(400).json({ message: '只有待审核的申请可以修改' });
    }
    
    // 更新申请数据
    await application.update({
      scholarshipItems: scholarshipItems || []
    });
    
    console.log('申请更新成功:', application.id);
    res.json({ 
      success: true, 
      message: '申请已成功更新',
      applicationId: application.id 
    });
  } catch (error) {
    console.error('更新申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员删除申请
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`管理员删除申请 ${id}`);
    
    // 查找申请
    const application = await Application.findOne({
      where: { id }
    });
    
    if (!application) {
      console.log(`找不到ID为 ${id} 的申请`);
      return res.status(404).json({ message: '找不到申请' });
    }
    
    // 先获取申请信息用于记录
    const appInfo = {
      id: application.id,
      userId: application.userId,
      batchId: application.batchId
    };
    
    // 执行删除操作
    await application.destroy();
    console.log('成功删除申请:', appInfo);
    
    // 设置内容类型并返回成功响应
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      success: true, 
      message: '申请已成功删除',
      deletedApplication: appInfo
    });
  } catch (error) {
    console.error('删除申请错误:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      message: '服务器错误，请稍后再试',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 连接数据库并启动服务器
async function startServer() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型（如果表不存在则创建）
    await sequelize.sync();
    console.log('数据库同步完成');
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`简化版服务器运行在 http://localhost:${port}`);
      
      // 初始化时更新一次批次状态
      updateBatchStatuses();
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

startServer(); 