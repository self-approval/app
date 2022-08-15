// You can import your modules
// import index from '../src/index'

import nock from "nock";
// Requiring our app implementation
const myProbotApp = require("../src");
const { Probot, ProbotOctokit } = require("probot");

const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("self-approve bot", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123456,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    myProbotApp(probot);
  });

  test("Pull Request comment created by a bot", async () => {
    const payload = require("./fixtures/pull_request.bot_commented.json");

    // Receive a webhook event
    await probot.receive({ name: "issue_comment", payload });

    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
