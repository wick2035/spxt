import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 尝试从多个位置加载.env文件
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log(`从 ${envPath} 加载环境变量`);
  dotenv.config({ path: envPath });
} else {
  console.log('未找到.env文件，使用默认路径');
  dotenv.config();
}

// 打印数据库配置信息（隐藏密码）
console.log('数据库配置:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || '1433',
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  dialect: 'mssql'
});

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1433'),
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 60000  // 增加超时时间到60秒
      }
    },
    logging: (msg) => console.log(`SQL: ${msg}`),
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,  // 增加获取连接的超时时间
      idle: 10000
    },
    retry: {
      max: 3  // 失败时最多重试3次
    }
  }
);

// 测试连接
sequelize
  .authenticate()
  .then(() => {
    console.log('数据库连接测试成功');
  })
  .catch(err => {
    console.error('数据库连接测试失败:', err);
  });

export default sequelize; 