export interface WorkflowTimelineProps {
  activeSectionId: string;
  onJumpToStep: (sectionId: string) => void;
}

const WORKFLOW_STEPS: { n: number; title: string; anchorId: string; matchIds: string[] }[] = [
  { n: 1, title: 'Khảo sát & Tiếp nhận', anchorId: 'ocr-upload-zone', matchIds: ['auth-login-pbac', 'dashboard-site', 'ocr-upload-zone'] },
  { n: 2, title: 'Số hóa AI (OCR)', anchorId: 'ocr-scanning-progress', matchIds: ['ocr-scanning-progress', 'ocr-side-by-side-review'] },
  { n: 3, title: 'Dữ liệu Nền tảng', anchorId: 'master-stores-list', matchIds: ['master-stores-list', 'master-stores-create', 'master-vendors-list', 'master-vendors-create'] },
  { n: 4, title: 'Danh sách & Bộ lọc', anchorId: 'contract-list-console', matchIds: ['contract-list-console', 'contract-filter-active', 'contract-status-badges', 'contract-edit-drawer'] },
  { n: 5, title: 'Hồ sơ Pháp lý', anchorId: 'detail-legal-overview', matchIds: ['detail-legal-overview', 'detail-documents-section', 'detail-pdf-preview', 'detail-audit-tab'] },
  { n: 6, title: 'Tài chính & Khóa', anchorId: 'finance-sap-section', matchIds: ['finance-sap-section', 'finance-schedules-section', 'finance-sap-mapping', 'finance-locked-banner'] },
  { n: 7, title: 'Phụ lục Điều chỉnh', anchorId: 'addendum-drawer-init', matchIds: ['addendum-drawer-init', 'addendum-beneficiary-form', 'addendum-pricing-override', 'addendum-diff-preview'] },
  { n: 8, title: 'Thanh lý & Quyết toán Cọc', anchorId: 'termination-drawer', matchIds: ['termination-drawer', 'termination-deposit-form', 'payment-console-table', 'payment-sap-action-bar', 'payment-sap-history-modal'] },
];

export function WorkflowTimeline8Steps({ activeSectionId, onJumpToStep }: WorkflowTimelineProps) {
  const activeStep = WORKFLOW_STEPS.find((s) => s.matchIds.includes(activeSectionId)) ?? WORKFLOW_STEPS[0];

  return (
    <nav className="workflow-timeline-wrapper" aria-label="Bản đồ quy trình 8 bước">
      <ol className="workflow-timeline">
        {WORKFLOW_STEPS.map((s) => {
          const isActive = s.n === activeStep.n;
          return (
            <li
              key={s.n}
              className={`timeline-step ${isActive ? 'timeline-step-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onJumpToStep(s.anchorId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onJumpToStep(s.anchorId);
                }
              }}
            >
              <span className="timeline-num">{s.n}</span>
              <span className="timeline-title">{s.title}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
