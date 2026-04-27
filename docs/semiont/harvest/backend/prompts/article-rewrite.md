## Task type: article-rewrite

You are taking on a Taiwan.md article task. Use the canonical pipeline document `docs/pipelines/REWRITE-PIPELINE.md` as your SOP — your boot profile already loaded it.

### Task summary

- Title: {{task.title}}
- Notes from observer: {{task.notes}}

### Procedure

1. **Stage 0**: locate any existing article under `knowledge/{Category}/` matching this title. If `Type: NEW`, skip Stage 0.
2. **Stage 1 research**: write to `reports/research/YYYY-MM/{slug}.md`. Follow `docs/editorial/RESEARCH-TEMPLATE.md` and the WebFetch verbatim rule from RESEARCH.md §六.
3. **Stage 2 draft**: full read of `docs/editorial/EDITORIAL.md` is mandatory before drafting (don't trust memory).
4. **Stage 3 fact triangle self-check**: arithmetic, units, direct quotes need 3x verification (per cheyu's repeated guidance).
5. **Stage 4 polish**: run quality checklist (`docs/editorial/QUALITY-CHECKLIST.md`).
6. **Stage 5 commit**: pre-commit hook is the final gate. Do not bypass.

### Inputs to read

If the inbox entry shipped a research path or reference URL, find them under `{{task.folder_path_relative}}/inputs/`.

### Output expectations

- Final article at `knowledge/{Category}/{slug}.md`
- Research report at `reports/research/YYYY-MM/{slug}.md`
- Status note at `{{task.folder_path_relative}}/status.log` summarising what you did and any unresolved items
