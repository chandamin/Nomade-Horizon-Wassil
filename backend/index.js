require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db/mongo');

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL,
    'https://airwall.kaswebtechsolutions.com',
    'http://localhost:5173',
    'checkout.nomade-horizon.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

/**
 * ---------------------------------------
 * Routes
 * ---------------------------------------
 */
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/bigcommerceRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/sync-orders', require('./routes/syncOrders'));
// app.use('/api/airwallex', require('./routes/airwallexTest'));
app.use('/api/selling-plans', require('./routes/airwallexLivePlan'));
app.use('/api/subscription-plans', require('./routes/airwallexTestPlan'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });
