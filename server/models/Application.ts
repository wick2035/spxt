import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Batch from './Batch';

class Application extends Model {
  public id!: string;
  public userId!: string;
  public batchId!: string;
  public status!: '待审核' | '已通过' | '已拒绝';
  public reviewComment?: string;
  public reviewedBy?: string;
  public reviewedAt?: Date;
  public scholarshipItems!: any; // JSON数据
  
  // 时间戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Application.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
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
    validate: {
      isIn: [['待审核', '已通过', '已拒绝']]
    },
    defaultValue: '待审核'
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scholarshipItems: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  sequelize,
  modelName: 'Application',
  tableName: 'applications',
  timestamps: true
});

// 定义关联
Application.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Application.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

export default Application; 