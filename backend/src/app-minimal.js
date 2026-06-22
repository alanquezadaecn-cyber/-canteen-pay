console.log('✅ App starting...');

import express from 'express';
console.log('✅ Express imported');

const app = express();
console.log('✅ App created');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
console.log('✅ Health endpoint registered');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅✅✅ SERVER ON PORT ${PORT}`);
});
