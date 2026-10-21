const express = require('express');
const path = require('path');

const app = express();
const distPath = path.resolve(__dirname, 'dist');
const port = process.env.PORT || 3000;

app.use(express.static(distPath, { index: false }));

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
