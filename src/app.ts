import type { Probot } from "probot";
import { IsMessageForApp } from "./lib/is-message-for-app";
import { PullRequestUtils } from "./lib/pull-request-utils";

export default (app: Probot) => {
  app.log("Yay! The app was loaded!");

  app.on("issue_comment.created", async (context) => {
    // if (!context.payload.issue.pull_request) return;  // ignore non-PR comments
    if (context.isBot) return;  // ignore bot comments
    if (!new IsMessageForApp(context).verify()) return; // ignore comments that don't mention the app

    // Get configuration
    const config: any = await context.config('self-approval.yml');

    // The pull request and comment creators
    const issueUser = context.payload.issue.user;
    const reviewUser = context.payload.comment.user;

    // Get the comment sent by the user
    const comment = context.payload.comment.body;
    context.log("comment received: " + comment);

    // Get the message from the comment
    const message = comment.split(" ").slice(1).join(" ");
    context.log("message from comment: " + message);

    // If the message is not in the list of self-approval messages, add a confused reaction
    const isSelfApproval = config.self_approval_messages.includes(message);
    context.log("is self approval: " + isSelfApproval);
    if (!isSelfApproval) {
      return context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "confused"
      });
    }

    // If the creator of the pull request not the same as the creator of the comment,
    // add a -1 reaction and add a comment telling the user not to self-approve someone else's PR
    if (issueUser.id !== reviewUser.id) {
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      });
      return context.octokit.issues.createComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        body: "@" + reviewUser.login + ", you are not allowed to self-approve someone else's PR."
      });
    }

    // If the creator of the pull request and the comment is not in the list of allowed users,
    // add a -1 reaction and add a comment telling the user they are not allowed to self-approve
    if (!config.from_author.includes(issueUser.login)) {
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      });
      return context.octokit.issues.createComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        body: "@" + reviewUser.login + ", you are not allowed to self-approve your own PR."
      });
    }

    // Otherwise, all conditions are met, so add a +1 reaction
    context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "+1"
    });

    const pr = new PullRequestUtils(context);
    // Then approve the pull request
    await pr.approvePullRequest();
    // And apply labels
    await pr.applyLabels(config.apply_labels as string[]);

    // Add a hooray reaction to confirm that all steps were completed and finish.
    return context.octokit.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "hooray"
    });
  });
};
