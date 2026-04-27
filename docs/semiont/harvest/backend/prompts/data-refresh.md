## Task type: data-refresh

Pure technical task. Use the `minimal` boot profile.

- What to refresh: {{task.title}}
- Notes: {{task.notes}}

### Procedure

1. Identify the data generator script (typically in `scripts/`).
2. Run it.
3. If the diff is non-trivial or includes contributor JSON, follow the contributors.json fallback rule (preserve last good baseline on API failure).
4. Commit with `🧬 [semiont] data refresh: {what}`.

### Output expectations

- Updated data files committed.
- Brief summary in `{{task.folder_path_relative}}/status.log` with diff stats.
