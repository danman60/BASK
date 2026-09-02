## Compass — Coaching

`/compass/coaching?role=uvalux_rep`. UVALUX-internal. Every Compass route needs the
role parameter or the router returns FORBIDDEN, which looks like a broken page.

- [ ] `/compass/coaching?role=uvalux_rep` renders inside the Compass shell.
- [ ] A **Coaching** entry appears in the nav and is marked current.
- [ ] No infinite spinner and no blank body.
- [ ] If an answer is shown, it carries its source. An answer that cannot cite where it
      came from is the failure this surface exists to prevent — report it.
- [ ] Where a speaker or session is unknown, the page says so rather than showing a name.

### Report as SKIP, not PASS

- Retrieval over the knowledge base is **built but unwired** (`core/knowledge/retrieve.ts`
  has no caller). If coaching renders fixtures rather than real retrieval, that is SKIP.
- `bask.knowledge_doc` holds **0 rows**; the 22 expo documents exist only as a JSONL
  fixture on disk. Any answer implying a populated corpus is wrong.

> The Knowledge surface is covered separately and in depth by
> `tests/agent/compass-knowledge.md`, which the assembler appends. Do not duplicate it here.
