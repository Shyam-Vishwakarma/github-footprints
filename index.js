import core from "@actions/core";
import github from "@actions/github";

async function run() {
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

    const activityLines = filteredEvents.map((event, idx) => {
      let line = `${idx + 1}. `;
      const type = event.type;
      const payload = event.payload;
      const repo = event.repo;

      if (type === "PullRequestEvent" && payload.action === "opened") {
        line += `💪 Opened PR [#${payload.pull_request.number}](https://github.com/${repo.name}/pull/${payload.pull_request.number}) in [${repo.name}](https://github.com/${repo.name})`;
      } else if (type === "PullRequestEvent" && payload.action === "closed") {
        line += `❌ Closed PR [#${payload.pull_request.number}](https://github.com/${repo.name}/pull/${payload.pull_request.number}) in [${repo.name}](https://github.com/${repo.name})`;
      } else if (type === "IssuesEvent" && payload.action === "opened") {
        line += `❗ Opened issue [#${payload.issue.number}](https://github.com/${repo.name}/issues/${payload.issue.number}) in [${repo.name}](https://github.com/${repo.name})`;
      } else if (type === "IssueCommentEvent") {
        line += `🗣️ Commented on [#${payload.issue.number}](https://github.com/${repo.name}/issues/${payload.issue.number}) in [${repo.name}](https://github.com/${repo.name})`;
      }

      return line;
    });

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