import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

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

export default router; 