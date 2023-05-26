const { createNodeMiddleware, createProbot } = require("probot");

const app = require("../../app");

// @ts-ignore
module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: "/api/github/webhooks",
});
