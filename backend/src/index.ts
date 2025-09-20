import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import landingPageRouter from './routes/landing-page';
import profilesRouter from './routes/profiles';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
app.use(cors());            // <- allow Expo Go to call us
app.use(express.json());

app.get('/ping', (_req, res) => res.send('pong'));

app.use(landingPageRouter); // /api/items
app.use(usersRouter);        // User authentication
app.use(profilesRouter);

app.listen(3001, () => {
  console.log('Server running on port 3001');
  console.log('Available routes:');
  console.log('  GET  /ping - Health check');
  console.log('  GET  /api/landing-emails - Get landing page emails');
  console.log('  POST /api/landing-emails - Add landing page email');
  console.log('  GET  /api/users - Get all users');
  console.log('  GET  /api/users/:netid - Get user by netid');
  console.log('  POST /api/users - Create new user');
  console.log('  POST /api/users/login - User login');
  console.log('  DELETE /api/users/:netid - Delete user');
  console.log('  GET  /api/profiles - Get all profiles (with filters)');
  console.log('  GET  /api/profiles/:netid - Get profile by netid');
  console.log('  POST /api/profiles - Create new profile');
  console.log('  PUT  /api/profiles/:netid - Update profile');
  console.log('  DELETE /api/profiles/:netid - Delete profile');
  console.log('  GET  /api/profiles/:netid/matches - Get potential matches');
});
