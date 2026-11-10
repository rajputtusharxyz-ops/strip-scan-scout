<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Analysis runs only on the separate Python service in `inference-service/` (called via `VITE_ANALYSIS_API_URL`); never compute or mock results in the browser — the model pipeline cannot run on the edge runtime and fabricated values are unsafe.
- Frontend response contract lives in `src/types/analysis.ts` and must match `inference-service/app/schemas.py`; `normalizeResponse` drops numbers from any non-complete result.
