---
name: lao-nextjs-document-designer
description: Build, refactor, and verify frontend-only Next.js, React, and TypeScript document-template galleries and Word/Canva-style editors for Lao or bilingual Lao-English documents. Use for direct paper editing, template filters, independent Lao and English fonts, browser-only persistence, responsive editor layouts, printing, and client-side PDF/image export; do not use to create a backend document-management system.
---

# Lao Next.js Document Designer

Build a client-side document design application in which a user chooses a paper type or template, edits the paper directly, and prints or exports the result. Treat it as a design tool, not as a records-management product.

## Load the product contract

Read [references/product-requirements.md](references/product-requirements.md) completely before planning or editing code. Treat every item there as an acceptance criterion unless the user's current request explicitly overrides it.

## Enforce the boundary first

- Use Next.js, React, TypeScript, Client Components, and the project's existing CSS or Tailwind setup.
- Keep the application frontend-only and compatible with static export when the project supports it.
- Never add a backend, database, authentication, accounts, admin panel, private API, server-side storage, cloud storage, permissions system, or storage-oriented Server Actions.
- Keep templates as local TypeScript or JSON data and user work in browser storage.
- Preserve the existing package manager, design system, dependencies, and project conventions when they can satisfy the request.
- Do not expose a control unless it performs its advertised action. Remove, disable with an explanation, or implement any placeholder control.

## Follow this workflow

1. Inspect the repository, routes, package scripts, dependencies, editor state, print CSS, and current UI before changing anything.
2. Map the requested work to the template gallery, editing canvas, properties, local persistence, typography, responsive layout, and export pipeline.
3. Define or extend typed models for templates, document pages, editor objects, typography, paper settings, issuer metadata, and saved local projects.
4. Implement the smallest coherent vertical slice. Connect each visible control to state, history, rendering, persistence, and export as applicable.
5. Keep browser-only code behind Client Component boundaries and access `window`, storage, canvas, and font APIs only in the browser.
6. Test realistic Lao-only, English-only, and mixed Lao-English content. Test long lines, multi-page content, images, print preview, reload recovery, and narrow screens.
7. Run the repository's relevant lint, typecheck, test, and build commands. Also perform visual browser checks when the local application can run.

## Implement script-aware typography

- Store Lao and English font selections independently. Never model them as one global document font.
- Detect Lao characters with the Lao Unicode block `U+0E80-U+0EFF` and Latin characters separately.
- Render mixed content as script-aware text runs or equivalent editor marks so Lao characters use the selected Lao font and Latin characters use the selected English font.
- Preserve combining marks, whitespace, punctuation, cursor position, selection, undo/redo, copy/paste, and export output when splitting or styling runs.
- Give each script a safe fallback stack. Do not rely on a single CSS stack if one chosen font contains glyphs for both scripts and would therefore override the other selection.
- Preview font choices using the corresponding script. Check local-font availability with `document.fonts.check()` where appropriate and communicate fallback behavior.
- Await `document.fonts.ready` before PDF or image capture, printing preparation, or any measurement that determines pagination.

## Keep persistence local and honest

- Use `localStorage` only for small settings and lightweight state.
- Use IndexedDB for large documents, images, signatures, thumbnails, or many saved projects.
- Autosave on the current device, provide JSON download/import, and provide a deliberate local-data deletion action.
- Explain in the UI that data remains on the device and can be lost if browser data is cleared. Never imply cloud backup or account synchronization.
- Version serialized data and validate imported JSON before applying it.

## Preserve paper output

- Make paper size and orientation the source of truth for editor dimensions, print CSS, pagination, and export.
- Hide editing chrome when printing. Preserve fonts, colors, images, positions, and page breaks.
- Detect content overflow before export and show a useful warning instead of silently clipping Lao text.
- Support browser printing and client-side PDF. Add PNG/JPG only when the existing implementation or a suitable client library can export it reliably.
- Keep multi-page documents deterministic and avoid cutting Lao lines, images, signatures, or table rows at page boundaries when practical.

## Keep issuer and platform branding distinct

- Model `ອອກໃຫ້ໂດຍ` / `Issued by` as editable, removable template content.
- A new template may suggest TJ Group as a default, but never hardcode TJ Group as the issuer of every document.
- Treat `Powered by TJ Group` as optional platform branding, separate from document authorization.

## Completion criteria

Before handing off work, confirm that:

- document-type selection and all applicable gallery filters work together;
- direct editing and every visible toolbar/property control works;
- undo/redo and local autosave recover expected state;
- Lao and English font choices remain independent in the same line;
- print/PDF output matches the selected paper settings and contains no clipped Lao glyphs;
- the editor remains usable on mobile through drawers or bottom sheets rather than a compressed desktop layout;
- no forbidden server-side or management-system feature was introduced.
