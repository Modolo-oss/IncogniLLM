import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import chatRoutes from './routes/chatRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('IncogniLLM Server is running');
});

app.use('/api', chatRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
