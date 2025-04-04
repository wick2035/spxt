import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

class User extends Model {
  public id!: string;
  public username!: string;
  public password!: string;
  public role!: 'admin' | 'user' | '学生' | '管理员';
  public name?: string;
  public studentId?: string;
  public department?: string;
  public email?: string;
  public status?: '正常' | '禁用';
  public grade?: string;
  public major?: string;
  public lastLogin?: Date;
  
  // 时间戳
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // 验证密码方法
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '正常'
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  major: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User; 