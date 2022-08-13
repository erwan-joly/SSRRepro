// @ts-ignore
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const render = require('./src/server/render');

app.get('*', async (req, res) => {
    await render.render(req, res);
});
module.exports.serve = serverless(app);
