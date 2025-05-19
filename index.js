import core from "@actions/core";
import github from "@actions/github";

async function run() {
  const createLink = (txt, url) => {
    return `[${txt}](${url})`;
  };
  try {
    const githubToken = core.getInput("GITHUB_TOKEN");
    const username = core.getInput("USERNAME");
    const maxLines = parseInt(core.getInput("MAX_LINES"));
    const targetFile = core.getInput("TARGET_FILE");
    const commitMessage = core.getInput("COMMIT_MESSAGE");
    const trackEvents = core.getInput("TRACK_EVENTS")?.split(",");

    const octokit = github.getOctokit(githubToken);

    const { data: events } =
      await octokit.rest.activity.listPublicEventsForUser({
        username: username,
        per_page: 100,
      });

    const filteredEvents = events
      .filter((event) => trackEvents.includes(event.type))
      .slice(0, maxLines);

    const activityLines = filteredEvents
      .filter((event) => {
        const type = event.type;
        const action = event.payload?.action;

        return (
          (type === "PullRequestEvent" &&
            (action === "opened" || action === "closed")) ||
          (type === "IssuesEvent" && action === "opened") ||
          type === "IssueCommentEvent" ||
          type === "PullRequestReviewEvent"
        );
      })
      .map((event, idx) => {
        const type = event.type;
        const payload = event.payload;
        const repo = event.repo;
        const repoLink = createLink(
          repo.name,
          `https://github.com/${repo.name}`
        );
        let line = `${idx + 1}. `;

        if (type === "PullRequestEvent" && payload.action === "opened") {
          const prLink = createLink(
            `#${payload.pull_request.number}`,
            `https://github.com/${repo.name}/pull/${payload.pull_request.number}`
          );
          line += `💪 Opened PR ${prLink} in ${repoLink}`;
        } else if (type === "PullRequestEvent" && payload.action === "closed") {
          const prLink = createLink(
            `#${payload.pull_request.number}`,
            `https://github.com/${repo.name}/pull/${payload.pull_request.number}`
          );
          line += `🔒 Closed PR ${prLink} in ${repoLink}`;
        } else if (type === "IssuesEvent" && payload.action === "opened") {
          const issueLink = createLink(
            `#${payload.issue.number}`,
            `https://github.com/${repo.name}/issues/${payload.issue.number}`
          );
          line += `❗ Opened issue ${issueLink} in ${repoLink}`;
        } else if (type === "IssueCommentEvent") {
          const commentLink = createLink(
            `#${payload.issue.number}`,
            `https://github.com/${repo.name}/issues/${payload.issue.number}`
          );
          line += `🗣️ Commented on ${commentLink} in ${repoLink}`;
        } else if (type === "PullRequestReviewEvent") {
          const prLink = createLink(
            `#${payload.pull_request.number}`,
            `https://github.com/${repo.name}/pull/${payload.pull_request.number}`
          );
          line += `👀 Reviewed PR ${prLink} in ${repoLink}`;
        }

        return line;
      })
      .slice(0, maxLines);

    const { data: fileData } = await octokit.rest.repos.getContent({
      ...github.context.repo,
      path: targetFile,
    });

    const content = Buffer.from(fileData.content, "base64").toString();

    const startMarker = "<!--START_SECTION:activity-->";
    const endMarker = "<!--END_SECTION:activity-->";

    const newContent = content.replace(
      new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
      `${startMarker}\n${activityLines.join("\n")}\n${endMarker}`
    );

    if (content === newContent) {
      return;
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      ...github.context.repo,
      path: targetFile,
      message: commitMessage,
      content: Buffer.from(newContent).toString("base64"),
      sha: fileData.sha,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
