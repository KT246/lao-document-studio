# Product requirements

This file is the complete product contract for a Lao-focused, frontend-only document designer.

## Contents

- [Product identity](#product-identity)
- [Allowed architecture](#allowed-architecture)
- [Primary user flow](#primary-user-flow)
- [Local data and recovery](#local-data-and-recovery)
- [Template gallery and filters](#template-gallery-and-filters)
- [Document editor](#document-editor)
- [Lao and English fonts](#lao-and-english-fonts)
- [Issuer and platform brand](#issuer-and-platform-brand)
- [Print and export](#print-and-export)
- [Responsive layout](#responsive-layout)
- [Acceptance checklist](#acceptance-checklist)

## Product identity

Build a document editing and design application similar in interaction to Word or Canva Documents. It is not a backend document-management system.

The product must let users:

1. select a document type and template;
2. edit content directly on paper;
3. style text, colors, images, logos, signatures, and layout;
4. preview the final paper;
5. print or export it.

Representative document types include:

- certificates;
- confirmation, commendation, and invitation letters;
- contracts;
- receipts;
- quotations;
- invoices;
- CVs and applications;
- internal documents;
- Lao-only and bilingual documents.

Do not narrow the product or brand language to company documents only.

## Allowed architecture

Use only:

- Next.js;
- React;
- TypeScript;
- Client Components for interactive/browser APIs;
- CSS or Tailwind according to the existing project;
- static export when supported by the repository.

Do not add:

- NestJS, Express, or another backend;
- private or persistence APIs;
- databases;
- authentication, accounts, or user profiles;
- admin panels;
- server-side document storage;
- storage-oriented Server Actions;
- permission systems;
- cloud storage or synchronization.

Static route generation and ordinary Next.js build features are acceptable if they do not create a server dependency.

## Primary user flow

The normal flow is:

1. Select `ປະເພດເອກະສານ` (document type).
2. Choose a template.
3. Open and edit the selected paper directly.
4. Format text and add or arrange assets.
5. Preview the paper.
6. Print or export PDF, and export an image when reliably supported.

The template choice must create an editable document rather than a read-only preview.

## Local data and recovery

All user data remains in the browser on the current device.

- Use `localStorage` for simple preferences or small drafts.
- Use IndexedDB for large documents, embedded images, signatures, thumbnails, and larger collections.
- Autosave locally and recover a recent draft after reload.
- Allow the user to download a versioned JSON backup.
- Allow import of validated JSON backups without executing arbitrary content.
- Allow explicit deletion of local documents and application data with appropriate confirmation.
- Display a clear notice that browser-data deletion can permanently erase documents and that no cloud copy exists.

Handle quota errors and corrupted or outdated stored data without crashing the editor.

## Template gallery and filters

Provide search and combinable filters for:

- `ປະເພດເອກະສານ` (document type), always present;
- language: Lao, English, bilingual;
- paper size: A4, A5, Letter;
- orientation: portrait, landscape;
- style: formal, modern, minimalist, traditional;
- color;
- logo: with logo, without logo.

Filters must update results, support reset/clear behavior, and show a useful empty state.

Do not add management-oriented filters such as:

- workflow state or approval state;
- creator;
- creation or update date;
- management unit or department ownership.

Those fields belong to a document-management product, which this application is not.

## Document editor

The document surface must use the selected paper size and orientation. Provide:

- zoom controls and fit-to-width;
- undo and redo with meaningful history grouping;
- duplicate and delete for supported objects or pages;
- drag, drop, position, and resize behavior where appropriate;
- direct text editing on the paper;
- text, image, logo, line, table, and signature insertion;
- QR insertion when a suitable client-side library is already present or can be added without server requirements;
- horizontal alignment;
- bold, italic, and underline;
- text color and background/highlight color;
- line spacing and character spacing;
- numbered and bulleted lists;
- headers and footers;
- multi-page documents and explicit page breaks.

All visible actions must be functional. Keep keyboard focus and selection stable when changing properties. Respect image aspect ratios unless the user explicitly unlocks them. Make object selection, delete, duplicate, and undo predictable.

## Lao and English fonts

Offer Lao font choices independently from English font choices.

Lao choices:

- Noto Sans Lao;
- Noto Serif Lao;
- Phetsarath OT;
- Saysettha OT;
- Lao UI;
- DokChampa;
- Souliyo.

English choices:

- Inter;
- Roboto;
- Arial;
- Times New Roman;
- Georgia;
- Montserrat;
- Poppins.

Required behavior:

- The English selection applies only to Latin-script content entered by the user.
- The Lao selection applies only to Lao-script content.
- Mixed Lao and English text on the same line automatically renders each script with its selected family.
- English font changes must not damage Lao glyphs, vowels, tone marks, or combining marks.
- Lao font changes must not unexpectedly restyle English words.
- Each selector shows a preview in its own script before selection.
- Web fonts load when permitted; installed-only fonts are checked and fall back safely when unavailable.
- Export, print, pagination, and editor measurement wait for `document.fonts.ready`.

Implement script-aware runs or editor marks. A single `font-family` on a mixed-content container is insufficient because a font containing both scripts may capture glyphs intended for the other selection.

## Issuer and platform brand

Templates may contain editable, removable issuer fields:

- `ອອກໃຫ້ໂດຍ: TJ Group`
- `Issued by: TJ Group`

TJ Group is only a default suggestion for a new template. Store issuer data per document or template and never force it into every document.

The footer may contain:

- `Powered by TJ Group`

This identifies the platform developer or operator, not the entity legally or administratively issuing the document. Keep issuer content and platform branding as separate fields with separate visibility controls.

## Print and export

Provide:

- browser printing;
- client-side PDF export;
- PNG or JPG export only when the current implementation or a suitable browser library can produce reliable results.

Output requirements:

- hide toolbars, panels, handles, guides, and other editing UI;
- preserve A4, A5, or Letter dimensions and the selected orientation;
- preserve fonts, colors, images, positions, header/footer, and page breaks;
- wait for fonts and images before capture;
- avoid cropping Lao glyphs, diacritics, line boxes, signatures, and images;
- support multi-page output;
- warn about overflow before export;
- provide a browser-print fallback if client PDF generation fails.

Use high enough rendering scale for legibility without making large documents unusable. Revoke temporary object URLs after use.

## Responsive layout

Desktop layout should use:

- top actions;
- left tools or template panel;
- center paper/canvas;
- right properties panel.

Mobile layout should use:

- a zoomable, scrollable document surface;
- bottom sheets or drawers for tools and properties;
- touch-sized actions;
- a focused selection/editing flow.

Do not squeeze all desktop sidebars into a narrow viewport. Avoid accidental page movement while the user edits text or scrolls.

## Acceptance checklist

The implementation is complete only when:

- users can filter templates and choose a document type;
- template selection opens an editable paper;
- all exposed editor controls change document state and survive the intended persistence cycle;
- undo/redo covers editing and object actions;
- Lao-only, English-only, and mixed lines render with the correct independent fonts;
- local autosave, JSON export/import, and local deletion work;
- issuer data is editable/removable and independent from `Powered by TJ Group`;
- print and PDF output preserve paper settings without clipped Lao text;
- overflow is detected before export;
- multi-page behavior is usable;
- desktop and mobile layouts are both operable;
- the production build does not require a backend service.
