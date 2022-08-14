import { Probot, Context } from "probot";

module.exports = (app: Probot) => {
  app.on(["issue_comment.created", "issue_comment.edited"], async (context) => {
    console.log("issue_comment.created or issue_comment.edited")

    if (context.isBot) {
      // Ignore comments if this issue was created by the bot=
      console.log("This comment was created by the bot")
      return;
    }

    if (!context.payload.issue.pull_request) {
      // Ignore comments if this issue is not a PR
      console.log("This comment is not created in a PR")
      return;
    }

    // Get the content of the comment
    const comment = context.payload.comment.body
    console.log("Comment: " + comment)

    // Read the configuration
    const config: any = await context.config('self-approval.yml')

    // Check if the comment is a self-approval
    const isSelfApproval = config.self_approval_comments.includes(comment)
    if (!isSelfApproval) {
      console.log("Not a self-approval comment")
      return;
    }
    console.log("Is a self-approval comment")

    // Get the author of the PR and the comment
    const prUser = context.payload.issue.user.login
    console.log("PR User: " + prUser)
    const reviewUser = context.payload.comment.user.login
    console.log("Review User: " + reviewUser)
    // Check if they are the same user
    if (prUser !== reviewUser) {
      console.log("Not the same user")
      // If they are different users, tell the user that they are not allowed to self-approve this PR
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      })
      console.log("Reacted with -1")
      const issueComment = context.issue({
        body: "You are not allowed to self-approve others Pull Request!",
      });
      await context.octokit.issues.createComment(issueComment);
      console.log("Not allowed comment sent")
      return
    }
    console.log("Same user")

    // Check if the user is in the whitelist
    const userSatisfied = config.from_author.length === 0 || config.from_author.includes(prUser)
    if (!userSatisfied) {
      console.log("User not in whitelist")
      // If the user is not in the whitelist, tell the user that they are not allowed to use this command
      context.octokit.reactions.createForIssueComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id,
        content: "-1"
      })
      console.log("Reacted with -1")
      const issueComment = context.issue({
        body: "You are not allowed to use this command!",
      });
      await context.octokit.issues.createComment(issueComment);
      console.log("Not allowed comment sent")
      return
    }
    console.log("User in whitelist")

    // Add a requirement met confirmation to the comment
    context.octokit.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "+1"
    })
    console.log("Reacted with +1")

    // Approve the PR
    approvePullRequest(context)
    applyLabels(context, config.apply_labels as string[])
    console.log("PR approved")

    // Add a confirm reaction to the comment
    context.octokit.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "hooray"
    })
    console.log("Reacted with hooray")
    console.log("Done")

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
