import type { Probot } from "probot";
import { IsMessageForApp } from "./lib/is-message-for-app";

export default (app: Probot) => {
  app.log("Yay! The app was loaded!");

  app.on("issue_comment.created", async (context) => {
    if (!context.payload.issue.pull_request) return;  // ignore non-PR comments
    if (context.isBot) return;  // ignore bot comments
    if (!new IsMessageForApp(context).verify()) return; // ignore comments that don't mention the app

    // Get the comment sent by the user
    const comment = context.payload.comment.body;
    context.log("comment received: " + comment);

    // Get the message from the comment
    const message = comment.split(" ").slice(1).join(" ");
    context.log("message from comment: " + message);

    const issueUser = context.payload.issue.user.login;
    const reviewUser = context.payload.comment.user.login;
  });
};
