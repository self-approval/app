import type { Probot, Context } from "probot";
import { IsMessageForApp } from "./lib/is-message-for-app";

export default (app: Probot) => {
  app.log("Yay! The app was loaded!");

  app.on("issue_comment.created", async (context: Context) => {
    if (context.isBot) return;

    if (!new IsMessageForApp(context).verify()) {
      return context.octokit.issues.createComment(
        context.issue({ body: "This is not a message for me." })
      );
    }
    return context.octokit.issues.createComment(
      context.issue({ body: "This is a message for me." })
    );
  });
};
