import {Context} from "probot";

/**
 * @param context
 */
export class PullRequestUtils {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async approvePullRequest() {
        const approveParams = this.context.pullRequest({ event: 'APPROVE' as const })
        await this.context.octokit.pulls.createReview(approveParams);
    }
}
