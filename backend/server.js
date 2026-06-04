import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { sequelize, User, Password, Todo, Post, Comment } from './models/index.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import todoRoutes from './routes/todos.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/todos', todoRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

// Helper function to seed database if empty
const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding database with initial JSONPlaceholder mock data...');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('123456', salt);

    // Create default Users
    const u1 = await User.create({
      id: 1,
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'Sincere@april.biz',
      phone: '1-770-736-8031 x56442',
      website: 'hildegard.org'
    });
    await Password.create({ userId: u1.id, passwordHash: defaultPasswordHash });

    const u2 = await User.create({
      id: 2,
      name: 'Ervin Howell',
      username: 'Antonette',
      email: 'Shanna@melissa.tv',
      phone: '010-692-6593 x09125',
      website: 'anastasia.net'
    });
    await Password.create({ userId: u2.id, passwordHash: defaultPasswordHash });

    // Create default Todos
    await Todo.bulkCreate([
      { userId: 1, title: 'delectus aut autem', completed: false },
      { userId: 1, title: 'quis ut nam facilis et officia qui', completed: false },
      { userId: 1, title: 'fugiat veniam minus', completed: true },
      { userId: 2, title: 'et porro tempora', completed: true },
      { userId: 2, title: 'laboriosam mollitia et enim quasi adipisci quia provident illum', completed: false }
    ]);

    // Create default Posts
    const p1 = await Post.create({
      id: 1,
      userId: 1,
      title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto'
    });

    const p2 = await Post.create({
      id: 2,
      userId: 1,
      title: 'qui est esse',
      body: 'est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla'
    });

    const p3 = await Post.create({
      id: 3,
      userId: 2,
      title: 'ea molestias quasi exercitationem repellat qui ipsa sit aut',
      body: 'et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut'
    });

    // Create default Comments
    await Comment.bulkCreate([
      { postId: 1, name: 'id labore ex et quam laborum', email: 'Eliseo@gardner.biz', body: 'laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium' },
      { postId: 1, name: 'quo vero reiciendis velit similique earum', email: 'Jayne_Kuhic@sydney.com', body: 'est natus enim nihil est dolore omnis voluptatem numquam\net omnis occaecati quod ullam at\nvoluptatem error expedita quis\nvitam reiciendis' },
      { postId: 2, name: 'odio adipisci rerum aut animi', email: 'Nikita@garfield.biz', body: 'quia molestiae reprehenderit quasi aspernatur\naut expedita occaecati aliquam eveniet laudantium\nomnis quibusdam delectus saepe quia accusamus maiores alias\nest minus ducimus vel eum hoc' },
      { postId: 3, name: 'autem veritatis minus ut a', email: 'Lew@alysha.tv', body: 'aut porro inventore ut\nut veniam dicta temporibus placeat distinctio iure\nresponsere distinctio omnis id\nvoluptate nihil accusantium' }
    ]);

    console.log('Seeding completed successfully! Default user password is "123456"');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Function to ensure database exists for MySQL
const ensureDatabaseExists = async () => {
  if (process.env.DB_DIALECT === 'mysql') {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'jsonplaceholder_clone'}\`;`);
      await connection.end();
      console.log('Database ensured (created if not existed).');
    } catch (error) {
      console.warn('Warning: Could not auto-create database. If it does not exist, connection may fail:', error.message);
    }
  }
};

// Sync database and start server
ensureDatabaseExists()
  .then(() => sequelize.sync({ force: false }))
  .then(async () => {
    console.log('Database connection synced successfully.');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });
