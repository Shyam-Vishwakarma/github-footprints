# 👣 GitHub Footprints

[![License](https://img.shields.io/github/license/Shyam-Vishwakarma/github-footprints)](LICENSE)

GitHub Footprints is a GitHub Action that helps you automatically update your profile's README file with your recent GitHub activity. Whether it's Pull Requests, Issues, Comments, or Stars, this tool ensures your profile showcases your latest contributions.


## 🚀 Features

- Tracks your recent GitHub activities and pushed it in `README.md` of your profile.
- Supports activity types like Pull Requests, Issues, Comments, Stars, and more.
- Customizable settings for the number of activities, target file, and commit messages.
- Easy to set up and configure using GitHub Actions.


## ⚙️ Setup Instructions

Follow these steps to set up the workflow and integrate GitHub Footprints:

### 1. Add Activity Markers to Your Readme file

Add the following markers where you want the activity section to appear:

```html
<!--START_SECTION:activity-->
<!--END_SECTION:activity-->
```

These markers indicate the section of the file that will be updated with your recent GitHub activities. The action will replace any content between these markers with the latest activity data.

#### Example
```
### :zap: Recent Activity
<!--START_SECTION:activity-->
<!--END_SECTION:activity-->
```


### 2. Add the Workflow File

Create a new workflow file in your repository under `.github/workflows`. Name it something like `update-readme.yml`.

```yaml name=.github/workflows/update-readme.yml
name: Update README with Recent Activity

on:
  schedule:
    - cron: "*/30 * * * *" # Runs every 30 minutes
  workflow_dispatch: # Allows manual triggering of the workflow

jobs:
  update-readme:
    name: Update README with Recent Activities
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      # Step to check out the repository
      - uses: actions/checkout@v3

      # Step to run the GitHub Footprints action
      - name: Update README with GitHub activity
        uses: Shyam-Vishwakarma/github-footprints@main
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          USERNAME: ${{ github.repository_owner }}
          MAX_LINES: 5
          TARGET_FILE: README.md
          COMMIT_MESSAGE: "✨ Update GitHub activities in README"
          TRACK_EVENTS: "PullRequestEvent,IssuesEvent,IssueCommentEvent,WatchEvent,PushEvent"
```

### 3. Customize the Workflow Inputs

- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions; no need to modify this.
- **`USERNAME`**: By default, it uses the repository owner. You can specify another GitHub username.
- **`MAX_LINES`**: The maximum number of recent activity lines to display in the target file (default: `5`).
- **`TARGET_FILE`**: The file to update with the activity data (default: `README.md`).
- **`COMMIT_MESSAGE`**: Custom commit message for when the file is updated (default: `🐙 Update activity in README`).
- **`TRACK_EVENTS`**: Comma-separated list of GitHub events to track (default: `PullRequestEvent,IssuesEvent,IssueCommentEvent,WatchEvent,PushEvent`).

### 4. Commit and Push the Workflow

Once you’ve added the workflow file, commit and push it to the `main` branch of your repository. The action will run automatically based on the schedule or whenever triggered manually.


## 🌟 Example Output

After the action runs, your README will look something like this:

![{C32D3C32-286E-40D1-9803-098F9BE0D2EB}](https://github.com/user-attachments/assets/791be5de-0b3d-4b91-9bce-e65b5bc0234e)



## 📖 Inputs Documentation

| **Input Name**     | **Description**                                     | **Required** | **Default Value**                            |
|---------------------|-----------------------------------------------------|--------------|----------------------------------------------|
| `GITHUB_TOKEN`      | GitHub token for authentication.                    | Yes          | N/A                                          |
| `USERNAME`          | GitHub username to track activities for.            | No           | `${{ github.repository_owner }}`             |
| `MAX_LINES`         | Maximum number of activity lines to display.        | No           | `5`                                          |
| `TARGET_FILE`       | File to update with activity data.                  | No           | `README.md`                                  |
| `COMMIT_MESSAGE`    | Commit message for updating the file.               | No           | `🐙 Update activity in README`               |
| `TRACK_EVENTS`      | Comma-separated list of events to track.            | No           | `PullRequestEvent,IssuesEvent,IssueCommentEvent,WatchEvent,PushEvent` |



_inspired by [jamesgeorge007/github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme)_

