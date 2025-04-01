import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import User from '../models/User';
import Application from '../models/Application';
import Batch from '../models/Batch';

const router = express.Router();

// 初始化管理员账号
router.post('/init', async (req, res) => {
  try {
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'admin',
        password: 'admin123', // 暂时不加密
        role: 'admin'
      });
      console.log('管理员账号初始化成功');
      res.json({ message: '管理员账号初始化成功' });
    } else {
      res.json({ message: '管理员账号已存在' });
    }
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
    res.status(500).json({ message: '初始化管理员账号失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 打印完整的请求信息
    console.log('收到登录请求:', {
      body: {
        username,
        password: password ? '***' : undefined
      },
      headers: req.headers
    });

    // 从数据库查找管理员
    const admin = await Admin.findOne({ where: { username } });
    
    if (!admin) {
      console.log('登录失败: 用户不存在');
      return res.status(401).json({ 
        message: '用户名或密码错误',
        error: 'User not found'
      });
    }

    // 验证密码
    if (admin.password !== password) {
      console.log('登录失败: 密码错误');
      return res.status(401).json({
        message: '用户名或密码错误',
        error: 'Invalid password'
      });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('登录成功');
    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      message: '服务器错误',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取仪表盘统计数据
router.get('/dashboard/stats', async (req, res) => {
  try {
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
      where: { status: '已驳回' }
    });
    
    res.json({
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    });
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({ message: '获取仪表盘统计数据失败' });
  }
});

// 获取最近申请列表
router.get('/dashboard/recent-applications', async (req, res) => {
  try {
    const recentApplications = await Application.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        },
        {
          model: Batch,
          as: 'batch',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'createdAt', 'status', 'totalScore']
    });
    
    const formattedApplications = recentApplications.map(app => {
      const appData = app.get({ plain: true });
      return {
        id: appData.id,
        name: appData.user?.name || '未知',
        type: appData.batch?.name || '未知',
        date: new Date(appData.createdAt).toISOString().split('T')[0],
        status: appData.status
      };
    });
    
    res.json(formattedApplications);
  } catch (error) {
    console.error('获取最近申请列表失败:', error);
    res.status(500).json({ message: '获取最近申请列表失败' });
  }
});

// 用户管理 API

// 获取所有用户
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'role', 'email', 'status', 'lastLogin']
    });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 添加用户
router.post('/users', async (req, res) => {
  try {
    const { username, name, role, email, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    const newUser = await User.create({
      username,
      name,
      role,
      email,
      password,
      status: '正常'
    });
    
    res.status(201).json({
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ message: '创建用户失败' });
  }
});

// 更新用户状态
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    user.status = status;
    await user.save();
    
    res.json({
      message: '用户状态更新成功',
      user: {
        id: user.id,
        username: user.username,
        status: user.status
      }
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ message: '更新用户状态失败' });
  }
});

export default router; 