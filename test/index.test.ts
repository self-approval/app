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

  test("Comment added to a Issue not Pull Request", async () => {
    const payload = require("./fixtures/issue.commented.json");

    // Receive a webhook event
    await probot.receive({ name: "issue_comment", payload });

    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy();
  });

  test("Comment added is not a self-approval comment", async () => {
    const payload = require("./fixtures/pull_request.commented.not-self-approval.json");
    const config = "self_approval_comments:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n  - \"can-be-merged\"";

    nock("https://api.github.com")
      .get(
        "/repos/CubikTech/self-approval/contents/.github%2Fself-approval.yml"
      )
      .reply(200, config);

    // Receive a webhook event
    await probot.receive({ name: "issue_comment", payload });

    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy();
  });

  test("Comment is not created by Pull Request author", async () => {
    const payload = require("./fixtures/pull_request.commented.not-same-user.json");
    const config = "self_approval_comments:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n  - \"can-be-merged\"";

    nock("https://api.github.com")
      .get(
        "/repos/CubikTech/self-approval/contents/.github%2Fself-approval.yml"
      )
      .reply(200, config);

    // Send not allowed message
    nock("https://api.github.com")
        .post(
          "/repos/CubikTech/self-approval/issues/1/comments", (body: any) => {
            expect(body.body).toBe("You are not allowed to self-approve others Pull Request!");
            return true
          })
        .reply(200);

    // React with "-1" reaction
    nock("https://api.github.com")
        .post(
          "/repos/CubikTech/self-approval/issues/comments/1214464178/reactions", (body: any) => {
            expect(body.content).toBe("-1");
            return true
          })
        .reply(200);

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
