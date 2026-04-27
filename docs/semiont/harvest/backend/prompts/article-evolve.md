## Task type: article-evolve

This is an EVOLVE pass on an existing article. Walk REWRITE-PIPELINE Stage 0 (素材萃取) before normal stages 1–6.

- Title: {{task.title}}
- Notes from observer: {{task.notes}}

### Stage 0 specifics

1. Read the current article in full.
2. Inventory: which paragraphs survive, which need fact-check refresh, which should be cut.
3. Write a Stage 0 plan to `{{task.folder_path_relative}}/outputs/stage-0-plan.md` BEFORE editing any production file.

After Stage 0 plan, proceed exactly like article-rewrite (research → draft → fact triangle → polish → commit).
