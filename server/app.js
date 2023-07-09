const express = require('express');
const path = require('node:path');
const {api} = require('./api/api.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', api);

module.exports = {app};
