import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

console.log('测试数据库连接');
console.log('数据库配置:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || '1433',
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  dialect: 'mssql'
});

// 创建简单的Sequelize实例
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

// 测试连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接测试成功！');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  } finally {
    // 关闭连接
    await sequelize.close();
    console.log('连接已关闭');
  }
}

// 运行测试
testConnection(); 