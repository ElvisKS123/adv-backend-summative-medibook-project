require('dotenv').config();
const app = require('./app');
const redis = require('./config/redis');

const PORT = process.env.PORT || 3000;

async function start() {
  await redis.connect();
  app.listen(PORT, () => console.log(`MediBook API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
