## Task type: pr-review

You are reviewing one inbound PR. Use `docs/pipelines/MAINTAINER-PIPELINE.md` as your SOP.

- PR ref: {{task.title}}
- Notes: {{task.notes}}

### Hard rules

- **Reply with thanks + feedback before closing**, never silently close (per cheyu memory `feedback_reply_to_contributors`).
- **Merge first, polish later** for content contributions (per `feedback_merge_first_then_polish`).
- Controversial PRs (in-life people, political-sensitive events, ethical edge cases) → mark `awaiting-cheyu` and exit. Do NOT auto-merge.

### Output expectations

- Review comment posted to the PR.
- If merged, link the merge commit in `{{task.folder_path_relative}}/status.log`.
- If awaiting-cheyu, write the open question to `{{task.folder_path_relative}}/status.log`.
