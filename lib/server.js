'use strict';

const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('Running Volly!'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on localhost: ${port}`);
});