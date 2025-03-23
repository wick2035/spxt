import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin';
import sequelize from './config/database';
import path from 'path';
import Admin from './models/Admin';

// 确保从正确的路径加载 .env 文件
const envPath = path.resolve(__dirname, '../.env');
console.log('正在加载环境变量文件:', envPath);
dotenv.config({ path: envPath });

// 检查环境变量是否正确加载
console.log('环境变量检查:', {
  JWT_SECRET: process.env.JWT_SECRET ? '***' : undefined,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME
});

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/admin', adminRoutes);

// 数据库连接和同步
sequelize.authenticate()
  .then(async () => {
    console.log('数据库连接成功');
    // 同步数据库模型 - 不使用force以避免删除现有数据
    await sequelize.sync({ force: false });
    console.log('数据库模型同步完成');

    // 检查是否存在管理员账号
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      // 创建默认管理员账号
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin'
      });
      console.log('默认管理员账号创建成功');
    } else {
      console.log('管理员账号已存在');
    }
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 