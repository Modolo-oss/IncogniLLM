import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import chatRoutes from './routes/chatRoutes';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use('/api', chatRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
