import { suite } from "uvu";
import assert from "uvu/assert";

import nock from "nock";
nock.disableNetConnect();

import { Probot, ProbotOctokit } from "probot";
import { EmitterWebhookEvent } from "@octokit/webhooks";

import app from "../src/app";

let probot: any;

describe("self-approve bot", () => {
  beforeEach(() => {
    probot = new Probot({
      // simple authentication as alternative to appId/privateKey
      githubToken: "test",
      // disable logs
      logLevel: "warn",
      // disable request throttling and retries
      Octokit: ProbotOctokit.defaults({
        throttle: { enabled: false },
        retry: { enabled: false },
      }),
    });
    probot.load(app);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("comment is added to an issue", async function () {
    const payload = require("./fixtures/issue.commented.json");
    await probot.receive({ name: "issue_comment", payload });
    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  });

  test("comment is created by a bot", async function () {
    const payload = require("./fixtures/pull_request.bot_commented.json");
    await probot.receive({ name: "issue_comment", payload });
    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  });

  test("comment created does not mention the app", async function () {
    const payload = require("./fixtures/pull_request.commented.not-for-bot.json");
    await probot.receive({ name: "issue_comment", payload });
    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  });

  test("comment added doesn't contain self-approval message", async () => {
    const payload = require("./fixtures/pull_request.commented.not-self-approval.json");
    const config = "self_approval_messages:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n  - \"can-be-merged\"";

    nock("https://api.github.com")
      .get(
        "/repos/self-approval/app/contents/.github%2Fself-approval.yml"
      )
      .reply(200, config);

    nock("https://api.github.com")
        .post(
          "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
            expect(body.content).toBe("confused");
            return true
          })
        .reply(200);

    // Receive a webhook event
    await probot.receive({ name: "issue_comment", payload });

    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    expect(nock.isDone()).toBeTruthy()
  });
});
