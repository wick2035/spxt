import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 获取学生学号 (从请求参数或请求体获取)
    const studentId = req.params.studentId || req.body.studentId;
    if (!studentId) {
      return cb(new Error('Missing student ID'), '');
    }
    
    // 创建以学号命名的文件夹
    const studentDir = path.join(uploadDir, studentId);
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }
    
    cb(null, studentDir);
  },
  filename: function (req, file, cb) {
    // 生成文件名：原始文件名-时间戳.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 配置文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // 只允许上传PDF和图片文件
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  console.log(`检查文件类型: ${file.mimetype}, 文件名: ${file.originalname}`);
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('文件类型有效');
    cb(null, true);
  } else {
    console.log(`文件类型 ${file.mimetype} 不允许`);
    cb(null, false);
    // 由于类型限制，我们不能直接传递Error对象
  }
};

// 初始化上传中间件
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 添加错误处理中间件
app.use((err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    console.error('Multer错误:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制(5MB)' });
    }
    return res.status(400).json({ message: `文件上传错误: ${err.message}` });
  } else if (err) {
    // 其他错误
    console.error('文件上传时发生错误:', err);
    return res.status(500).json({ message: `服务器错误: ${err.message}` });
  }
  next();
});

// 创建静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
      type: DataTypes.TEXT,
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
  },
  {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
  }
);

// 批次和申请的关联关系
Batch.hasMany(Application, { foreignKey: 'batchId', as: 'applications' });
Application.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

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
      include: [{ model: Batch, as: 'batch' }],
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
      include: [{ model: Batch, as: 'batch' }]
    });
    
    if (!application) {
      return res.status(404).json({ message: '找不到申请' });
    }
    
    // 获取奖学金项目列表
    const items = application.get('scholarshipItems');
    let scholarshipItems: ScholarshipItem[] = [];
    
    try {
      if (typeof items === 'string') {
        scholarshipItems = JSON.parse(items);
      } else if (Array.isArray(items)) {
        scholarshipItems = items;
      }
    } catch (error) {
      console.error('解析scholarshipItems失败:', error);
      scholarshipItems = [];
    }
    
    // 构建响应数据
    const responseData = {
      id: application.id,
      userId: application.userId,
      batchId: application.batchId,
      status: application.status,
      reviewComment: application.reviewComment,
      reviewedBy: application.reviewedBy,
      reviewedAt: application.reviewedAt,
      createdAt: application.createdAt,
      batch: application.get('batch'),
      scholarshipItems: scholarshipItems.map((item: ScholarshipItem, index: number) => ({
        ...item,
        index, // 添加索引信息
        fileUrl: item.fileUrl || null,
        fileName: item.fileName || null,
        fileSize: item.fileSize || null,
        fileType: item.fileType || null
      }))
    };
    
    console.log('申请详情:', responseData);
    res.json(responseData);
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
      include: [{ model: Batch, as: 'batch' }],
      order: [['createdAt', 'DESC']]
    });
    
    // 转换为前端需要的格式
    const formattedApplications = applications.map(app => {
      const batch = app.get('batch') as any;
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

// 创建学生申请
app.post('/api/student/applications', async (req, res) => {
  try {
    const { studentId, batchId, scholarshipItems } = req.body;
    console.log('创建学生申请:', { studentId, batchId, scholarshipItems });
    
    // 验证批次是否存在且进行中
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({ message: '找不到批次' });
    }
    
    if (batch.status !== '进行中') {
      return res.status(400).json({ message: '该批次已经结束或未开始，无法申请' });
    }
    
    // 创建申请
    const application = await Application.create({
      userId: studentId,
      batchId: batchId,
      status: '待审核',
      scholarshipItems: scholarshipItems || []
    });
    
    console.log('申请创建成功:', application);
    res.status(201).json({ 
      success: true, 
      message: '申请提交成功', 
      applicationId: application.id 
    });
  } catch (error) {
    console.error('创建学生申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 定义奖学金项目类型
interface ScholarshipItem {
  type?: string;
  level?: string;
  name?: string;
  score?: string | number;
  amount?: number;
  [key: string]: any; // 允许其他可能的属性
}

// 上传证明材料
app.post('/api/student/applications/:applicationId/upload/:studentId', upload.single('file'), async (req, res) => {
  try {
    const { applicationId, studentId } = req.params;
    const { itemIndex } = req.body; // 新增：接收项目索引
    
    // 检查申请是否存在
    const application = await Application.findOne({
      where: { id: applicationId, userId: studentId }
    });
    
    if (!application) {
      return res.status(404).json({ message: '找不到申请或无权操作' });
    }
    
    // 只有待审核状态的申请才能上传材料
    if (application.status !== '待审核') {
      return res.status(400).json({ message: '只有待审核的申请可以上传证明材料' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '未收到文件或文件上传失败' });
    }
    
    // 获取当前的奖学金项目列表
    const items = application.get('scholarshipItems');
    let scholarshipItems: ScholarshipItem[] = [];
    
    try {
      if (typeof items === 'string') {
        scholarshipItems = JSON.parse(items);
      } else if (Array.isArray(items)) {
        scholarshipItems = items;
      }
    } catch (error) {
      console.error('解析scholarshipItems失败:', error);
      scholarshipItems = [];
    }
    
    // 确保itemIndex是有效的
    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0 || index >= scholarshipItems.length) {
      return res.status(400).json({ message: '无效的项目索引' });
    }
    
    // 更新对应项目的文件信息
    scholarshipItems[index] = {
      ...scholarshipItems[index],
      fileUrl: `/uploads/${studentId}/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    };
    
    // 更新申请记录
    await application.update({
      scholarshipItems: scholarshipItems
    });
    
    // 返回文件信息
    const fileInfo = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path.replace(/\\/g, '/'),
      destination: req.file.destination.replace(/\\/g, '/'),
      url: `/uploads/${studentId}/${req.file.filename}`
    };
    
    console.log('文件上传成功:', fileInfo);
    res.status(200).json({ 
      success: true, 
      message: '证明材料上传成功',
      fileInfo,
      scholarshipItems
    });
  } catch (error) {
    console.error('上传证明材料错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学生证明材料列表
app.get('/api/student/documents/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const studentDir = path.join(uploadDir, studentId);
    
    if (!fs.existsSync(studentDir)) {
      return res.status(200).json({ files: [] });
    }
    
    const files = fs.readdirSync(studentDir).map(filename => {
      const stats = fs.statSync(path.join(studentDir, filename));
      return {
        filename,
        originalname: filename.split('-').slice(1).join('-'), // 尝试还原原始文件名
        size: stats.size,
        uploadedAt: stats.mtime,
        url: `/uploads/${studentId}/${filename}`
      };
    });
    
    res.status(200).json({ files });
  } catch (error) {
    console.error('获取证明材料列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
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

// 仪表盘统计数据
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    console.log('获取仪表盘统计数据请求');
    
    // 获取总申请数
    const totalApplications = await Application.count();
    
    // 获取待审核申请数
    const pendingApplications = await Application.count({
      where: { status: '待审核' }
    });
    
    // 获取已通过申请数
    const approvedApplications = await Application.count({
      where: { status: '已通过' }
    });
    
    // 获取已驳回申请数
    const rejectedApplications = await Application.count({
      where: { status: '已拒绝' }
    });
    
    console.log('统计数据:', {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    });
    
    res.json({
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    });
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 最近申请数据
app.get('/api/admin/dashboard/recent-applications', async (req, res) => {
  try {
    console.log('获取最近申请数据请求');
    
    const applications = await Application.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: Batch,
        as: 'batch'
      }]
    });
    
    // 格式化数据以匹配前端期望的格式
    const formattedApplications = applications.map((app) => {
      // 获取用户信息（此处简化处理，实际应从用户表获取）
      const userName = '' + app.userId.substring(0, 11);
      
      // 获取批次信息
      const batchData = (app as any).batch;
      
      return {
        id: app.id,
        name: userName,
        type: batchData ? batchData.name : '未知奖学金',
        date: new Date(app.createdAt).toISOString().split('T')[0],
        status: app.status
      };
    });
    
    console.log('最近申请数据:', formattedApplications);
    res.json(formattedApplications);
  } catch (error) {
    console.error('获取最近申请数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 学生端仪表盘统计数据
app.get('/api/student/dashboard/stats/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`获取学生${studentId}的仪表盘统计数据请求`);
    
    // 获取该学生的所有申请
    const applications = await Application.findAll({
      where: { userId: studentId },
      include: [{ model: Batch, as: 'batch' }]
    });
    
    // 统计数据
    const totalBatches = await Batch.count({
      where: { status: '进行中' }
    });
    
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === '待审核').length;
    const approvedApplications = applications.filter(app => app.status === '已通过').length;
    const rejectedApplications = applications.filter(app => app.status === '已拒绝' || app.status === '已驳回').length;
    
    console.log('学生仪表盘统计数据:', {
      totalBatches,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    });
    
    res.json({
      totalBatches,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    });
  } catch (error) {
    console.error('获取学生仪表盘统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 模拟用户数据
const users = [
  {
    id: 1,
    username: "admin",
    name: "系统管理员",
    role: "管理员",
    email: "admin@example.com",
    status: "正常",
    lastLogin: "2024-03-25 10:30:00",
    password: "admin123"
  },
  {
    id: 2,
    username: "student1",
    name: "张三",
    role: "学生",
    email: "zhangsan@example.com",
    status: "正常",
    lastLogin: "2024-03-24 14:25:00",
    password: "123456"
  },
  {
    id: 3,
    username: "student2",
    name: "李四",
    role: "学生",
    email: "lisi@example.com",
    status: "禁用",
    lastLogin: "2024-03-23 09:15:00",
    password: "123456"
  }
];

// 获取所有用户
app.get('/api/admin/users', (req, res) => {
  console.log("获取用户列表请求已接收");
  res.status(200).json(users);
});

// 获取单个用户
app.get('/api/admin/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  res.status(200).json(user);
});

// 创建用户
app.post('/api/admin/users', (req, res) => {
  const { username, name, role, email } = req.body;
  console.log('创建用户请求:', req.body);
  
  // 验证必填字段
  if (!username || !name || !role || !email) {
    return res.status(400).json({ message: '所有字段都是必填的' });
  }
  
  // 检查用户名是否存在
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: '用户名已存在' });
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username,
    name,
    role,
    email,
    status: "正常",
    lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
    password: "123456"
  };
  
  users.push(newUser);
  console.log('新用户已创建:', newUser);
  res.status(201).json(newUser);
});

// 更新用户状态
app.patch('/api/admin/users/:id/status', (req, res) => {
  const userId = parseInt(req.params.id);
  const { status } = req.body;
  console.log(`更新用户${userId}状态为${status}的请求`);
  
  if (!status || !['正常', '禁用'].includes(status)) {
    return res.status(400).json({ message: '状态值无效' });
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 更新用户状态
  users[userIndex].status = status;
  console.log('用户状态已更新:', users[userIndex]);
  
  res.status(200).json({
    message: '用户状态已更新',
    user: users[userIndex]
  });
});

// 重置用户密码
app.patch('/api/admin/users/:id/reset-password', (req, res) => {
  const userId = parseInt(req.params.id);
  console.log(`重置用户${userId}密码的请求`);
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 重置密码为默认值123456
  users[userIndex].password = '123456';
  console.log('用户密码已重置:', users[userIndex]);
  
  res.status(200).json({
    message: '用户密码已重置为默认密码：123456',
    user: users[userIndex]
  });
});

// 删除用户
app.delete('/api/admin/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  console.log(`删除用户${userId}的请求`);
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  // 从数组中删除用户
  const deletedUser = users.splice(userIndex, 1)[0];
  console.log('用户已删除:', deletedUser);
  
  res.status(200).json({
    message: '用户已删除',
    user: deletedUser
  });
});

// 删除申请
app.delete('/api/admin/applications/:id', async (req, res) => {
  const applicationId = req.params.id;
  console.log(`删除申请${applicationId}的请求`);
  
  try {
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: '申请不存在' });
    }
    
    await application.destroy();
    console.log('申请已删除');
    
    res.status(200).json({ message: '申请已删除' });
  } catch (error) {
    console.error('删除申请失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 测试API路由
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API服务运行正常' });
});

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  console.log('管理员登录请求:', { username });
  
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
      token: 'mock_token_' + Math.random().toString(36).substring(2, 15),
    });
  } else {
    res.status(401).json({ message: '用户名或密码错误' });
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