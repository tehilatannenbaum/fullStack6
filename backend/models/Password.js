import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Password = sequelize.define('Password', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  // Passwords table should not be easily queried or printed in response.
  // We specifytableName explicitly
  tableName: 'Passwords',
});

export default Password;
