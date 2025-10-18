import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import landingPageRouter from './routes/landing-page';
import profilesRouter from './routes/profiles';
import usersRouter from './routes/users';
import preferencesRouter from './routes/preferences';
import promptsRouter from './routes/prompts';
import adminPromptsRouter from './routes/admin-prompts';
import imagesRouter from './routes/images';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

const allowedOrigins = [
  'https://redi.love',
  'http://localhost:3000',
  'http://localhost:3001',
  /\.netlify\.app$/, // Allow any Netlify preview/deploy
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/ping', (_req, res) => res.send('pong'));

app.use(landingPageRouter); // /api/landing-emails
app.use(usersRouter); // User authentication
app.use(profilesRouter);
app.use(preferencesRouter); // /api/preferences
app.use(promptsRouter); // /api/prompts
app.use(adminPromptsRouter); // /api/admin/prompts
app.use(imagesRouter); // /api/images

app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  GET  /ping - Health check');
    console.log('  GET  /api/landing-emails - Get landing page emails');
    console.log('  POST /api/landing-emails - Add landing page email');
    console.log('  GET  /api/users - Get all users');
    console.log('  GET  /api/users/:netid - Get user by netid');
    console.log('  POST /api/users - Create new user');
    console.log('  POST /api/users/login - User login');
    console.log(
      '  GET  /api/registered-count - Get number of Cornellians on waitlist'
    );
  })
  .on('error', (error) => {
    console.error('SERVER ERROR:', error);
    process.exit(1);
  });
