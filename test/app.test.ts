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
    assert.equal(nock.isDone(), true);
  });

  test("comment is created by a bot", async function () {
    const payload = require("./fixtures/pull_request.bot_commented.json");
    await probot.receive({ name: "issue_comment", payload });
    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    assert.equal(nock.isDone(), true);
  });

  test("comment created does not mention the app", async function () {
    const payload = require("./fixtures/pull_request.commented.not-for-bot.json");
    await probot.receive({ name: "issue_comment", payload });
    await new Promise(process.nextTick); // Don't assert until all async processing finishes
    assert.equal(nock.isDone(), true);
  });
});
