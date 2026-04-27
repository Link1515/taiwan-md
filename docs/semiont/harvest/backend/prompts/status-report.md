## Task type: status-report

You are writing a memo-style status report (different from the harvest engine's auto-generated daily report).

- Title: {{task.title}}
- Notes: {{task.notes}}

### Output expectations

- Markdown report at `reports/{topic}/{date}.md` per the topic.
- Commit with `🧬 [semiont] memory: {topic} status YYYY-MM-DD`.
- Summary in `{{task.folder_path_relative}}/status.log`.
