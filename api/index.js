// Vercel Serverless Function entry point
// Forwards all /api/* requests to the Express application
const app = require("../backend/server.js");

module.exports = app;
