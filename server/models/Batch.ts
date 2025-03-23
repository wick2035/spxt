import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Batch extends Model {
  public id!: string;
  public name!: string;
  public type!: string;
  public startDate!: string;
  public endDate!: string;
  public status!: '未开始' | '进行中' | '已结束';
  public description?: string;
  
  // 时间戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    validate: {
      isIn: [['未开始', '进行中', '已结束']]
    },
    defaultValue: '未开始'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Batch',
  tableName: 'batches',
  timestamps: true
});

export default Batch; 