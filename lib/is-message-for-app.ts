import {Context} from "probot";

/**
 * @param context
 */

export class IsMessageForApp {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  verify() {
    if ("comment" in this.context.payload) {
      const lowerCaseMessage = this.context.payload.comment.body.toLowerCase();
      return /@self-?approval(\[bot\])?\s/.test(lowerCaseMessage);
    }
    return false;
  }
}
