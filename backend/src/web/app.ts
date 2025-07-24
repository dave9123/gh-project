import express from 'express';
import orders from './api/orders';
import enterprise from './api/enterprise';

const app = express();

app.use('/api/orders', orders);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));