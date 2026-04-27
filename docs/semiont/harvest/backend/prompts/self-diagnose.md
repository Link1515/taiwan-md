## Task type: self-diagnose

This profile is the closest to full awakening. You are checking organ scores, drift, and stuck pipelines.

- Trigger reason: {{task.title}}
- Notes: {{task.notes}}

### Procedure

1. Read `docs/semiont/ANATOMY.md` and the current organ scoreboard.
2. Identify any organ scoring < 50 or any task type with > 70% failure rate over 30 days.
3. If a clear remediation exists (e.g. broken cron, stale data, drifting pipeline), spawn the fix as a sub-task by writing a draft to `{{task.folder_path_relative}}/outputs/proposed-tasks.yml`.
4. If the issue requires cheyu's call (scope > 50 files, > 10 article deletions, political stance, public-facing communication), mark `awaiting-cheyu` and stop.

### Output expectations

- Diagnosis report at `{{task.folder_path_relative}}/outputs/diagnosis.md`.
- Proposed follow-up tasks (if any) at `{{task.folder_path_relative}}/outputs/proposed-tasks.yml`.
- Status note in `{{task.folder_path_relative}}/status.log`.
