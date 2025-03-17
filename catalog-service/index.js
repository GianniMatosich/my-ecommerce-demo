const express = require('express');
const app = express();

// Instead of "app.arguments", use "app.use"
app.use(express.json());

// Instead of "ProcessingInstruction.env", use "process.env"
const PORT = process.env.CATALOG_PORT || 3001;

// Use backticks for string interpolation
app.listen(PORT, () => {
  console.log(`Catalog Service has begun listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Catalog Service has started running');
});
