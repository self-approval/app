import { Probot, Context } from "probot";

import { IsMessageForApp } from "./lib/is-message-for-app";

module.exports = (app: Probot) => {
  // @ts-ignore
  app.on('issue_comment.created', async (context) => {
    context.log("issue_comment.created or issue_comment.edited");

    if (!context.payload.issue.pull_request) {
      // Ignore comments if this issue is not a PR
      context.log("This comment is not created in a PR");
      context.log("Execution finished\n\n");
      return;
    }

    if (context.isBot) {
      // Ignore comments if this issue was created by the bot=
      context.log("This comment was created by the bot");
      context.log("Execution finished\n\n");
      return;
    }

    if (!(new IsMessageForApp(context).verify)) {
      context.log("This comment is not for the bot");
      context.log("Execution finished\n\n");
      return;
    }
    context.log("\"" + context.payload.comment.body + "\" comment is for the bot")

    // Get the content of the comment
    const comment = context.payload.comment.body.split(' ').slice(1).join(' ');
    context.log("Comment: " + comment);

    // Read the configuration
    const config: any = await context.config('self-approval.yml');

    // Check if the comment is a self-approval
    const isSelfApproval = config.self_approval_comments.includes(comment);
    if (!isSelfApproval) {
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "confused"
      });
      context.log("Not a self-approval comment");
      context.log("Execution finished\n\n");
      return;
    }
    context.log("Is a self-approval comment");

    // Get the author of the PR and the comment
    const prUser = context.payload.issue.user.login;
    context.log("PR User: " + prUser);
    const reviewUser = context.payload.comment.user.login;
    context.log("Review User: " + reviewUser);
    // Check if they are the same user
    if (prUser !== reviewUser) {
      context.log("Not the same user");
      // If they are different users, tell the user that they are not allowed to self-approve this PR
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      });
      context.log("Reacted with -1");
      const issueComment = context.issue({
        body: "You are not allowed to self-approve others Pull Request!",
      });
      await context.octokit.issues.createComment(issueComment);
      context.log("Not allowed comment sent");
      context.log("Execution finished\n\n");
      return;
    }
    context.log("Same user");

    // Check if the user is in the whitelist
    const userSatisfied = config.from_author.length === 0 || config.from_author.includes(prUser);
    if (!userSatisfied) {
      context.log("User not in whitelist");
      // If the user is not in the whitelist, tell the user that they are not allowed to use this command
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      });
      context.log("Reacted with -1");
      const issueComment = context.issue({
        body: "You are not allowed to use this command!",
      });
      await context.octokit.issues.createComment(issueComment);
      context.log("Not allowed comment sent");
      context.log("Execution finished\n\n");
      return;
    }
    context.log("User in whitelist");

    // Add a requirement met confirmation to the comment
    context.octokit.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "+1"
    });
    context.log("Reacted with +1");

    // Approve the PR
    approvePullRequest(context);
    applyLabels(context, config.apply_labels as string[]);
    context.log("PR approved");

    // Add a confirm reaction to the comment
    context.octokit.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "hooray"
    });
    context.log("Reacted with hooray");
    context.log("Execution finished\n\n");

  });
};

async function approvePullRequest (context: Context) {
  // Approve the PR
  const prParams = context.pullRequest({ event: 'APPROVE' as const })
  await context.octokit.pulls.createReview(prParams)
}

async function applyLabels (context: Context, labels: string[]) {
  // If there are labels to apply after approval, apply them
  if (labels.length > 0) {
    // Try to apply existing labels to PR. If labels didn't exist, this call will fail.
    const labelsParam = context.issue({ labels: labels })
    await context.octokit.issues.addLabels(labelsParam)
  }
}
