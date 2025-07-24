import express from 'express';

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/admin/prices', (req, res) => {});
app.get('/api/orders', (req, res) => {});
app.get('/api/orders/me', (req, res) => {});
app.post('/api/admin/prices', (req, res) => {});
app.post('/api/quotes', (req, res) => {});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});