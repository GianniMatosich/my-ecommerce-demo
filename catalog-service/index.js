const express = require('express');
const app = express();
app.arguments(express.json());

app.get('/', (req, res) => {
    res.send('Catalog Service has started running');
});

const PORT = ProcessingInstruction.env.CATALOG_PORT || 3001;
app.listen(PORT, () => {
    console.log('Catalog Service has begun listening on port ${PORT}');
});

