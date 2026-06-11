import sequelize from '../config/database.js';
import User from './User.js';
import Password from './Password.js';
import Todo from './Todo.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Album from './Album.js';
import Photo from './Photo.js';

// User <-> Password (One-to-One)
User.hasOne(Password, { foreignKey: 'userId', onDelete: 'CASCADE' });
Password.belongsTo(User, { foreignKey: 'userId' });

// User <-> Todo (One-to-Many)
User.hasMany(Todo, { foreignKey: 'userId', onDelete: 'CASCADE' });
Todo.belongsTo(User, { foreignKey: 'userId' });

// User <-> Post (One-to-Many)
User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Post <-> Comment (One-to-Many)
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// User <-> Album (One-to-Many)
User.hasMany(Album, { foreignKey: 'userId', onDelete: 'CASCADE' });
Album.belongsTo(User, { foreignKey: 'userId' });

// Album <-> Photo (One-to-Many)
Album.hasMany(Photo, { foreignKey: 'albumId', onDelete: 'CASCADE' });
Photo.belongsTo(Album, { foreignKey: 'albumId' });

export {
  sequelize,
  User,
  Password,
  Todo,
  Post,
  Comment,
  Album,
  Photo,
};
