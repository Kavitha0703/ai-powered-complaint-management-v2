const express = require('express');
const app = express();
try {
  app.get('*all', (req, res) => res.send('ok'));
  console.log('*all works');
} catch (e) {
  console.log('*all fails', e.message);
}
