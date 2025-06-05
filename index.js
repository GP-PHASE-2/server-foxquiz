require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const { setupSocketHandlers } = require('./socket');
const sequelize = require('./config/database');

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5173','https://gp-dio.web.app'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type']
  },
  allowEIO3: true
});

// Configure CORS for Express app with more explicit settings
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Socket.io setup
setupSocketHandlers(io);

// Hapus bagian database sync dan server start, ganti dengan:
module.exports = server;

// Jika dijalankan langsung (bukan di-require)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  sequelize.sync({ force: false })
    .then(() => {
      console.log('Database synced successfully');
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
      });
    })
    .catch(err => {
      console.error('Unable to sync database:', err);
    });
}