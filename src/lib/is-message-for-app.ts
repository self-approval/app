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
        return ("comment" in this.context.payload)
            && (/@self-?approval(\[bot\])?\s/.test(this.context.payload.comment.body.toLowerCase()))
    }
}
