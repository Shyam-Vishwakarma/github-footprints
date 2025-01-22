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
      let line = ``;
      const type = event.type;
      const payload = event.payload;
      const repo = event.repo;

      if (type.match("PullRequestEvent")) {
        line += `${idx + 1} 💪🏻  Opened PR [#${payload.number}](${
          payload.pull_request.url
        }) in [${repo.name}](${repo.url})`;
      }

      if (type.match("IssuesEvent")) {
        line += `${idx + 1} ❗ Opened issue [#${payload.issue.number}](${
          payload.issue.url
        }) in [${repo.name}](${repo.url})`;
      }

      if (type.match("IssueCommentEvent")) {
        line += `${idx + 1} 🗣️  Commented on [#${payload.issue.number}](${
          payload.issue.url
        }) in [${repo.name}](${repo.url})`;
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
      `${startMarker}\n${activityLines.join("</br>")}\n${endMarker}`
    );

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
