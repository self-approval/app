import {Context} from "probot";

module.exports = isMessageForApp;

/**
 * @param context
 */
function isMessageForApp(context: Context) {
  if ("comment" in context.payload) {
    const lowerCaseMessage = context.payload.comment.body.toLowerCase();
    return /@self-?approval(\[bot\])?\s/.test(lowerCaseMessage);
  }
  return false;
}
