import type { Probot } from "probot";
import { IsMessageForApp } from "./lib/is-message-for-app";

export default (app: Probot) => {
  app.log("Yay! The app was loaded!");

  app.on("issue_comment.created", async (context) => {
    if (!context.payload.issue.pull_request) return;  // ignore non-PR comments
    if (context.isBot) return;  // ignore bot comments
    if (!new IsMessageForApp(context).verify()) return; // ignore comments that don't mention the app

    // Get configuration
    const config: any = await context.config('self-approval.yml');

    // The pull request and comment creators
    const issueUser = context.payload.issue.user.login;
    const reviewUser = context.payload.comment.user.login;

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
  });
};
