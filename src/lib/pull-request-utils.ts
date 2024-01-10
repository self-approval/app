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

    async applyLabels(labels: string[]) {
        if (labels.length === 0) return;
        // Try to apply existing labels to PR. If labels didn't exist, this call will fail.
        const labelParams = this.context.issue({ labels: labels });
        await this.context.octokit.issues.addLabels(labelParams);
    }
}
