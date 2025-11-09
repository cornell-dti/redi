import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import adminMatchesRouter from './routes/admin-matches';
import adminPromptsRouter from './routes/admin-prompts';
import adminReportsRouter from './routes/admin-reports';
import chatRouter from './routes/chat';
import imagesRouter from './routes/images';
import landingPageRouter from './routes/landing-page';
import notificationsRouter from './routes/notifications';
import nudgesRouter from './routes/nudges';
import preferencesRouter from './routes/preferences';
import profilesRouter from './routes/profiles';
import promptsRouter from './routes/prompts';
import reportsRouter from './routes/reports';
import usersRouter from './routes/users';
import authRouter from './routes/auth';

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

// Security headers middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

const allowedOrigins = [
  'https://redi.love',
  'http://localhost:3000',
  'http://localhost:3001',
  /\.netlify\.app$/, // Allow any Netlify preview/deploy
];

app.use(
  cors({
    origin: (origin, callback) => {
      // For safe methods (GET, HEAD, OPTIONS), allow no origin (mobile apps)
      // For mutation methods, require origin header
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS rejected origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: '10mb' })); // Limit request body size

// Request logging middleware
app.use((req, _res, next) => {
  next();
});

app.get('/ping', (_req, res) => res.send('pong'));

app.use(authRouter); // /api/auth
app.use(landingPageRouter); // /api/landing-emails
app.use(usersRouter); // User authentication
app.use(profilesRouter);
app.use(preferencesRouter); // /api/preferences
app.use(promptsRouter); // /api/prompts
app.use(imagesRouter); // /api/images
app.use(nudgesRouter); // /api/nudges
app.use(notificationsRouter); // /api/notifications
app.use(chatRouter); // /api/chat
app.use(reportsRouter); // /api/reports
app.use(adminMatchesRouter); // /api/admin/matches, /api/admin/users
app.use(adminPromptsRouter); // /api/admin/prompts
app.use(adminReportsRouter); // /api/admin/reports

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
