"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TemplateId = "cooperation" | "debt-note" | "quotation";
type AssetKey = "logo" | "signature" | "stamp";

type TemplateDefinition = {
  id: TemplateId;
  laoName: string;
  description: string;
  code: string;
  pages: number;
  fileName: string;
};

type DocumentDraft = {
  fields: Record<string, string>;
  assets: Partial<Record<AssetKey, string>>;
  settings: {
    logoWidth: number;
  };
};

type EditorContext = {
  draft: DocumentDraft;
  editing: boolean;
  onFieldChange: (field: string, html: string, text: string) => void;
};

const STORAGE_KEY = "lao-document-studio.v1";

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "cooperation",
    laoName: "ໃບສະເໜີຂໍຮ່ວມມືທາງທຸລະກິດ",
    description: "ເຊື່ອມຕໍ່ການຊຳລະຜ່ານ Unitel ເບີຂຶ້ນຕົ້ນ 9.",
    code: "COOP",
    pages: 3,
    fileName: "Unitel_Business_Cooperation_Proposal.pdf"
  },
  {
    id: "debt-note",
    laoName: "ໃບແຈ້ງໜີ້",
    description: "ແຈ້ງລາຍການໜີ້, ສາເຫດ ແລະ ກຳນົດຊຳລະ.",
    code: "DEBT",
    pages: 1,
    fileName: "Lao_Debit_Note.pdf"
  },
  {
    id: "quotation",
    laoName: "ໃບສະເໜີລາຄາ",
    description: "ສະເໜີລາຄາສິນຄ້າ, ບໍລິການ ແລະ ເງື່ອນໄຂ.",
    code: "QUOTE",
    pages: 1,
    fileName: "Lao_Quotation.pdf"
  }
];

function createDraft(): DocumentDraft {
  return { fields: {}, assets: {}, settings: { logoWidth: 92 } };
}

function createDraftCollection(): Record<TemplateId, DocumentDraft> {
  return {
    cooperation: createDraft(),
    "debt-note": createDraft(),
    quotation: createDraft()
  };
}

type EditableTextProps = {
  ctx: EditorContext;
  field: string;
  html: string;
  as?: React.ElementType;
  className?: string;
  placeholder?: string;
  locked?: boolean;
};

function EditableText({
  ctx,
  field,
  html,
  as: Tag = "span",
  className = "",
  placeholder = "",
  locked = false
}: EditableTextProps) {
  const value = ctx.draft.fields[field] ?? html;
  const editable = ctx.editing && !locked;

  return (
    <Tag
      className={`editable ${className}`.trim()}
      contentEditable={editable}
      data-field={field}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(event: React.FormEvent<HTMLElement>) => {
        const element = event.currentTarget;
        ctx.onFieldChange(field, element.innerHTML, element.textContent ?? "");
      }}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

function Paper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section className="paper" aria-label={label}>
      <div className="paper-content">{children}</div>
    </section>
  );
}

function NationalHeader({ ctx }: { ctx: EditorContext }) {
  return (
    <header className="national-header keep-together">
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
      <div className="national-divider">──────────── ວ ວ ────────────</div>
    </header>
  );
}

function CompanyHeader({ ctx, compact = false }: { ctx: EditorContext; compact?: boolean }) {
  const logo = ctx.draft.assets.logo;
  return (
    <section className={`company-header keep-together ${compact ? "is-compact" : ""}`}>
      <div className="company-side">
        <div className="document-logo" style={{ width: `${ctx.draft.settings.logoWidth}px` }}>
          {logo ? <img src={logo} alt="ໂລໂກ້ບໍລິສັດ" /> : <span>ໂລໂກ</span>}
        </div>
        <div className="company-copy">
          <EditableText ctx={ctx} field="companyName" html="[ຊື່ບໍລິສັດ]" as="div" className="company-name" />
          <div><strong>ທີ່ຢູ່:</strong> <EditableText ctx={ctx} field="companyAddress" html="[ທີ່ຢູ່ບໍລິສັດ]" /></div>
          <div><strong>ໂທ:</strong> <EditableText ctx={ctx} field="companyPhone" html="020 ............" /></div>
          <div><strong>ອີເມວ:</strong> <EditableText ctx={ctx} field="companyEmail" html="email@company.com" /></div>
          <div><strong>ເລກອາກອນ:</strong> <EditableText ctx={ctx} field="companyTax" html="................" /></div>
        </div>
      </div>
      <div className="document-meta">
        <div><strong>ເລກທີ:</strong> <EditableText ctx={ctx} field="documentNumber" html="...../....." className="line-value" /></div>
        <div><strong>ສະຖານທີ່:</strong> <EditableText ctx={ctx} field="documentPlace" html="ນະຄອນຫຼວງວຽງຈັນ" className="line-value" /></div>
        <div><strong>ວັນທີ:</strong> <EditableText ctx={ctx} field="documentDate" html="20/07/2026" className="line-value" /></div>
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
        <div className="signature-slot">
          {ctx.draft.assets.signature ? <img src={ctx.draft.assets.signature} alt="ລາຍເຊັນ" /> : <span className="edit-hint">ລາຍເຊັນ</span>}
        </div>
        <div className="signature-slot stamp-slot">
          {ctx.draft.assets.stamp ? <img src={ctx.draft.assets.stamp} alt="ກາປະທັບ" /> : <span className="edit-hint">ກາປະທັບ</span>}
        </div>
      </div>
      <EditableText ctx={ctx} field="signerName" html="[ຊື່ ແລະ ນາມສະກຸນ]" as="div" className="signature-name line-value" />
      <EditableText ctx={ctx} field="signerPosition" html="[ຕຳແໜ່ງ]" as="div" className="signature-position" />
    </section>
  );
}

function CooperationTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <>
      <Paper label="ໜ້າ 1 — ໃບສະເໜີຮ່ວມມື">
        <NationalHeader ctx={ctx} />
        <CompanyHeader ctx={ctx} />
        <DocumentTitle
          ctx={ctx}
          title="ໃບສະເໜີຂໍຮ່ວມມືທາງທຸລະກິດ"
          subtitle="<strong>ເລື່ອງ:</strong> ຂໍຮ່ວມມືເຊື່ອມຕໍ່ລະບົບຮັບຊຳລະເງິນຜ່ານມູນຄ່າໂທ Unitel ເບີຫຼັກ 9"
        />
        <EditableText
          ctx={ctx}
          field="recipient"
          html="<strong>ຮຽນ:</strong><br>ທ່ານ ຜູ້ອຳນວຍການໃຫຍ່<br>ບໍລິສັດ ສະຕາ ໂທລະຄົມ ຈຳກັດ<br>Star Telecom Co., Ltd. – Unitel"
          as="div"
          className="recipient"
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
      </Paper>

      <Paper label="ໜ້າ 2 — ຂໍ້ສະເໜີຮ່ວມມື">
        <EditableText ctx={ctx} field="proposalHeading" html="2. ຂໍ້ສະເໜີຮ່ວມມື" as="h2" className="section-heading top-heading" />
        <EditableText
          ctx={ctx}
          field="cooperationProposal"
          html="ດັ່ງນັ້ນ, ບໍລິສັດຈຶ່ງຂໍສະເໜີຮ່ວມມືກັບບໍລິສັດ ສະຕາ ໂທລະຄົມ ຈຳກັດ ເພື່ອເຊື່ອມຕໍ່ລະບົບຮັບຊຳລະເງິນຜ່ານມູນຄ່າໂທ Unitel ເບີຫຼັກ 9 ເຂົ້າກັບເວັບໄຊຂອງບໍລິສັດ."
          as="p"
        />
        <EditableText ctx={ctx} field="revenueHeading" html="3. ຂໍ້ສະເໜີອັດຕາແບ່ງປັນລາຍຮັບ" as="h2" className="section-heading" />
        <div className="form-grid keep-together">
          <div><span>ອັດຕາທີ່ສະເໜີໃຫ້ Unitel</span><span className="form-value"><EditableText ctx={ctx} field="unitelRate" html="25" />%</span></div>
          <div><span>ອັດຕາທີ່ບໍລິສັດໄດ້ຮັບ</span><span className="form-value computed"><EditableText ctx={ctx} field="companyRate" html="75" locked />%</span></div>
          <div><span>ຍອດທຸລະກຳຄາດຄະເນຕໍ່ມື້</span><EditableText ctx={ctx} field="dailySales" html="........ LAK" className="form-value" /></div>
          <div><span>ຍອດທຸລະກຳຄາດຄະເນຕໍ່ເດືອນ</span><EditableText ctx={ctx} field="monthlySales" html="........ LAK" className="form-value" /></div>
          <div><span>ຮອບການຊຳລະຍອດທີ່ຕ້ອງການ</span><EditableText ctx={ctx} field="settlement" html="T+1" className="form-value" /></div>
          <div><span>ບັນທຶກການເຈລະຈາ</span><EditableText ctx={ctx} field="negotiationNote" html="................................" className="form-value" /></div>
        </div>
        <p>
          ທາງບໍລິສັດຂໍສະເໜີອັດຕາແບ່ງປັນລາຍຮັບໃຫ້ທາງ Unitel ໃນອັດຕາ [
          <EditableText ctx={ctx} field="unitelRateNarrative" html="25" locked />]% ຂອງມູນຄ່າທຸລະກຳທີ່ສຳເລັດ ແລະ ບໍລິສັດໄດ້ຮັບຍອດສຸດທິ [
          <EditableText ctx={ctx} field="companyRateNarrative" html="75" locked />]%.
        </p>
        <EditableText
          ctx={ctx}
          field="revenueNegotiable"
          html="ອັດຕາດັ່ງກ່າວສາມາດເຈລະຈາ ແລະ ປັບປ່ຽນໄດ້ຕາມປະລິມານທຸລະກຳ, ເງື່ອນໄຂທາງດ້ານເຕັກນິກ ແລະ ຂໍ້ຕົກລົງຂອງທັງສອງຝ່າຍ."
          as="p"
        />
        <EditableText ctx={ctx} field="unitelInfoHeading" html="4. ຂໍ້ມູນທີ່ຂໍໃຫ້ Unitel ສະໜອງ" as="h2" className="section-heading" />
        <ol className="numbered-list">
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
            <li key={index}><EditableText ctx={ctx} field={`unitelInfo${index + 1}`} html={item} /></li>
          ))}
        </ol>
      </Paper>

      <Paper label="ໜ້າ 3 — ລາຍເຊັນ ແລະ ເອກະສານຄັດຕິດ">
        <EditableText ctx={ctx} field="conclusionHeading" html="5. ສະຫຼຸບ" as="h2" className="section-heading top-heading" />
        <EditableText ctx={ctx} field="conclusion1" html="ດັ່ງນັ້ນ, ຈຶ່ງຮຽນສະເໜີມາຍັງທ່ານ ເພື່ອຄົ້ນຄວ້າ ແລະ ພິຈາລະນາຕາມເຫັນສົມຄວນດ້ວຍ." as="p" />
        <EditableText ctx={ctx} field="conclusion2" html="ຮຽນມາດ້ວຍຄວາມເຄົາລົບຢ່າງສູງ." as="p" />
        <SignatureBlock ctx={ctx} />
        <EditableText ctx={ctx} field="attachmentsHeading" html="ເອກະສານຄັດຕິດ:" as="h2" className="section-heading" />
        <ol className="numbered-list attachments-list">
          {[
            "ສຳເນົາໃບທະບຽນວິສາຫະກິດ;",
            "ສຳເນົາໃບອະນຸຍາດດຳເນີນທຸລະກິດ (ຖ້າມີ);",
            "ສຳເນົາໃບທະບຽນອາກອນ;",
            "ສຳເນົາບັດປະຈຳຕົວຂອງຜູ້ອຳນວຍການ;",
            "ເອກະສານແນະນຳບໍລິສັດ;",
            "ຮູບພາບ ແລະ Link ຂອງເວັບໄຊ;",
            "ແຜນວາດຂັ້ນຕອນການຊຳລະເງິນ."
          ].map((item, index) => (
            <li key={index}><EditableText ctx={ctx} field={`attachment${index + 1}`} html={item} /></li>
          ))}
        </ol>
      </Paper>
    </>
  );
}

function DebtNoteTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <Paper label="ໃບແຈ້ງໜີ້">
      <NationalHeader ctx={ctx} />
      <CompanyHeader ctx={ctx} compact />
      <DocumentTitle ctx={ctx} title="ໃບແຈ້ງໜີ້" subtitle="DEBIT NOTE" />
      <div className="two-column-details keep-together">
        <div>
          <h2>ຜູ້ຮັບແຈ້ງ / Bên nhận</h2>
          <EditableText ctx={ctx} field="debtorName" html="[ຊື່ລູກຄ້າ / Tên khách hàng]" as="div" className="detail-strong" />
          <EditableText ctx={ctx} field="debtorAddress" html="[ທີ່ຢູ່ / Địa chỉ]" as="div" />
          <div><strong>ເລກອາກອນ:</strong> <EditableText ctx={ctx} field="debtorTax" html="................" /></div>
        </div>
        <div>
          <h2>ຂໍ້ມູນເອກະສານ</h2>
          <div><strong>ອ້າງອີງ:</strong> <EditableText ctx={ctx} field="debtReference" html="INV-........" className="line-value" /></div>
          <div><strong>ກຳນົດຊຳລະ:</strong> <EditableText ctx={ctx} field="dueDate" html="..../..../......" className="line-value" /></div>
          <div><strong>ສະກຸນເງິນ:</strong> <EditableText ctx={ctx} field="currency" html="LAK" className="line-value" /></div>
        </div>
      </div>
      <table className="document-table debit-table">
        <thead><tr><th>ລ/ດ</th><th>ລາຍລະອຽດ / Diễn giải</th><th>ຈຳນວນເງິນ</th></tr></thead>
        <tbody>
          {[1, 2, 3].map((row) => (
            <tr key={row}>
              <td>{row}</td>
              <td><EditableText ctx={ctx} field={`debtDescription${row}`} html={row === 1 ? "ຄ່າບໍລິການ / Khoản ghi nợ" : "................................"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`debtAmount${row}`} html={row === 1 ? "0" : "-"} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th colSpan={2}>ຍອດລວມທີ່ຕ້ອງຊຳລະ / Tổng tiền phải trả</th><th className="amount"><EditableText ctx={ctx} field="debtTotal" html="0 LAK" /></th></tr>
        </tfoot>
      </table>
      <section className="note-box">
        <h2>ເຫດຜົນການອອກໃບແຈ້ງໜີ້ / Lý do ghi nợ</h2>
        <EditableText ctx={ctx} field="debtReason" html="[ລາຍລະອຽດເຫດຜົນ / Nội dung phát sinh khoản nợ]" as="p" />
      </section>
      <section className="payment-box keep-together">
        <h2>ຂໍ້ມູນການຊຳລະ / Thông tin thanh toán</h2>
        <div><strong>ທະນາຄານ:</strong> <EditableText ctx={ctx} field="bankName" html="[ຊື່ທະນາຄານ]" /></div>
        <div><strong>ເລກບັນຊີ:</strong> <EditableText ctx={ctx} field="bankAccount" html="[ເລກບັນຊີ]" /></div>
        <div><strong>ຊື່ບັນຊີ:</strong> <EditableText ctx={ctx} field="accountName" html="[ຊື່ບັນຊີ]" /></div>
      </section>
      <SignatureBlock ctx={ctx} />
    </Paper>
  );
}

function QuotationTemplate({ ctx }: { ctx: EditorContext }) {
  return (
    <Paper label="ໃບສະເໜີລາຄາ">
      <NationalHeader ctx={ctx} />
      <CompanyHeader ctx={ctx} compact />
      <DocumentTitle ctx={ctx} title="ໃບສະເໜີລາຄາ" subtitle="QUOTATION" />
      <div className="two-column-details keep-together">
        <div>
          <h2>ຮຽນ / Kính gửi</h2>
          <EditableText ctx={ctx} field="customerName" html="[ຊື່ລູກຄ້າ / Tên khách hàng]" as="div" className="detail-strong" />
          <EditableText ctx={ctx} field="customerAddress" html="[ທີ່ຢູ່ / Địa chỉ]" as="div" />
        </div>
        <div>
          <h2>ຂໍ້ມູນໃບສະເໜີ</h2>
          <div><strong>ເລກທີ:</strong> <EditableText ctx={ctx} field="quoteNumber" html="QT-2026-001" className="line-value" /></div>
          <div><strong>ມີຜົນເຖິງ:</strong> <EditableText ctx={ctx} field="quoteValidUntil" html="..../..../......" className="line-value" /></div>
        </div>
      </div>
      <EditableText ctx={ctx} field="quoteIntro" html="ບໍລິສັດຂໍສະເໜີລາຄາສິນຄ້າ ແລະ ບໍລິການດັ່ງຕໍ່ໄປນີ້:" as="p" />
      <table className="document-table quote-table">
        <thead><tr><th>ລ/ດ</th><th>ລາຍການ</th><th>ຈຳນວນ</th><th>ລາຄາ/ໜ່ວຍ</th><th>ລວມ</th></tr></thead>
        <tbody>
          {[1, 2, 3, 4].map((row) => (
            <tr key={row}>
              <td>{row}</td>
              <td><EditableText ctx={ctx} field={`quoteItem${row}`} html={row === 1 ? "[ຊື່ສິນຄ້າ / ບໍລິການ]" : "................................"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quoteQty${row}`} html={row === 1 ? "1" : "-"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quotePrice${row}`} html={row === 1 ? "0" : "-"} /></td>
              <td className="amount"><EditableText ctx={ctx} field={`quoteLineTotal${row}`} html={row === 1 ? "0" : "-"} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th colSpan={4}>ລວມກ່ອນອາກອນ</th><th className="amount"><EditableText ctx={ctx} field="quoteSubtotal" html="0" /></th></tr>
          <tr><th colSpan={4}>ອາກອນ / VAT</th><th className="amount"><EditableText ctx={ctx} field="quoteTax" html="0" /></th></tr>
          <tr className="grand-total"><th colSpan={4}>ຍອດລວມທັງໝົດ</th><th className="amount"><EditableText ctx={ctx} field="quoteTotal" html="0 LAK" /></th></tr>
        </tfoot>
      </table>
      <section className="terms-box keep-together">
        <h2>ເງື່ອນໄຂ / Điều kiện</h2>
        <div>1. <strong>ການຊຳລະ:</strong> <EditableText ctx={ctx} field="paymentTerms" html="ຊຳລະ 50% ລ່ວງໜ້າ" /></div>
        <div>2. <strong>ການສົ່ງມອບ:</strong> <EditableText ctx={ctx} field="deliveryTerms" html="ພາຍໃນ .... ວັນ" /></div>
        <div>3. <strong>ອາຍຸໃບສະເໜີ:</strong> <EditableText ctx={ctx} field="validityTerms" html="30 ວັນ" /></div>
        <div>4. <strong>ໝາຍເຫດ:</strong> <EditableText ctx={ctx} field="quoteNote" html="................................" /></div>
      </section>
      <SignatureBlock ctx={ctx} />
    </Paper>
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
  const [revision, setRevision] = useState(0);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const draftsRef = useRef<Record<TemplateId, DocumentDraft>>(createDraftCollection());
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAssetRef = useRef<AssetKey>("logo");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((template) => template.id === selectedId) ?? TEMPLATES[0],
    [selectedId]
  );
  const draft = draftsRef.current[selectedId];

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
    saveTimerRef.current = setTimeout(() => writeStorage(selectedId), 650);
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
        const unitelText = Number.isInteger(unitel) ? String(unitel) : unitel.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
        activeDraft.fields.companyRate = companyText;
        activeDraft.fields.unitelRateNarrative = unitelText;
        activeDraft.fields.companyRateNarrative = companyText;
        editorRef.current?.querySelectorAll<HTMLElement>("[data-field='companyRate']").forEach((element) => { element.textContent = companyText; });
        editorRef.current?.querySelectorAll<HTMLElement>("[data-field='unitelRateNarrative']").forEach((element) => { element.textContent = unitelText; });
        editorRef.current?.querySelectorAll<HTMLElement>("[data-field='companyRateNarrative']").forEach((element) => { element.textContent = companyText; });
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
              nextDrafts[id] = {
                fields: stored.fields ?? {},
                assets: stored.assets ?? {},
                settings: { logoWidth: stored.settings?.logoWidth ?? 92 }
              };
            }
          });
          draftsRef.current = nextDrafts;
          if (parsed.selectedId && TEMPLATES.some((template) => template.id === parsed.selectedId)) {
            setSelectedId(parsed.selectedId);
          }
          setRevision((value) => value + 1);
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

  const selectTemplate = (nextId: TemplateId) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    writeStorage(nextId);
    setSelectedId(nextId);
    setRevision((value) => value + 1);
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

  const uploadAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) {
      showToast("ຮັບສະເພາະຮູບ PNG/JPG/WebP/SVG ຕ່ຳກວ່າ 6 MB");
      return;
    }
    try {
      const dataUrl = await readFile(file);
      draftsRef.current[selectedId].assets[pendingAssetRef.current] = dataUrl;
      setRevision((value) => value + 1);
      writeStorage(selectedId);
      showToast("ອັບເດດຮູບແລ້ວ");
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
    onFieldChange: handleFieldChange
  };

  return (
    <main className="studio-shell" data-revision={revision}>
      <header className="studio-header">
        <div className="brand-block">
          <div className="brand-mark">ລ</div>
          <div>
            <strong>Lao Document Studio</strong>
            <span>ລະບົບສ້າງເອກະສານທຸລະກິດ</span>
          </div>
        </div>
        <div className="header-status"><i /> <span ref={statusRef}>ພ້ອມແກ້ໄຂ</span></div>
      </header>

      <section className="studio-toolbar" aria-label="ແຖບເຄື່ອງມື">
        <label className="template-select-label">
          <span>ປະເພດເອກະສານ</span>
          <select value={selectedId} onChange={(event) => selectTemplate(event.target.value as TemplateId)}>
            {TEMPLATES.map((template) => (
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
          <button onClick={() => chooseAsset("logo")}>▧ ໂລໂກ</button>
          <button onClick={() => chooseAsset("signature")}>⌁ ລາຍເຊັນ</button>
          <button onClick={() => chooseAsset("stamp")}>◎ ກາປະທັບ</button>
          <label className="logo-size-control">ຂະໜາດໂລໂກ <input type="range" min="56" max="150" value={draft.settings.logoWidth} onChange={(event) => {
            draftsRef.current[selectedId].settings.logoWidth = Number(event.target.value);
            setRevision((value) => value + 1);
            scheduleSave();
          }} /></label>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group toolbar-actions">
          <button onClick={() => writeStorage(selectedId, true)}>▣ ບັນທຶກ</button>
          <button className="primary" disabled={exporting} onClick={exportPdf}>{exporting ? "⋯ ກຳລັງສ້າງ" : "↓ ດາວໂຫຼດ PDF"}</button>
          <button onClick={printDocument}>▤ ພິມ</button>
          <button className="danger" onClick={resetCurrentTemplate}>↺ ຄືນຄ່າ</button>
        </div>
      </section>

      <div className="studio-body">
        <aside className="template-catalog" aria-label="ລາຍການແບບຟອມ">
          <div className="catalog-heading">
            <span>ລາຍການແບບຟອມ</span>
            <b>{TEMPLATES.length} ແບບ</b>
          </div>
          <div className="template-list">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                className={`template-card ${template.id === selectedId ? "selected" : ""}`}
                onClick={() => selectTemplate(template.id)}
                aria-pressed={template.id === selectedId}
              >
                <span className="template-code">{template.code}</span>
                <strong>{template.laoName}</strong>
                <small>{template.description}</small>
                <i>{template.pages} ໜ້າ A4</i>
              </button>
            ))}
          </div>
          <div className="catalog-tip">
            <strong>ແບບຟອມແຍກກັນ</strong>
            <p>ແຕ່ລະແບບຟອມຖືກບັນທຶກແຍກກັນ. ການປ່ຽນແບບຟອມຈະບໍ່ເຮັດໃຫ້ເນື້ອຫາສູນເສຍ.</p>
          </div>
        </aside>

        <section className="document-workspace">
          <div className="workspace-heading">
            <div>
              <span>ກຳລັງແກ້ໄຂ</span>
              <strong>{selectedTemplate.laoName}</strong>
            </div>
            <span>{selectedTemplate.pages} ໜ້າ · A4 ແນວຕັ້ງ · Noto Sans Lao</span>
          </div>
          <div className={`document-pages ${editing ? "editing" : "previewing"}`} ref={editorRef} key={`${selectedId}-${revision}`}>
            <TemplateCanvas templateId={selectedId} ctx={editorContext} />
          </div>
        </section>
      </div>

      <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadAsset} />
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">✓ {toast}</div>
    </main>
  );
}
