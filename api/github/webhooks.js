const { createNodeMiddleware, createProbot } = require("probot");

const app = require("../../app");

// @ts-ignore
module.exports = createNodeMiddleware(app, {

  probot: createProbot({
    overrides: {
      // @ts-ignore
      privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
    }
  }),
  webhooksPath: "/api/github/webhooks",
});
