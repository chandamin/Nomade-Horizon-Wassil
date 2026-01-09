require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));


const cors = require('cors');
const connectDB = require('./db/mongo');


/**
 * ---------------------------------------
 * Middleware
 * ---------------------------------------
 */
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'https://unpenciled-unhumored-thora.ngrok-free.dev'],
    credentials: true,
}));



app.use('/api/webhooks', require('./routes/webhooks'));
/**
 * ---------------------------------------
 * Routes
 * ---------------------------------------
 */
app.use('/api', require('./routes/auth'));


app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/sync-orders', require('./routes/syncOrders'));
app.use('/api/airwallex', require('./routes/airwallexTest'));
app.use('/api/selling-plans', require('./routes/sellingPlans'));

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

/**
 * ---------------------------------------
 * Start Server
 * ---------------------------------------
 */
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
