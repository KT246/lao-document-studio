"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type TemplateId = "cooperation" | "debt-note" | "quotation";
type AssetKey = "logo" | "signature" | "stamp";
type TemplateCategory = "cooperation" | "finance" | "sales";
type CategoryFilter = "all" | TemplateCategory;
type StatusFilter = "all" | "edited" | "blank";
type LaoFontId = "noto-sans-lao" | "noto-sans-lao-looped" | "noto-serif-lao" | "phetsarath-ot";
type EnglishFontId = "inter" | "noto-sans" | "lora" | "ibm-plex-sans";

type TemplateDefinition = {
  id: TemplateId;
  laoName: string;
  description: string;
  code: string;
  category: TemplateCategory;
  fileName: string;
};

type DocumentDraft = {
  fields: Record<string, string>;
  removedFields: string[];
  assets: Partial<Record<AssetKey, string>>;
  settings: {
    logoWidth: number;
    laoFont: LaoFontId;
    englishFont: EnglishFontId;
    showNationalEmblem: boolean;
  };
};

type EditorContext = {
  draft: DocumentDraft;
  editing: boolean;
  onFieldChange: (field: string, html: string, text: string) => void;
  onRemoveField: (field: string) => void;
  onRestoreField: (field: string) => void;
  onPageCountChange: (pageCount: number) => void;
};

const STORAGE_KEY = "lao-document-studio.v1";
const DEFAULT_ISSUED_BY = "<strong>ອອກໃຫ້ໂດຍ:</strong> TJ Group";
const LEGACY_ISSUED_BY = `${DEFAULT_ISSUED_BY}<br><strong>Issued by:</strong> TJ Group`;

const TEMPLATE_CATEGORIES: Array<{ id: TemplateCategory; label: string }> = [
  { id: "cooperation", label: "ການຮ່ວມມື" },
  { id: "finance", label: "ການເງິນ" },
  { id: "sales", label: "ການຂາຍ" }
];

const LAO_FONTS: Array<{ id: LaoFontId; label: string; css: string }> = [
  { id: "noto-sans-lao", label: "Noto Sans Lao", css: '"Noto Sans Lao"' },
  { id: "noto-sans-lao-looped", label: "Noto Sans Lao Looped", css: '"Noto Sans Lao Looped", "Noto Sans Lao"' },
  { id: "noto-serif-lao", label: "Noto Serif Lao", css: '"Noto Serif Lao", "Noto Sans Lao"' },
  { id: "phetsarath-ot", label: "Phetsarath OT", css: '"Phetsarath OT", "Noto Sans Lao"' }
];

const ENGLISH_FONTS: Array<{ id: EnglishFontId; label: string; css: string }> = [
  { id: "inter", label: "Inter", css: '"Inter"' },
  { id: "noto-sans", label: "Noto Sans", css: '"Noto Sans"' },
  { id: "lora", label: "Lora", css: '"Lora"' },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", css: '"IBM Plex Sans"' }
];

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "cooperation",
    laoName: "ໃບສະເໜີຂໍຮ່ວມມືທາງທຸລະກິດ",
    description: "ເຊື່ອມຕໍ່ການຊຳລະຜ່ານ Unitel ເບີຂຶ້ນຕົ້ນ 9.",
    code: "COOP",
    category: "cooperation",
    fileName: "Unitel_Business_Cooperation_Proposal.pdf"
  },
  {
    id: "debt-note",
    laoName: "ໃບແຈ້ງໜີ້",
    description: "ແຈ້ງລາຍການໜີ້, ສາເຫດ ແລະ ກຳນົດຊຳລະ.",
    code: "DEBT",
    category: "finance",
    fileName: "Lao_Debit_Note.pdf"
  },
  {
    id: "quotation",
    laoName: "ໃບສະເໜີລາຄາ",
    description: "ສະເໜີລາຄາສິນຄ້າ, ບໍລິການ ແລະ ເງື່ອນໄຂ.",
    code: "QUOTE",
    category: "sales",
    fileName: "Lao_Quotation.pdf"
  }
];

function createDraft(): DocumentDraft {
  return {
    fields: {},
    removedFields: [],
    assets: {},
    settings: {
      logoWidth: 92,
      laoFont: "noto-sans-lao",
      englishFont: "inter",
      showNationalEmblem: false
    }
  };
}

function createDraftCollection(): Record<TemplateId, DocumentDraft> {
  return {
    cooperation: createDraft(),
    "debt-note": createDraft(),
    quotation: createDraft()
  };
}

function hasDraftChanges(draft: DocumentDraft) {
  return Object.keys(draft.fields).length > 0
    || draft.removedFields.length > 0
    || Object.values(draft.assets).some(Boolean)
    || draft.settings.logoWidth !== 92
    || draft.settings.laoFont !== "noto-sans-lao"
    || draft.settings.englishFont !== "inter"
    || draft.settings.showNationalEmblem;
}

type EditableTextProps = {
  ctx: EditorContext;
  field: string;
  html: string;
  as?: React.ElementType;
  className?: string;
  placeholder?: string;
};

function EditableText({
  ctx,
  field,
  html,
  as: Tag = "span",
  className = "",
  placeholder = "ພິມເນື້ອຫາ..."
}: EditableTextProps) {
  const value = ctx.draft.fields[field] ?? html;
  const removed = ctx.draft.removedFields.includes(field);
  const isBlock = typeof Tag === "string" && ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(Tag);
  const Shell = isBlock ? "div" : "span";
  const editableValueRef = useRef<HTMLSpanElement>(null);
  const initialValueRef = useRef(value);

  useLayoutEffect(() => {
    const element = editableValueRef.current;
    if (!element || removed) return;
    const activeElement = document.activeElement;
    if (activeElement === element || (activeElement && element.contains(activeElement))) return;
    if (element.innerHTML !== value) element.innerHTML = value;
  }, [removed, value]);

  if (removed && !ctx.editing) return null;

  return (
    <Shell className={`editable-shell ${isBlock ? "is-block" : "is-inline"} ${removed ? "is-removed" : ""}`.trim()}>
      {removed ? (
        <button
          type="button"
          className="editable-field-restore"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => ctx.onRestoreField(field)}
        >
          ＋ ເພີ່ມຄືນ
        </button>
      ) : (
        <Tag className={`editable ${className}`.trim()}>
          <span
            ref={editableValueRef}
            className="editable-value"
            contentEditable={ctx.editing}
            data-field={field}
            data-placeholder={placeholder}
            suppressContentEditableWarning
            spellCheck={false}
            onInput={(event: React.FormEvent<HTMLSpanElement>) => {
              const element = event.currentTarget;
              ctx.onFieldChange(field, element.innerHTML, element.textContent ?? "");
            }}
            dangerouslySetInnerHTML={{ __html: initialValueRef.current }}
          />
          {ctx.editing ? (
            <button
              type="button"
              className="editable-field-remove"
              aria-label="ລຶບຂໍ້ຄວາມສ່ວນນີ້"
              title="ລຶບຂໍ້ຄວາມສ່ວນນີ້"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => ctx.onRemoveField(field)}
            >
              ×
            </button>
          ) : null}
        </Tag>
      )}
    </Shell>
  );
}

function Paper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className="paper" aria-label={label}>
      <div className="paper-content">{children}</div>
    </section>
  );
}

function PaginatedDocument({
  children,
  label,
  onPageCountChange
}: {
  children: React.ReactNode;
  label: string;
  onPageCountChange: (pageCount: number) => void;
}) {
  const blocks = React.Children.toArray(children);
  const blockRefs = useRef(new Map<number, HTMLDivElement>());
  const paginationFrameRef = useRef<number | null>(null);
  const [pages, setPages] = useState<number[][]>(() => [blocks.map((_, index) => index)]);

  const paginate = useCallback(() => {
    const firstBlock = blockRefs.current.get(0);
    const contentRoot = firstBlock?.closest<HTMLElement>(".paper-content");
    const availableHeight = contentRoot?.clientHeight ?? 0;
    if (!availableHeight || blocks.length === 0) return;

    const nextPages: number[][] = [];
    let currentPage: number[] = [];
    let usedHeight = 0;

    blocks.forEach((_, index) => {
      const element = blockRefs.current.get(index);
      if (!element) return;
      const blockHeight = element.getBoundingClientRect().height;
      if (currentPage.length > 0 && usedHeight + blockHeight > availableHeight + 0.5) {
        nextPages.push(currentPage);
        currentPage = [];
        usedHeight = 0;
      }
      currentPage.push(index);
      usedHeight += blockHeight;
    });

    if (currentPage.length > 0) nextPages.push(currentPage);
    if (nextPages.length === 0) nextPages.push([]);

    setPages((currentPages) => {
      const currentSignature = currentPages.map((page) => page.join(",")).join("|");
      const nextSignature = nextPages.map((page) => page.join(",")).join("|");
      return currentSignature === nextSignature ? currentPages : nextPages;
    });
  }, [blocks.length]);

  const schedulePagination = useCallback(() => {
    if (paginationFrameRef.current !== null) cancelAnimationFrame(paginationFrameRef.current);
    paginationFrameRef.current = requestAnimationFrame(() => {
      paginationFrameRef.current = null;
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement.isContentEditable) return;
      paginate();
    });
  }, [paginate]);

  useEffect(() => {
    setPages([blocks.map((_, index) => index)]);
  }, [blocks.length]);

  useEffect(() => {
    onPageCountChange(pages.length);
  }, [onPageCountChange, pages.length]);

  useLayoutEffect(() => {
    schedulePagination();
    const observer = new ResizeObserver(schedulePagination);
    blockRefs.current.forEach((element) => observer.observe(element));
    void document.fonts?.ready.then(schedulePagination);
    return () => {
      observer.disconnect();
      if (paginationFrameRef.current !== null) cancelAnimationFrame(paginationFrameRef.current);
    };
  });

  return (
    <div className="auto-paginated-document" onBlurCapture={() => window.setTimeout(schedulePagination, 0)}>
      {pages.map((page, pageIndex) => (
        <Paper key={pageIndex} label={`${label} — ໜ້າ ${pageIndex + 1}`}>
          {page.map((blockIndex) => {
            const block = blocks[blockIndex];
            const blockKey = React.isValidElement(block) && block.key !== null ? block.key : blockIndex;
            return (
              <div
                className="auto-page-block"
                key={blockKey}
                ref={(element) => {
                  if (element) blockRefs.current.set(blockIndex, element);
                  else blockRefs.current.delete(blockIndex);
                }}
              >
                {block}
              </div>
            );
          })}
        </Paper>
      ))}
    </div>
  );
}

function NationalHeader({ ctx }: { ctx: EditorContext }) {
  return (
    <header className="national-header keep-together">
      {ctx.draft.settings.showNationalEmblem ? (
        <img
          className="national-emblem"
          src="/lao-national-emblem.png"
          alt="ເຄື່ອງໝາຍຊາດ ສປປ ລາວ"
        />
      ) : null}
      <EditableText
        ctx={ctx}
        field="nationalTitle"
        html="ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ"
        as="div"
        className="national-title"
      />
      <EditableText
        ctx={ctx}
        field="nationalMotto"
        html="ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ"
        as="div"
        className="national-motto"
      />
      <EditableText
        ctx={ctx}
        field="nationalDivider"
        html="──────────── ວ ວ ────────────"
        as="div"
        className="national-divider"
      />
    </header>
  );
}

function CompanyHeader({ ctx, compact = false }: { ctx: EditorContext; compact?: boolean }) {
  const logo = ctx.draft.assets.logo;
  return (
    <section className={`company-header keep-together ${compact ? "is-compact" : ""}`}>
      <div className="company-side">
        <div className="document-logo" style={{ width: `${ctx.draft.settings.logoWidth}px` }}>
          {logo ? <img src={logo} alt="Logo ບໍລິສັດ" /> : <span>Logo</span>}
        </div>
        <div className="company-copy">
          <EditableText ctx={ctx} field="companyName" html="[ຊື່ບໍລິສັດ]" as="div" className="company-name" />
          <div><EditableText ctx={ctx} field="companyAddressLabel" html="<strong>ທີ່ຢູ່:</strong>" /> <EditableText ctx={ctx} field="companyAddress" html="[ທີ່ຢູ່ບໍລິສັດ]" /></div>
          <div><EditableText ctx={ctx} field="companyPhoneLabel" html="<strong>ໂທ:</strong>" /> <EditableText ctx={ctx} field="companyPhone" html="020 ............" /></div>
          <div><EditableText ctx={ctx} field="companyEmailLabel" html="<strong>ອີເມວ:</strong>" /> <EditableText ctx={ctx} field="companyEmail" html="email@company.com" /></div>
          <div><EditableText ctx={ctx} field="companyTaxLabel" html="<strong>ເລກອາກອນ:</strong>" /> <EditableText ctx={ctx} field="companyTax" html="................" /></div>
        </div>
      </div>
      <div className="document-meta">
        <div><EditableText ctx={ctx} field="documentNumberLabel" html="<strong>ເລກທີ:</strong>" /> <EditableText ctx={ctx} field="documentNumber" html="...../....." className="line-value" /></div>
        <div><EditableText ctx={ctx} field="documentPlaceLabel" html="<strong>ສະຖານທີ່:</strong>" /> <EditableText ctx={ctx} field="documentPlace" html="ນະຄອນຫຼວງວຽງຈັນ" className="line-value" /></div>
        <div><EditableText ctx={ctx} field="documentDateLabel" html="<strong>ວັນທີ:</strong>" /> <EditableText ctx={ctx} field="documentDate" html="20/07/2026" className="line-value" /></div>
        <EditableText
          ctx={ctx}
          field="issuedBy"
          html={DEFAULT_ISSUED_BY}
          as="div"
          className="issued-by-field"
        />
      </div>
    </section>
  );
}

function DocumentTitle({ ctx, title, subtitle }: { ctx: EditorContext; title: string; subtitle?: string }) {
  return (
    <section className="document-title keep-together">
      <EditableText ctx={ctx} field="documentTitle" html={title} as="h1" />
      {subtitle ? <EditableText ctx={ctx} field="documentSubtitle" html={subtitle} as="p" className="document-subtitle" /> : null}
    </section>
  );
}

function SignatureBlock({ ctx }: { ctx: EditorContext }) {
  return (
    <section className="signature-block keep-together">
      <EditableText ctx={ctx} field="signatureRole" html="ຜູ້ອຳນວຍການ" as="div" className="signature-role" />
      <div className="signature-media">
        <div className="signature-seal-composite">
          <div className="signature-layer">
            {ctx.draft.assets.signature ? (
              <img src={ctx.draft.assets.signature} alt="ລາຍເຊັນ" />
            ) : (
              <span className="edit-hint signature-hint">ລາຍເຊັນ</span>
            )}
          </div>
          <div className={`stamp-layer ${ctx.draft.assets.stamp ? "has-stamp" : ""}`.trim()}>
            {ctx.draft.assets.stamp ? (
              <img src={ctx.draft.assets.stamp} alt="ກາປະທັບ" />
            ) : (
              <span className="edit-hint stamp-hint">ກາປະທັບ</span>
            )}
          </div>
        </div>
      </div>
      <EditableText ctx={ctx} field="signerName" html="[ຊື່ ແລະ ນາມສະກຸນ]" as="div" className="signature-name line-value" />
      <EditableText ctx={ctx} field="signerPosition" html="[ຕຳແໜ່ງ]" as="div" className="signature-position" />
    </section>
  );
}

function CooperationTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <PaginatedDocument label="ໃບສະເໜີຮ່ວມມື" onPageCountChange={ctx.onPageCountChange}>
        <NationalHeader ctx={ctx} />
        <CompanyHeader ctx={ctx} />
        <DocumentTitle
          ctx={ctx}
          title="ໃບສະເໜີຂໍຮ່ວມມືທາງທຸລະກິດ"
        />
        <EditableText
          ctx={ctx}
          field="recipient"
          html="<strong>ຮຽນ:</strong><br>ທ່ານ ຜູ້ອຳນວຍການໃຫຍ່<br>ບໍລິສັດ ສະຕາ ໂທລະຄົມ ຈຳກັດ<br>Star Telecom Co., Ltd. – Unitel"
          as="div"
          className="recipient"
        />
        <EditableText
          ctx={ctx}
          field="documentSubtitle"
          html="<strong>ເລື່ອງ:</strong> ຂໍຮ່ວມມືເຊື່ອມຕໍ່ລະບົບຮັບຊຳລະເງິນຜ່ານມູນຄ່າໂທ Unitel ເບີຫຼັກ 9"
          as="p"
          className="formal-subject"
        />
        <EditableText ctx={ctx} field="basisHeading" html="ອີງຕາມ:" as="h2" className="section-heading" />
        <EditableText ctx={ctx} field="basis1" html="– ອີງຕາມ ໃບທະບຽນວິສາຫະກິດ ເລກທີ ............ ລົງວັນທີ ............;" as="p" />
        <EditableText ctx={ctx} field="basis2" html="– ອີງຕາມ ໃບອະນຸຍາດດຳເນີນທຸລະກິດ ເລກທີ ............ ລົງວັນທີ ............; (ຖ້າມີ)" as="p" />
        <EditableText ctx={ctx} field="basis3" html="– ອີງຕາມ ຄວາມຕ້ອງການຂະຫຍາຍຊ່ອງທາງການຊຳລະເງິນຜ່ານລະບົບດິຈິຕອນ." as="p" />
        <EditableText ctx={ctx} field="introHeading" html="1. ຂໍ້ມູນແນະນຳບໍລິສັດ" as="h2" className="section-heading" />
        <EditableText
          ctx={ctx}
          field="companyIntro1"
          html="ບໍລິສັດ [ຊື່ບໍລິສັດ] ເປັນຜູ້ດຳເນີນທຸລະກິດຈຳໜ່າຍສິນຄ້າດິຈິຕອນ ແລະ ບໍລິການເຕີມເກມອອນລາຍ ຜ່ານເວັບໄຊ [ຊື່ເວັບໄຊ] ທີ່ຢູ່ [https://.................................]."
          as="p"
        />
        <EditableText
          ctx={ctx}
          field="companyIntro2"
          html="ລະບົບຂອງບໍລິສັດອະນຸຍາດໃຫ້ລູກຄ້າເຕີມເຄຣດິດເຂົ້າບັນຊີພາຍໃນເວັບໄຊ ແລະ ນຳເຄຣດິດໄປຊື້ເກມ, ແພັກເກດ, ສິນຄ້າ ແລະ ບໍລິການດິຈິຕອນພາຍໃນລະບົບ."
          as="p"
        />
        <EditableText ctx={ctx} field="proposalHeading" html="2. ຂໍ້ສະເໜີຮ່ວມມື" as="h2" className="section-heading top-heading" />
        <EditableText
          ctx={ctx}
          field="cooperationProposal"
          html="ດັ່ງນັ້ນ, ບໍລິສັດຈຶ່ງຂໍສະເໜີຮ່ວມມືກັບບໍລິສັດ ສະຕາ ໂທລະຄົມ ຈຳກັດ ເພື່ອເຊື່ອມຕໍ່ລະບົບຮັບຊຳລະເງິນຜ່ານມູນຄ່າໂທ Unitel ເບີຫຼັກ 9 ເຂົ້າກັບເວັບໄຊຂອງບໍລິສັດ."
          as="p"
        />
        <EditableText ctx={ctx} field="revenueHeading" html="3. ຂໍ້ສະເໜີອັດຕາແບ່ງປັນລາຍຮັບ" as="h2" className="section-heading" />
        <div className="form-grid keep-together">
          <div><EditableText ctx={ctx} field="unitelRateLabel" html="ອັດຕາທີ່ສະເໜີໃຫ້ Unitel" /><span className="form-value"><EditableText ctx={ctx} field="unitelRate" html="25" /><EditableText ctx={ctx} field="unitelRateUnit" html="%" /></span></div>
          <div><EditableText ctx={ctx} field="companyRateLabel" html="ອັດຕາທີ່ບໍລິສັດໄດ້ຮັບ" /><span className="form-value"><EditableText ctx={ctx} field="companyRate" html="75" /><EditableText ctx={ctx} field="companyRateUnit" html="%" /></span></div>
          <div><EditableText ctx={ctx} field="dailySalesLabel" html="ຍອດທຸລະກຳຄາດຄະເນຕໍ່ມື້" /><EditableText ctx={ctx} field="dailySales" html="........ LAK" className="form-value" /></div>
          <div><EditableText ctx={ctx} field="monthlySalesLabel" html="ຍອດທຸລະກຳຄາດຄະເນຕໍ່ເດືອນ" /><EditableText ctx={ctx} field="monthlySales" html="........ LAK" className="form-value" /></div>
          <div><EditableText ctx={ctx} field="settlementLabel" html="ຮອບການຊຳລະຍອດທີ່ຕ້ອງການ" /><EditableText ctx={ctx} field="settlement" html="T+1" className="form-value" /></div>
          <div><EditableText ctx={ctx} field="negotiationNoteLabel" html="ບັນທຶກການເຈລະຈາ" /><EditableText ctx={ctx} field="negotiationNote" html="................................" className="form-value" /></div>
        </div>
        <EditableText
          ctx={ctx}
          field="revenueNarrative"
          html="ທາງບໍລິສັດຂໍສະເໜີອັດຕາແບ່ງປັນລາຍຮັບໃຫ້ທາງ Unitel ໃນອັດຕາ [25]% ຂອງມູນຄ່າທຸລະກຳທີ່ສຳເລັດ ແລະ ບໍລິສັດໄດ້ຮັບຍອດສຸດທິ [75]%."
          as="p"
        />
        <EditableText
          ctx={ctx}
          field="revenueNegotiable"
          html="ອັດຕາດັ່ງກ່າວສາມາດເຈລະຈາ ແລະ ປັບປ່ຽນໄດ້ຕາມປະລິມານທຸລະກຳ, ເງື່ອນໄຂທາງດ້ານເຕັກນິກ ແລະ ຂໍ້ຕົກລົງຂອງທັງສອງຝ່າຍ."
          as="p"
        />
        <EditableText ctx={ctx} field="unitelInfoHeading" html="4. ຂໍ້ມູນທີ່ຂໍໃຫ້ Unitel ສະໜອງ" as="h2" className="section-heading" />
        <div className="numbered-list">
          {[
            "ເງື່ອນໄຂການເຊື່ອມຕໍ່ API;",
            "API Document ແລະ ລະບົບ Sandbox;",
            "ອັດຕາຄ່າທຳນຽມ ແລະ ພາສີ;",
            "ໄລຍະເວລາສະສາງຍອດເງິນ;",
            "ເງື່ອນໄຂການຄືນເງິນ;",
            "ການຈັດການທຸລະກຳຜິດປົກກະຕິ;",
            "ເອກະສານ ແລະ ໃບອະນຸຍາດທີ່ຕ້ອງຈັດຫາເພີ່ມເຕີມ;",
            "ການຢືນຢັນວ່າອັດຕາສ່ວນແບ່ງລວມຄ່າ API, OTP, SMS, ພາສີ ແລະ ຄ່າບໍລິການອື່ນແລ້ວຫຼືບໍ່."
          ].map((item, index) => (
            <div className="numbered-list-item" key={index}>
              <EditableText ctx={ctx} field={`unitelInfoNumber${index + 1}`} html={`${index + 1}.`} className="list-number" />
              <EditableText ctx={ctx} field={`unitelInfo${index + 1}`} html={item} />
            </div>
          ))}
        </div>
        <EditableText ctx={ctx} field="conclusionHeading" html="5. ສະຫຼຸບ" as="h2" className="section-heading top-heading" />
        <EditableText ctx={ctx} field="conclusion1" html="ດັ່ງນັ້ນ, ຈຶ່ງຮຽນສະເໜີມາຍັງທ່ານ ເພື່ອຄົ້ນຄວ້າ ແລະ ພິຈາລະນາຕາມເຫັນສົມຄວນດ້ວຍ." as="p" />
        <EditableText ctx={ctx} field="conclusion2" html="ຮຽນມາດ້ວຍຄວາມເຄົາລົບຢ່າງສູງ." as="p" />
        <SignatureBlock ctx={ctx} />
        <EditableText ctx={ctx} field="attachmentsHeading" html="ເອກະສານຄັດຕິດ:" as="h2" className="section-heading" />
        <div className="numbered-list attachments-list">
          {[
            "ສຳເນົາໃບທະບຽນວິສາຫະກິດ;",
            "ສຳເນົາໃບອະນຸຍາດດຳເນີນທຸລະກິດ (ຖ້າມີ);",
            "ສຳເນົາໃບທະບຽນອາກອນ;",
            "ສຳເນົາບັດປະຈຳຕົວຂອງຜູ້ອຳນວຍການ;",
            "ເອກະສານແນະນຳບໍລິສັດ;",
            "ຮູບພາບ ແລະ Link ຂອງເວັບໄຊ;",
            "ແຜນວາດຂັ້ນຕອນການຊຳລະເງິນ."
          ].map((item, index) => (
            <div className="numbered-list-item" key={index}>
              <EditableText ctx={ctx} field={`attachmentNumber${index + 1}`} html={`${index + 1}.`} className="list-number" />
              <EditableText ctx={ctx} field={`attachment${index + 1}`} html={item} />
            </div>
          ))}
        </div>
    </PaginatedDocument>
  );
}

function DebtNoteTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <PaginatedDocument label="ໃບແຈ້ງໜີ້" onPageCountChange={ctx.onPageCountChange}>
      <NationalHeader ctx={ctx} />
      <CompanyHeader ctx={ctx} compact />
      <DocumentTitle ctx={ctx} title="ໃບແຈ້ງໜີ້" subtitle="DEBIT NOTE" />
      <div className="two-column-details keep-together">
        <div>
          <EditableText ctx={ctx} field="debtorHeading" html="ຜູ້ຮັບແຈ້ງ / Bên nhận" as="h2" />
          <EditableText ctx={ctx} field="debtorName" html="[ຊື່ລູກຄ້າ / Tên khách hàng]" as="div" className="detail-strong" />
          <EditableText ctx={ctx} field="debtorAddress" html="[ທີ່ຢູ່ / Địa chỉ]" as="div" />
          <div><EditableText ctx={ctx} field="debtorTaxLabel" html="<strong>ເລກອາກອນ:</strong>" /> <EditableText ctx={ctx} field="debtorTax" html="................" /></div>
        </div>
        <div>
          <EditableText ctx={ctx} field="debtInfoHeading" html="ຂໍ້ມູນເອກະສານ" as="h2" />
          <div><EditableText ctx={ctx} field="debtReferenceLabel" html="<strong>ອ້າງອີງ:</strong>" /> <EditableText ctx={ctx} field="debtReference" html="INV-........" className="line-value" /></div>
          <div><EditableText ctx={ctx} field="dueDateLabel" html="<strong>ກຳນົດຊຳລະ:</strong>" /> <EditableText ctx={ctx} field="dueDate" html="..../..../......" className="line-value" /></div>
          <div><EditableText ctx={ctx} field="currencyLabel" html="<strong>ສະກຸນເງິນ:</strong>" /> <EditableText ctx={ctx} field="currency" html="LAK" className="line-value" /></div>
        </div>
      </div>
      <table className="document-table debit-table">
        <thead><tr><th><EditableText ctx={ctx} field="debtColumnNumber" html="ລ/ດ" /></th><th><EditableText ctx={ctx} field="debtColumnDescription" html="ລາຍລະອຽດ / Diễn giải" /></th><th><EditableText ctx={ctx} field="debtColumnAmount" html="ຈຳນວນເງິນ" /></th></tr></thead>
        <tbody>
          {[1, 2, 3].map((row) => (
            <tr key={row}>
              <td><EditableText ctx={ctx} field={`debtRowNumber${row}`} html={String(row)} /></td>
              <td><EditableText ctx={ctx} field={`debtDescription${row}`} html={row === 1 ? "ຄ່າບໍລິການ / Khoản ghi nợ" : "................................"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`debtAmount${row}`} html={row === 1 ? "0" : "-"} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th colSpan={2}><EditableText ctx={ctx} field="debtTotalLabel" html="ຍອດລວມທີ່ຕ້ອງຊຳລະ / Tổng tiền phải trả" /></th><th className="amount"><EditableText ctx={ctx} field="debtTotal" html="0 LAK" /></th></tr>
        </tfoot>
      </table>
      <section className="note-box">
        <EditableText ctx={ctx} field="debtReasonHeading" html="ເຫດຜົນການອອກໃບແຈ້ງໜີ້ / Lý do ghi nợ" as="h2" />
        <EditableText ctx={ctx} field="debtReason" html="[ລາຍລະອຽດເຫດຜົນ / Nội dung phát sinh khoản nợ]" as="p" />
      </section>
      <section className="payment-box keep-together">
        <EditableText ctx={ctx} field="paymentInfoHeading" html="ຂໍ້ມູນການຊຳລະ / Thông tin thanh toán" as="h2" />
        <div><EditableText ctx={ctx} field="bankNameLabel" html="<strong>ທະນາຄານ:</strong>" /> <EditableText ctx={ctx} field="bankName" html="[ຊື່ທະນາຄານ]" /></div>
        <div><EditableText ctx={ctx} field="bankAccountLabel" html="<strong>ເລກບັນຊີ:</strong>" /> <EditableText ctx={ctx} field="bankAccount" html="[ເລກບັນຊີ]" /></div>
        <div><EditableText ctx={ctx} field="accountNameLabel" html="<strong>ຊື່ບັນຊີ:</strong>" /> <EditableText ctx={ctx} field="accountName" html="[ຊື່ບັນຊີ]" /></div>
      </section>
      <SignatureBlock ctx={ctx} />
    </PaginatedDocument>
  );
}

function QuotationTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <PaginatedDocument label="ໃບສະເໜີລາຄາ" onPageCountChange={ctx.onPageCountChange}>
      <NationalHeader ctx={ctx} />
      <CompanyHeader ctx={ctx} compact />
      <DocumentTitle ctx={ctx} title="ໃບສະເໜີລາຄາ" subtitle="QUOTATION" />
      <div className="two-column-details keep-together">
        <div>
          <EditableText ctx={ctx} field="quoteRecipientHeading" html="ຮຽນ / Kính gửi" as="h2" />
          <EditableText ctx={ctx} field="customerName" html="[ຊື່ລູກຄ້າ / Tên khách hàng]" as="div" className="detail-strong" />
          <EditableText ctx={ctx} field="customerAddress" html="[ທີ່ຢູ່ / Địa chỉ]" as="div" />
        </div>
        <div>
          <EditableText ctx={ctx} field="quoteInfoHeading" html="ຂໍ້ມູນໃບສະເໜີ" as="h2" />
          <div><EditableText ctx={ctx} field="quoteNumberLabel" html="<strong>ເລກທີ:</strong>" /> <EditableText ctx={ctx} field="quoteNumber" html="QT-2026-001" className="line-value" /></div>
          <div><EditableText ctx={ctx} field="quoteValidUntilLabel" html="<strong>ມີຜົນເຖິງ:</strong>" /> <EditableText ctx={ctx} field="quoteValidUntil" html="..../..../......" className="line-value" /></div>
        </div>
      </div>
      <EditableText ctx={ctx} field="quoteIntro" html="ບໍລິສັດຂໍສະເໜີລາຄາສິນຄ້າ ແລະ ບໍລິການດັ່ງຕໍ່ໄປນີ້:" as="p" />
      <table className="document-table quote-table">
        <thead><tr><th><EditableText ctx={ctx} field="quoteColumnNumber" html="ລ/ດ" /></th><th><EditableText ctx={ctx} field="quoteColumnItem" html="ລາຍການ" /></th><th><EditableText ctx={ctx} field="quoteColumnQuantity" html="ຈຳນວນ" /></th><th><EditableText ctx={ctx} field="quoteColumnUnitPrice" html="ລາຄາ/ໜ່ວຍ" /></th><th><EditableText ctx={ctx} field="quoteColumnTotal" html="ລວມ" /></th></tr></thead>
        <tbody>
          {[1, 2, 3, 4].map((row) => (
            <tr key={row}>
              <td><EditableText ctx={ctx} field={`quoteRowNumber${row}`} html={String(row)} /></td>
              <td><EditableText ctx={ctx} field={`quoteItem${row}`} html={row === 1 ? "[ຊື່ສິນຄ້າ / ບໍລິການ]" : "................................"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quoteQty${row}`} html={row === 1 ? "1" : "-"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quotePrice${row}`} html={row === 1 ? "0" : "-"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quoteLineTotal${row}`} html={row === 1 ? "0" : "-"} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th colSpan={4}><EditableText ctx={ctx} field="quoteSubtotalLabel" html="ລວມກ່ອນອາກອນ" /></th><th className="amount"><EditableText ctx={ctx} field="quoteSubtotal" html="0" /></th></tr>
          <tr><th colSpan={4}><EditableText ctx={ctx} field="quoteTaxLabel" html="ອາກອນ / VAT" /></th><th className="amount"><EditableText ctx={ctx} field="quoteTax" html="0" /></th></tr>
          <tr className="grand-total"><th colSpan={4}><EditableText ctx={ctx} field="quoteTotalLabel" html="ຍອດລວມທັງໝົດ" /></th><th className="amount"><EditableText ctx={ctx} field="quoteTotal" html="0 LAK" /></th></tr>
        </tfoot>
      </table>
      <section className="terms-box keep-together">
        <EditableText ctx={ctx} field="termsHeading" html="ເງື່ອນໄຂ / Điều kiện" as="h2" />
        <EditableText ctx={ctx} field="paymentTerms" html="1. <strong>ການຊຳລະ:</strong> ຊຳລະ 50% ລ່ວງໜ້າ" as="div" />
        <EditableText ctx={ctx} field="deliveryTerms" html="2. <strong>ການສົ່ງມອບ:</strong> ພາຍໃນ .... ວັນ" as="div" />
        <EditableText ctx={ctx} field="validityTerms" html="3. <strong>ອາຍຸໃບສະເໜີ:</strong> 30 ວັນ" as="div" />
        <EditableText ctx={ctx} field="quoteNote" html="4. <strong>ໝາຍເຫດ:</strong> ................................" as="div" />
      </section>
      <SignatureBlock ctx={ctx} />
    </PaginatedDocument>
  );
}

function TemplateCanvas({ templateId, ctx }: { templateId: TemplateId; ctx: EditorContext }) {
  if (templateId === "debt-note") return <DebtNoteTemplate ctx={ctx} />;
  if (templateId === "quotation") return <QuotationTemplate ctx={ctx} />;
  return <CooperationTemplate ctx={ctx} />;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

type PreparedOverlayAsset = {
  dataUrl: string;
  status: "already-transparent" | "background-removed" | "original-preserved";
};

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode image"));
    image.src = dataUrl;
  });
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function colorDistance(red: number, green: number, blue: number, background: [number, number, number]) {
  const redDistance = red - background[0];
  const greenDistance = green - background[1];
  const blueDistance = blue - background[2];
  return Math.sqrt((0.3 * redDistance ** 2) + (0.59 * greenDistance ** 2) + (0.11 * blueDistance ** 2));
}

async function prepareOverlayAsset(dataUrl: string): Promise<PreparedOverlayAsset> {
  try {
    const image = await loadImage(dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) return { dataUrl, status: "original-preserved" };

    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return { dataUrl, status: "original-preserved" };
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const pixelCount = width * height;
    let transparentPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 245) transparentPixels += 1;
    }

    if (transparentPixels / pixelCount >= 0.002) {
      return { dataUrl, status: "already-transparent" };
    }

    const edgeDepth = Math.max(1, Math.round(Math.min(width, height) * 0.015));
    const stride = Math.max(1, Math.floor(Math.max(width, height) / 320));
    const edgeRed: number[] = [];
    const edgeGreen: number[] = [];
    const edgeBlue: number[] = [];
    const addPixel = (x: number, y: number) => {
      const index = ((y * width) + x) * 4;
      if (pixels[index + 3] < 245) return;
      edgeRed.push(pixels[index]);
      edgeGreen.push(pixels[index + 1]);
      edgeBlue.push(pixels[index + 2]);
    };

    for (let y = 0; y < edgeDepth; y += stride) {
      for (let x = 0; x < width; x += stride) {
        addPixel(x, y);
        addPixel(x, height - 1 - y);
      }
    }
    for (let x = 0; x < edgeDepth; x += stride) {
      for (let y = edgeDepth; y < height - edgeDepth; y += stride) {
        addPixel(x, y);
        addPixel(width - 1 - x, y);
      }
    }

    if (edgeRed.length < 12) return { dataUrl, status: "original-preserved" };
    const background: [number, number, number] = [median(edgeRed), median(edgeGreen), median(edgeBlue)];
    const edgeDistances = edgeRed.map((red, index) => colorDistance(red, edgeGreen[index], edgeBlue[index], background));
    const uniformEdgeRatio = edgeDistances.filter((distance) => distance <= 32).length / edgeDistances.length;
    if (uniformEdgeRatio < 0.72) return { dataUrl, status: "original-preserved" };

    const sortedEdgeDistances = [...edgeDistances].sort((left, right) => left - right);
    const edgeNoise = sortedEdgeDistances[Math.floor(sortedEdgeDistances.length * 0.85)] ?? 0;
    const clearThreshold = Math.min(38, Math.max(12, edgeNoise + 5));
    const featherThreshold = clearThreshold + 48;
    let removedPixels = 0;
    let remainingPixels = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const originalAlpha = pixels[index + 3];
      const distance = colorDistance(pixels[index], pixels[index + 1], pixels[index + 2], background);
      if (distance <= clearThreshold) {
        pixels[index + 3] = 0;
        removedPixels += 1;
      } else if (distance < featherThreshold) {
        const feather = (distance - clearThreshold) / (featherThreshold - clearThreshold);
        pixels[index + 3] = Math.round(originalAlpha * feather);
        removedPixels += 1;
      }
      if (pixels[index + 3] > 16) remainingPixels += 1;
    }

    const remainingRatio = remainingPixels / pixelCount;
    const removedRatio = removedPixels / pixelCount;
    if (remainingRatio < 0.0015 || remainingRatio > 0.72 || removedRatio < 0.05) {
      return { dataUrl, status: "original-preserved" };
    }

    context.putImageData(imageData, 0, 0);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[((y * width) + x) * 4 + 3] <= 16) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return { dataUrl, status: "original-preserved" };
    const padding = Math.max(4, Math.round(Math.max(width, height) * 0.025));
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropRight = Math.min(width, maxX + padding + 1);
    const cropBottom = Math.min(height, maxY + padding + 1);
    const output = document.createElement("canvas");
    output.width = cropRight - cropX;
    output.height = cropBottom - cropY;
    const outputContext = output.getContext("2d");
    if (!outputContext) return { dataUrl, status: "original-preserved" };
    outputContext.drawImage(canvas, cropX, cropY, output.width, output.height, 0, 0, output.width, output.height);

    return { dataUrl: output.toDataURL("image/png"), status: "background-removed" };
  } catch {
    return { dataUrl, status: "original-preserved" };
  }
}

async function waitForDocumentAssets(root: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map(async (image) => {
    if (image.decode) {
      try { await image.decode(); } catch { /* The print fallback can still render the document. */ }
    }
  }));
}

export default function DocumentStudio() {
  const [selectedId, setSelectedId] = useState<TemplateId>("cooperation");
  const [editing, setEditing] = useState(true);
  const [documentPageCount, setDocumentPageCount] = useState(1);
  const [revision, setRevision] = useState(0);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const [downloadConfirmationOpen, setDownloadConfirmationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const draftsRef = useRef<Record<TemplateId, DocumentDraft>>(createDraftCollection());
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAssetRef = useRef<AssetKey>("logo");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const confirmDownloadButtonRef = useRef<HTMLButtonElement>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((template) => template.id === selectedId) ?? TEMPLATES[0],
    [selectedId]
  );
  const draft = draftsRef.current[selectedId];
  const selectedLaoFont = LAO_FONTS.find((font) => font.id === draft.settings.laoFont) ?? LAO_FONTS[0];
  const selectedEnglishFont = ENGLISH_FONTS.find((font) => font.id === draft.settings.englishFont) ?? ENGLISH_FONTS[0];
  const documentFontStyle = {
    "--document-lao-font": selectedLaoFont.css,
    "--document-english-font": selectedEnglishFont.css
  } as React.CSSProperties;

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("lo-LA");
    return TEMPLATES.filter((template) => {
      const categoryLabel = TEMPLATE_CATEGORIES.find((category) => category.id === template.category)?.label ?? "";
      const matchesQuery = !normalizedQuery || [template.laoName, template.description, template.code, categoryLabel]
        .some((value) => value.toLocaleLowerCase("lo-LA").includes(normalizedQuery));
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
      const edited = hasDraftChanges(draftsRef.current[template.id]);
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "edited" ? edited : !edited);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [catalogRevision, categoryFilter, revision, searchQuery, statusFilter]);

  const filtersActive = Boolean(searchQuery)
    || categoryFilter !== "all"
    || statusFilter !== "all";
  const templateOptions = filtersActive
    ? (filteredTemplates.length > 0 ? filteredTemplates : [selectedTemplate])
    : TEMPLATES;

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(""), 3200);
  }, []);

  const writeStorage = useCallback((activeTemplate: TemplateId, notify = false) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        selectedId: activeTemplate,
        drafts: draftsRef.current,
        savedAt: new Date().toISOString()
      }));
      if (statusRef.current) {
        statusRef.current.textContent = `ບັນທຶກແລ້ວ ${new Date().toLocaleTimeString("lo-LA", { hour: "2-digit", minute: "2-digit" })}`;
      }
      if (notify) showToast("ບັນທຶກເອກະສານແລ້ວ");
    } catch {
      if (statusRef.current) statusRef.current.textContent = "ພື້ນທີ່ບັນທຶກເຕັມ";
      showToast("ບໍ່ສາມາດບັນທຶກໄດ້. ກະລຸນາໃຊ້ຮູບທີ່ນ້ອຍກວ່າ.");
    }
  }, [showToast]);

  const scheduleSave = useCallback(() => {
    if (statusRef.current) statusRef.current.textContent = "ກຳລັງບັນທຶກ...";
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      writeStorage(selectedId);
    }, 650);
  }, [selectedId, writeStorage]);

  const handleFieldChange = useCallback((field: string, html: string, text: string) => {
    const activeDraft = draftsRef.current[selectedId];
    activeDraft.fields[field] = html;

    if (selectedId === "cooperation" && field === "unitelRate") {
      const parsed = Number.parseFloat(text.replace(",", ".").replace(/[^0-9.\-]/g, ""));
      if (Number.isFinite(parsed)) {
        const unitel = Math.min(100, Math.max(0, parsed));
        const company = 100 - unitel;
        const companyText = Number.isInteger(company) ? String(company) : company.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
        activeDraft.fields.companyRate = companyText;
        editorRef.current?.querySelectorAll<HTMLElement>("[data-field='companyRate']").forEach((element) => { element.textContent = companyText; });
      }
    }
    scheduleSave();
  }, [scheduleSave, selectedId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          version?: number;
          selectedId?: TemplateId;
          drafts?: Partial<Record<TemplateId, DocumentDraft>>;
        };
        if (parsed.version === 1 && parsed.drafts) {
          const nextDrafts = createDraftCollection();
          TEMPLATES.forEach(({ id }) => {
            const stored = parsed.drafts?.[id];
            if (stored) {
              const storedFields = { ...(stored.fields ?? {}) };
              if (storedFields.issuedBy === LEGACY_ISSUED_BY) storedFields.issuedBy = DEFAULT_ISSUED_BY;
              nextDrafts[id] = {
                fields: storedFields,
                removedFields: Array.isArray(stored.removedFields) ? stored.removedFields : [],
                assets: stored.assets ?? {},
                settings: {
                  logoWidth: stored.settings?.logoWidth ?? 92,
                  laoFont: LAO_FONTS.some((font) => font.id === stored.settings?.laoFont)
                    ? stored.settings?.laoFont ?? "noto-sans-lao"
                    : "noto-sans-lao",
                  englishFont: ENGLISH_FONTS.some((font) => font.id === stored.settings?.englishFont)
                    ? stored.settings?.englishFont ?? "inter"
                    : "inter",
                  showNationalEmblem: stored.settings?.showNationalEmblem ?? false
                }
              };
            }
          });
          draftsRef.current = nextDrafts;
          if (parsed.selectedId && TEMPLATES.some((template) => template.id === parsed.selectedId)) {
            setSelectedId(parsed.selectedId);
          }
          setRevision((value) => value + 1);
          setCatalogRevision((value) => value + 1);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer as Element;
      if (node && editorRef.current.contains(node)) savedRangeRef.current = range.cloneRange();
    };
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!downloadConfirmationOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDownloadConfirmationOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    confirmDownloadButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [downloadConfirmationOpen]);

  const selectTemplate = useCallback((nextId: TemplateId) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    writeStorage(nextId);
    setDocumentPageCount(1);
    setSelectedId(nextId);
    setRevision((value) => value + 1);
  }, [writeStorage]);

  useEffect(() => {
    if (filteredTemplates.length === 0) return;
    if (!filteredTemplates.some((template) => template.id === selectedId)) {
      selectTemplate(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectTemplate, selectedId]);

  const updateLaoFont = (fontId: LaoFontId) => {
    draftsRef.current[selectedId].settings.laoFont = fontId;
    setRevision((value) => value + 1);
    setCatalogRevision((value) => value + 1);
    writeStorage(selectedId);
  };

  const updateEnglishFont = (fontId: EnglishFontId) => {
    draftsRef.current[selectedId].settings.englishFont = fontId;
    setRevision((value) => value + 1);
    setCatalogRevision((value) => value + 1);
    writeStorage(selectedId);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const formatText = (command: string) => {
    if (!editing) {
      setEditing(true);
      showToast("ເປີດໂໝດແກ້ໄຂແລ້ວ");
      return;
    }
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    document.execCommand(command, false);
    scheduleSave();
  };

  const chooseAsset = (asset: AssetKey) => {
    pendingAssetRef.current = asset;
    fileInputRef.current?.click();
  };

  const removeAsset = (asset: AssetKey) => {
    delete draftsRef.current[selectedId].assets[asset];
    setRevision((value) => value + 1);
    writeStorage(selectedId);
    showToast("ລຶບຮູບອອກແລ້ວ");
  };

  const removeField = useCallback((field: string) => {
    const activeDraft = draftsRef.current[selectedId];
    if (!activeDraft.removedFields.includes(field)) activeDraft.removedFields.push(field);
    setRevision((value) => value + 1);
    setCatalogRevision((value) => value + 1);
    writeStorage(selectedId);
    showToast("ລຶບສ່ວນຂໍ້ຄວາມແລ້ວ");
  }, [selectedId, showToast, writeStorage]);

  const restoreField = useCallback((field: string) => {
    const activeDraft = draftsRef.current[selectedId];
    activeDraft.removedFields = activeDraft.removedFields.filter((removedField) => removedField !== field);
    setRevision((value) => value + 1);
    setCatalogRevision((value) => value + 1);
    writeStorage(selectedId);
    showToast("ເພີ່ມສ່ວນຂໍ້ຄວາມຄືນແລ້ວ");
  }, [selectedId, showToast, writeStorage]);

  const uploadAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const asset = pendingAssetRef.current;
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) {
      showToast("ຮັບສະເພາະຮູບ PNG/JPG/WebP/SVG ຕ່ຳກວ່າ 6 MB");
      return;
    }
    try {
      const dataUrl = await readFile(file);
      const prepared = asset === "signature" || asset === "stamp"
        ? await prepareOverlayAsset(dataUrl)
        : { dataUrl, status: "original-preserved" as const };
      draftsRef.current[selectedId].assets[asset] = prepared.dataUrl;
      setRevision((value) => value + 1);
      writeStorage(selectedId);
      if (asset === "logo") {
        showToast("ອັບເດດຮູບແລ້ວ");
      } else if (prepared.status === "already-transparent") {
        showToast("ຮູບມີພື້ນໂປ່ງໃສແລ້ວ — ຮັກສາຮູບເດີມ");
      } else if (prepared.status === "background-removed") {
        showToast("ລຶບພື້ນຫຼັງ ແລະ ອັບເດດຮູບແລ້ວ");
      } else {
        showToast("ບໍ່ພົບພື້ນຫຼັງທີ່ລຶບໄດ້ຢ່າງປອດໄພ — ຮັກສາຮູບເດີມ");
      }
    } catch {
      showToast("ບໍ່ສາມາດອ່ານຮູບນີ້ໄດ້");
    }
  };

  const resetCurrentTemplate = () => {
    if (!window.confirm(`ຄືນຄ່າແບບຟອມ “${selectedTemplate.laoName}” ເປັນເນື້ອຫາເລີ່ມຕົ້ນ?`)) return;
    draftsRef.current[selectedId] = createDraft();
    setRevision((value) => value + 1);
    writeStorage(selectedId);
    showToast("ຄືນຄ່າແບບຟອມແລ້ວ");
  };

  const printDocument = async () => {
    if (!editorRef.current) return;
    document.body.classList.add("exporting-document");
    try {
      await waitForDocumentAssets(editorRef.current);
      window.print();
    } finally {
      document.body.classList.remove("exporting-document");
    }
  };

  const exportPdf = async () => {
    if (!editorRef.current || exporting) return;
    setDownloadConfirmationOpen(false);
    setExporting(true);
    document.body.classList.add("exporting-document");
    try {
      await waitForDocumentAssets(editorRef.current);
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;
      const pdfOptions = {
        margin: 0,
        filename: selectedTemplate.fileName,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"], before: ".paper + .paper" }
      };
      await html2pdf()
        // html2pdf.js 0.14 supports pagebreak at runtime, but its bundled type omits that key.
        .set(pdfOptions as never)
        .from(editorRef.current)
        .save();
      showToast("ດາວໂຫຼດ PDF ສຳເລັດແລ້ວ");
    } catch {
      showToast("ບໍ່ສາມາດສ້າງ PDF, ກຳລັງເປີດໜ້າພິມ");
      window.print();
    } finally {
      document.body.classList.remove("exporting-document");
      setExporting(false);
    }
  };

  const editorContext: EditorContext = {
    draft,
    editing,
    onFieldChange: handleFieldChange,
    onRemoveField: removeField,
    onRestoreField: restoreField,
    onPageCountChange: setDocumentPageCount
  };

  return (
    <main className="studio-shell" data-revision={revision}>
      <header className="studio-header">
        <div className="brand-block">
          <div className="brand-mark">
            <img src="/logo.png" alt="Lao Document Studio Logo" />
          </div>
          <div>
            <strong>Lao Document Studio</strong>
            <span>ເຄື່ອງມືສ້າງ ແກ້ໄຂ ແລະ ຈັດການເອກະສານພາສາລາວ</span>
          </div>
        </div>
        <div className="header-status"><i /> <span ref={statusRef}>ພ້ອມແກ້ໄຂ</span></div>
      </header>

      <section className="studio-toolbar" aria-label="ແຖບເຄື່ອງມື">
        <label className="template-select-label">
          <span>ເອກະສານທີ່ເລືອກ</span>
          <select
            value={selectedId}
            disabled={filtersActive && filteredTemplates.length === 0}
            onChange={(event) => selectTemplate(event.target.value as TemplateId)}
          >
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>{template.laoName}</option>
            ))}
          </select>
        </label>

        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button className={editing ? "active" : ""} onClick={() => setEditing(true)}>✎ ແກ້ໄຂ</button>
          <button className={!editing ? "active" : ""} onClick={() => setEditing(false)}>◉ ເບິ່ງຕົວຢ່າງ</button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group format-tools">
          <button aria-label="ຕົວໜາ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("bold")}><strong>B</strong></button>
          <button aria-label="ຕົວອຽງ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("italic")}><em>I</em></button>
          <button aria-label="ຂີດກ້ອງ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("underline")}><u>U</u></button>
          <button aria-label="ຈັດຊ້າຍ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("justifyLeft")}>≡</button>
          <button aria-label="ຈັດກາງ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("justifyCenter")}>≣</button>
          <button aria-label="ຈັດເຕັມ" onMouseDown={(event) => event.preventDefault()} onClick={() => formatText("justifyFull")}>☰</button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button
            className={draft.settings.showNationalEmblem ? "active" : ""}
            aria-pressed={draft.settings.showNationalEmblem}
            title="ສະແດງ ຫຼື ເຊື່ອງເຄື່ອງໝາຍຊາດໃນເອກະສານນີ້"
            onClick={() => {
              draftsRef.current[selectedId].settings.showNationalEmblem = !draft.settings.showNationalEmblem;
              setRevision((value) => value + 1);
              scheduleSave();
            }}
          >
            ◉ ເຄື່ອງໝາຍຊາດ
          </button>
          <div className="asset-control">
            <button onClick={() => chooseAsset("logo")}>▧ Logo</button>
            {draft.assets.logo ? <button className="remove-asset" aria-label="ລຶບ Logo" title="ລຶບ Logo" onClick={() => removeAsset("logo")}>×</button> : null}
          </div>
          <div className="asset-control">
            <button onClick={() => chooseAsset("stamp")}>◎ ກາປະທັບ</button>
            {draft.assets.stamp ? <button className="remove-asset" aria-label="ລຶບກາປະທັບ" title="ລຶບກາປະທັບ" onClick={() => removeAsset("stamp")}>×</button> : null}
          </div>
          <div className="asset-control">
            <button onClick={() => chooseAsset("signature")}>⌁ ລາຍເຊັນ</button>
            {draft.assets.signature ? <button className="remove-asset" aria-label="ລຶບລາຍເຊັນ" title="ລຶບລາຍເຊັນ" onClick={() => removeAsset("signature")}>×</button> : null}
          </div>
          <label className="logo-size-control">ຂະໜາດ Logo <input type="range" min="56" max="150" value={draft.settings.logoWidth} onChange={(event) => {
            draftsRef.current[selectedId].settings.logoWidth = Number(event.target.value);
            setRevision((value) => value + 1);
            scheduleSave();
          }} /></label>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group toolbar-actions">
          <button onClick={() => writeStorage(selectedId, true)}>▣ ບັນທຶກ</button>
          <button
            className="primary"
            disabled={exporting}
            aria-haspopup="dialog"
            aria-expanded={downloadConfirmationOpen}
            onClick={() => setDownloadConfirmationOpen(true)}
          >
            {exporting ? "⋯ ກຳລັງສ້າງ" : "↓ ດາວໂຫຼດ PDF"}
          </button>
          <button onClick={printDocument}>▤ ພິມ</button>
          <button className="danger" onClick={resetCurrentTemplate}>↺ ຄືນຄ່າ</button>
        </div>
      </section>

      <div className="studio-body">
        <aside className="template-catalog" aria-label="ແບບຟອມເອກະສານ">
          <section className="catalog-filters" aria-label="ຕົວກອງແບບຟອມ">
            <label className="catalog-search">
              <span>ຄົ້ນຫາ</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ຊື່, ລາຍລະອຽດ, ລະຫັດ..."
              />
            </label>
            <div className="filter-grid">
              <label>
                <span>ປະເພດເອກະສານ</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
                  <option value="all">ທັງໝົດ</option>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>ສະຖານະ</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">ທັງໝົດ</option>
                  <option value="edited">ມີການແກ້ໄຂ</option>
                  <option value="blank">ຍັງບໍ່ໄດ້ແກ້ໄຂ</option>
                </select>
              </label>
              <button type="button" className="clear-filters" disabled={!filtersActive} onClick={clearFilters}>↺ ລ້າງຕົວກອງ</button>
            </div>
            {filtersActive && filteredTemplates.length === 0 ? (
              <p className="filter-empty" role="status">ບໍ່ພົບເອກະສານທີ່ກົງກັບຕົວກອງ</p>
            ) : null}
          </section>

          <section className="font-settings" aria-label="Font ເອກະສານ">
            <div className="font-settings-heading">
              <strong>Font ເອກະສານ</strong>
              <span>ກຳນົດແຍກຕາມພາສາ</span>
            </div>
            <label>
              <span>Font ພາສາລາວ</span>
              <select value={draft.settings.laoFont} onChange={(event) => updateLaoFont(event.target.value as LaoFontId)}>
                {LAO_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>English Font</span>
              <select value={draft.settings.englishFont} onChange={(event) => updateEnglishFont(event.target.value as EnglishFontId)}>
                {ENGLISH_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </label>
            <div className="font-preview" style={documentFontStyle}>ຕົວຢ່າງເອກະສານ · English 123</div>
            <p>ລະບົບຈະເລືອກ Font ອັດຕະໂນມັດຕາມຕົວອັກສອນ ແລະ ບໍ່ປ່ຽນ Font ພາສາລາວເມື່ອປ່ຽນ English Font.</p>
          </section>

          <div className="catalog-tip">
            <strong>ແບບຟອມເປັນພຽງຈຸດເລີ່ມຕົ້ນ</strong>
            <p>ກົດໃສ່ຂໍ້ຄວາມເພື່ອແກ້ໄຂ, ກົດ × ເພື່ອລຶບ ແລະ ກົດ ＋ ເພື່ອເພີ່ມຄືນ. ແຕ່ລະແບບຟອມຈະບັນທຶກແຍກກັນ.</p>
          </div>
        </aside>

        <section className="document-workspace">
          <div className="workspace-heading">
            <div>
              <span>ກຳລັງແກ້ໄຂ</span>
              <strong>{selectedTemplate.laoName}</strong>
            </div>
            <span>{documentPageCount} ໜ້າ · A4 ແນວຕັ້ງ · {selectedLaoFont.label} + {selectedEnglishFont.label}</span>
          </div>
          <div
            className={`document-pages ${editing ? "editing" : "previewing"}`}
            ref={editorRef}
            key={selectedId}
            style={documentFontStyle}
          >
            <TemplateCanvas templateId={selectedId} ctx={editorContext} />
          </div>
        </section>
      </div>

      {downloadConfirmationOpen ? (
        <div
          className="download-confirmation-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDownloadConfirmationOpen(false);
          }}
        >
          <section
            className="download-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-confirmation-title"
            aria-describedby="download-confirmation-description"
          >
            <div className="download-confirmation-icon" aria-hidden="true">PDF</div>
            <div className="download-confirmation-copy">
              <h2 id="download-confirmation-title">ຢືນຢັນການດາວໂຫຼດ</h2>
              <p id="download-confirmation-description">
                ຕ້ອງການດາວໂຫຼດ “{selectedTemplate.laoName}” ເປັນໄຟລ໌ PDF ຫຼື ບໍ່?
              </p>
              <small>{selectedTemplate.fileName}</small>
            </div>
            <div className="download-confirmation-actions">
              <button type="button" onClick={() => setDownloadConfirmationOpen(false)}>ຍົກເລີກ</button>
              <button
                ref={confirmDownloadButtonRef}
                type="button"
                className="confirm-download"
                onClick={exportPdf}
              >
                ↓ ດາວໂຫຼດ PDF
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="powered-by-badge" aria-label="Powered by TJ Group">
        <span>Powered by</span>
        <strong>TJ Group</strong>
      </div>

      <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadAsset} />
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">✓ {toast}</div>
    </main>
  );
}
