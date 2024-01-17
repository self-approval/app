import nock from "nock";

nock.disableNetConnect();

import {Probot, ProbotOctokit} from "probot";

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
                throttle: {enabled: false},
                retry: {enabled: false},
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
        await probot.receive({name: "issue_comment", payload});
        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("comment is created by a bot", async function () {
        const payload = require("./fixtures/pull_request.bot_commented.json");
        await probot.receive({name: "issue_comment", payload});
        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("comment created does not mention the app", async function () {
        const payload = require("./fixtures/pull_request.commented.not_for_bot.json");
        await probot.receive({name: "issue_comment", payload});
        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("comment added doesn't contain self-approval message", async () => {
        const payload = require("./fixtures/pull_request.commented.not_self_approval.json");
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
        await probot.receive({name: "issue_comment", payload});

        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("comment creator is not the same as the pull request author", async () => {
        const payload = require("./fixtures/pull_request.commented.not_same_user.json");
        const config = "self_approval_messages:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n  - \"can-be-merged\"";

        nock("https://api.github.com")
            .get(
                "/repos/self-approval/app/contents/.github%2Fself-approval.yml"
            )
            .reply(200, config);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("-1");
                    return true
                })
            .reply(200);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/1/comments", (body: any) => {
                    const message = body.body
                    expect(message.startsWith("@")).toBeTruthy()
                    expect(message.endsWith("you are not allowed to self-approve someone else's PR.")).toBeTruthy()
                    return true
                })
            .reply(200);

        // Receive a webhook event
        await probot.receive({name: "issue_comment", payload});

        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("comment creator is not in the whitelist", async () => {
        const payload = require("./fixtures/pull_request.commented.not_in_whitelist.json");
        const config = "self_approval_messages:\n  - \"I self-approve!\"\nfrom_author:\n  - Octocat\napply_labels:\n  - \"can-be-merged\"";

        nock("https://api.github.com")
            .get(
                "/repos/self-approval/app/contents/.github%2Fself-approval.yml"
            )
            .reply(200, config);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("-1");
                    return true
                })
            .reply(200);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/1/comments", (body: any) => {
                    const message = body.body
                    expect(message.startsWith("@")).toBeTruthy()
                    expect(message.endsWith("you are not in the list of allowed users to self-approve your own PR.")).toBeTruthy()
                    return true
                })
            .reply(200);

        // Receive a webhook event
        await probot.receive({name: "issue_comment", payload});

        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("pull request approved (w/ label)", async () => {
        const payload = require("./fixtures/pull_request.commented.approved.json");
        const config = "self_approval_messages:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n  - \"can-be-merged\"";

        nock("https://api.github.com")
            .get(
                "/repos/self-approval/app/contents/.github%2Fself-approval.yml"
            )
            .reply(200, config);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("+1");
                    return true
                })
            .reply(200);

        nock('https://api.github.com')
            .post('/repos/self-approval/app/pulls/1/reviews', (body: any) => {
                expect(body.event).toBe('APPROVE');
                return true
            })
            .reply(200)

        nock('https://api.github.com')
            .post('/repos/self-approval/app/issues/1/labels', (body: any) => {
                expect(body.labels.includes('can-be-merged')).toBeTruthy()
                return true
            })
            .reply(200)

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("hooray");
                    return true
                })
            .reply(200);

        // Receive a webhook event
        await probot.receive({name: "issue_comment", payload});

        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });

    test("pull request approved (w/o labels)", async () => {
        const payload = require("./fixtures/pull_request.commented.approved.json");
        const config = "self_approval_messages:\n  - \"I self-approve!\"\nfrom_author:\n  - Cubik65536\napply_labels:\n";

        nock("https://api.github.com")
            .get(
                "/repos/self-approval/app/contents/.github%2Fself-approval.yml"
            )
            .reply(200, config);

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("+1");
                    return true
                })
            .reply(200);

        nock('https://api.github.com')
            .post('/repos/self-approval/app/pulls/1/reviews', (body: any) => {
                expect(body.event).toBe('APPROVE');
                return true
            })
            .reply(200)

        nock("https://api.github.com")
            .post(
                "/repos/self-approval/app/issues/comments/1214257100/reactions", (body: any) => {
                    expect(body.content).toBe("hooray");
                    return true
                })
            .reply(200);

        // Receive a webhook event
        await probot.receive({name: "issue_comment", payload});

        await new Promise(process.nextTick); // Don't assert until all async processing finishes
        expect(nock.isDone()).toBeTruthy()
    });
});
