import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface AdminAttributes {
  id?: number;
  username: string;
  password: string;
  role: string;
}

class Admin extends Model<AdminAttributes> implements AdminAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: string;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'admin',
    },
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins',
  }
);

export default Admin; 