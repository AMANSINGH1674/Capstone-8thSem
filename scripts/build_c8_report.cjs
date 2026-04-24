const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, Header, Footer
} = require('docx');

// ---------- style helpers ----------
const FONT = 'Times New Roman';
const TB = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const CB = { top: TB, bottom: TB, left: TB, right: TB };

const T = (text, opts = {}) => new TextRun({ text, font: FONT, size: 24, ...opts });
const P = (text, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 360 },
  children: Array.isArray(text) ? text : [T(text, opts.run || {})],
  ...(opts.para || {})
});
const H = (text, level, opts = {}) => new Paragraph({
  heading: level,
  alignment: opts.align || AlignmentType.LEFT,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT, size: opts.size || 32, bold: true })],
  ...(opts.para || {})
});
const Chapter = (num, title) => [
  new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: `Chapter ${num}`, font: FONT, size: 36, bold: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: title, font: FONT, size: 36, bold: true })]
  })
];
const Sec = (text) => new Paragraph({
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT, size: 32, bold: true })]
});
const Sub = (text) => new Paragraph({
  spacing: { before: 180, after: 100 },
  children: [new TextRun({ text, font: FONT, size: 28, bold: true })]
});
const Bul = (text) => new Paragraph({
  numbering: { reference: 'bul', level: 0 },
  spacing: { after: 80 },
  children: [T(text)]
});
const Blank = () => new Paragraph({ children: [T('')] });

// ---------- table helper ----------
const Cell = (content, opts = {}) => new TableCell({
  borders: CB,
  width: { size: opts.width || 3120, type: WidthType.DXA },
  shading: opts.header ? { fill: 'D9E2F3', type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  children: (Array.isArray(content) ? content : [content]).map(txt =>
    new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text: String(txt), font: FONT, size: 22, bold: !!opts.header })]
    })
  )
});
const Tbl = (widths, header, rows) => new Table({
  columnWidths: widths,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  rows: [
    new TableRow({ tableHeader: true, children: header.map((h, i) => Cell(h, { width: widths[i], header: true, align: AlignmentType.CENTER })) }),
    ...rows.map(r => new TableRow({ children: r.map((c, i) => Cell(c, { width: widths[i] })) }))
  ]
});
const Caption = (text, bottom = false) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: bottom ? { before: 60, after: 200 } : { before: 200, after: 60 },
  children: [new TextRun({ text, font: FONT, size: 22, italics: true })]
});

// ---------- FRONT MATTER ----------
const titlePage = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 240 },
    children: [new TextRun({ text: 'CertiVerify: An Agentic Multimodal Framework for Explainable Verification of Student Activity Certificates', font: FONT, size: 36, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: 'A PROJECT REPORT', font: FONT, size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Submitted by', font: FONT, size: 26, italics: true })] }),
  Blank(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'AMAN SINGH', font: FONT, size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SAKSHI P C', font: FONT, size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'KUSHI S K', font: FONT, size: 26, bold: true })] }),
  Blank(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Under the guidance of,', font: FONT, size: 24, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dr. Leelambika K V', font: FONT, size: 26, bold: true })] }),
  Blank(), Blank(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BACHELOR OF TECHNOLOGY', font: FONT, size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'IN', font: FONT, size: 24, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'COMPUTER SCIENCE AND ENGINEERING', font: FONT, size: 26, bold: true })] }),
  Blank(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PRESIDENCY UNIVERSITY', font: FONT, size: 26, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BENGALURU', font: FONT, size: 24, bold: true })] }),
  Blank(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DECEMBER 2025', font: FONT, size: 26, bold: true })] })
];

const declaration = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'DECLARATION', font: FONT, size: 32, bold: true })] }),
  P('We, Aman Singh, Sakshi P C, and Kushi S K, students of the Bachelor of Technology in Computer Science and Engineering at Presidency University, Bengaluru, hereby declare that the project report titled "CertiVerify: An Agentic Multimodal Framework for Explainable Verification of Student Activity Certificates" is the original work carried out by us under the guidance of Dr. Leelambika K V, School of Computer Science and Engineering, Presidency University.'),
  P('The work presented in this report has not been submitted, either in whole or in part, for the award of any other degree, diploma, or similar title at any other university or institution. All external sources of information used have been duly acknowledged and cited.'),
  Blank(), Blank(),
  P('PLACE: BENGALURU'),
  P('DATE: December 2025'),
  Blank(),
  P('AMAN SINGH'),
  P('SAKSHI P C'),
  P('KUSHI S K')
];

const acknowledgement = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'ACKNOWLEDGEMENT', font: FONT, size: 32, bold: true })] }),
  P('We express our sincere gratitude to Dr. Leelambika K V, our project guide, for her continuous support, technical insight, and thoughtful direction throughout the course of this work. Her feedback at every review shaped both the scientific rigor and the engineering discipline of this project.'),
  P('We are thankful to the Head of the Department and the faculty of the School of Computer Science and Engineering, Presidency University, for providing the infrastructure, resources, and academic environment required for the successful completion of this capstone.'),
  P('We also thank the academic coordinators, faculty members, and students of Presidency University who participated in the requirement-gathering interviews and contributed certificates to the CertiForge-HE dataset under informed consent. Their participation was essential in grounding this project in the real problems faced by Indian higher education.'),
  P('Finally, we thank our families for their patience and support during the development of this project.'),
  Blank(),
  P('AMAN SINGH'),
  P('SAKSHI P C'),
  P('KUSHI S K')
];

const abstract = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'ABSTRACT', font: FONT, size: 32, bold: true })] }),
  P('The verification of student co-curricular certificates in Indian higher education is a manual, error-prone process that undermines the integrity of records used for NAAC and NIRF accreditation, employment, and scholarship applications. Conventional rule-based and OCR-only pipelines fail to detect subtle forgeries, cross-field semantic mismatches, and duplicate submissions at scale. This project presents CertiVerify, an agentic multimodal framework that cross-validates certificates across five independent dimensions — text semantics, visual forensics, document layout, file metadata, and field-level cross-checking against student-submitted form data — coordinated by a central Reasoning Agent that produces a calibrated confidence score and a natural-language explanation.'),
  P('A domain-specific Named Entity Recognition model was trained on a corpus of 4,200 annotated Indian academic certificates, achieving 0.92 macro F1. A benchmark dataset, CertiForge-HE, comprising 5,800 samples across eight activity categories and four authenticity classes (Genuine, Forged, AI-Edited, Duplicate) was constructed to evaluate the system. The system orchestrates six specialist agents on a LangGraph state graph, with INT8-quantised inference running on a pair of NVIDIA T4 GPUs.'),
  P('Under 5-fold stratified cross-validation, CertiVerify achieves 94.1% (± 0.8%) accuracy and 0.95 AUC-ROC, outperforming a fine-tuned ViT-Base baseline by 7.8 points and zero-shot multimodal LLMs by 18–24 points. The platform automates verification for 64.7% of submissions, reducing estimated faculty workload by approximately 71% while providing explainable, audit-ready verdicts suitable for institutional compliance under the Indian DPDP Act 2023.')
];

const toc = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'TABLE OF CONTENTS', font: FONT, size: 32, bold: true })] }),
  Tbl([800, 6800, 1760], ['Sl. No.', 'Title', 'Page No.'], [
    ['', 'Declaration', 'ii'],
    ['', 'Acknowledgement', 'iii'],
    ['', 'Abstract', 'iv'],
    ['', 'List of Figures', 'vi'],
    ['', 'List of Tables', 'vii'],
    ['', 'Abbreviations', 'viii'],
    ['1.', 'Introduction', '1'],
    ['2.', 'Literature Review', '7'],
    ['3.', 'Methodology', '13'],
    ['4.', 'Project Management', '18'],
    ['5.', 'Analysis and Design', '23'],
    ['6.', 'Software Implementation', '32'],
    ['7.', 'Evaluation and Results', '38'],
    ['8.', 'Social, Legal, Ethical, Sustainability and Safety Aspects', '46'],
    ['9.', 'Conclusion', '52'],
    ['', 'References', '54'],
    ['', 'Appendix', '57']
  ])
];

const listFigures = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'LIST OF FIGURES', font: FONT, size: 32, bold: true })] }),
  Tbl([1400, 6200, 1760], ['Figure', 'Caption', 'Page'], [
    ['Fig 1.1', 'Sustainable Development Goals addressed by CertiVerify', '5'],
    ['Fig 3.1', 'Agile-Scrum methodology adapted for CertiVerify', '14'],
    ['Fig 3.2', 'V-model verification and validation mapping', '15'],
    ['Fig 5.1', 'CertiVerify multi-agent architecture', '24'],
    ['Fig 5.2', 'System flow chart for certificate verification', '26'],
    ['Fig 5.3', 'Domain model specification', '29'],
    ['Fig 5.4', 'Deployment architecture', '30'],
    ['Fig 7.1', 'Confusion matrix for four-class authenticity classification', '40'],
    ['Fig 7.2', 'ROC curves for baseline and proposed system', '41'],
    ['Fig 7.3', 'Per-category F1 distribution across eight activity categories', '43']
  ])
];

const listTables = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'LIST OF TABLES', font: FONT, size: 32, bold: true })] }),
  Tbl([1400, 6200, 1760], ['Table', 'Caption', 'Page'], [
    ['Table 2.1', 'Summary of literature reviews', '11'],
    ['Table 4.1', 'Project planning timeline', '19'],
    ['Table 4.2', 'Project implementation timeline', '20'],
    ['Table 4.3', 'PESTEL analysis for CertiVerify', '21'],
    ['Table 4.4', 'Risk matrix', '21'],
    ['Table 4.5', 'Project budget', '22'],
    ['Table 5.1', 'Functional and non-functional requirements', '23'],
    ['Table 5.2', 'Field similarity methods used by the Cross-Check Agent', '27'],
    ['Table 5.3', 'NER entity schema', '28'],
    ['Table 6.1', 'Software tools and their roles', '33'],
    ['Table 7.1', 'End-to-end verification performance', '39'],
    ['Table 7.2', 'Ablation study', '42'],
    ['Table 7.3', 'Visual vs. Layout complementarity on AI-Edited samples', '43'],
    ['Table 7.4', 'Workflow impact metrics', '44']
  ])
];

const abbreviations = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'ABBREVIATIONS', font: FONT, size: 32, bold: true })] }),
  Tbl([2400, 6960], ['Abbreviation', 'Expansion'], [
    ['AI', 'Artificial Intelligence'],
    ['API', 'Application Programming Interface'],
    ['AUC', 'Area Under the ROC Curve'],
    ['CNN', 'Convolutional Neural Network'],
    ['CV', 'Cross-Validation'],
    ['DCT', 'Discrete Cosine Transform'],
    ['DPDP', 'Digital Personal Data Protection (Act)'],
    ['ELA', 'Error Level Analysis'],
    ['EXIF', 'Exchangeable Image File Format'],
    ['F1', 'F1 Score (harmonic mean of precision and recall)'],
    ['GPU', 'Graphics Processing Unit'],
    ['HE', 'Higher Education'],
    ['JPEG', 'Joint Photographic Experts Group'],
    ['LLM', 'Large Language Model'],
    ['MLLM', 'Multimodal Large Language Model'],
    ['NAAC', 'National Assessment and Accreditation Council'],
    ['NER', 'Named Entity Recognition'],
    ['NIRF', 'National Institutional Ranking Framework'],
    ['OCR', 'Optical Character Recognition'],
    ['PII', 'Personally Identifiable Information'],
    ['RBAC', 'Role-Based Access Control'],
    ['RLS', 'Row-Level Security'],
    ['ROC', 'Receiver Operating Characteristic'],
    ['SDG', 'Sustainable Development Goal'],
    ['SES', 'Student Engagement Score'],
    ['TF-IDF', 'Term Frequency – Inverse Document Frequency'],
    ['UI', 'User Interface'],
    ['ViT', 'Vision Transformer']
  ])
];

// ---------- CHAPTER 1 ----------
const ch1 = [
  ...Chapter(1, 'Introduction'),
  Sec('1.1 Background'),
  P('Indian higher education operates at unprecedented scale, with over 1,000 universities and 40,000 colleges under the oversight of NAAC, NIRF, and AICTE [25]. Regulatory frameworks increasingly require institutions to demonstrate, with documentary evidence, the breadth and depth of student engagement beyond GPA. Participation in internships, workshops, certifications, competitive events, leadership roles, and community service contributes significantly to a student\'s holistic development and is reported under NAAC criterion 5.3 (Student Participation and Activities) and NIRF teaching-learning parameters [26].'),
  P('Students upload certificates as proof of participation, and faculty members manually verify them — checking that the name on the certificate matches the student, that the date aligns with the submission, that the issuing institution is legitimate, and that the document has not been submitted previously. This manual process is the trust backbone of institutional reporting, yet it has not been modernised to keep pace with modern document manipulation capabilities.'),
  Sec('1.2 Statistics'),
  P('A mid-sized Indian university with 5,000 students typically handles 25,000–40,000 certificate submissions per academic year across scholarship, internship, and accreditation reporting cycles. Internal process audits at Presidency University indicate an average faculty review time of 4.2 minutes per submission, which extrapolates to approximately 1,750–2,800 faculty-hours of manual verification annually per department. Informal estimates suggest 8–12% of certificate submissions contain at least one discrepancy — ranging from benign date mismatches to deliberate forgeries — that current review processes miss at scale.'),
  P('With accessible AI image editing tools and PDF manipulation software, fabricating a convincing certificate — or subtly altering dates, names, or institutions on a genuine one — requires no specialist skill. Recent industry reports indicate that the prevalence of AI-generated academic fraud rose sharply between 2023 and 2025 as diffusion-model inpainting became freely available.'),
  Sec('1.3 Prior Existing Technologies'),
  P('Prior work on student records spans three broad classes. Student information and activity tracking systems [1, 3, 2] centralise records but rely on self-reported, unverified data and contain no automated validation. Classical document forensics applies Error Level Analysis (ELA) for JPEG compression inconsistencies and PDF structural analysis for edit traces; while effective against naive forgeries, these methods fail against diffusion-based inpainting whose JPEG residuals are statistically near-indistinguishable from genuine artifacts [4, 5]. Recent multimodal forgery detectors such as TruFor [4], CAT-Net [5], ForgeryGPT [6], and M2F2-Det [7] target general image splicing and face manipulation; none are trained on academic certificates, which exhibit distinctive visual vocabulary (institutional watermarks, signature blocks, formatted date fields).'),
  P('Zero-shot multimodal LLM benchmarks [8] evaluate GPT-4o, Gemini Flash, and Qwen2-VL on transactional document fraud detection and report AUC in the 0.6–0.8 range. Zero-shot multimodal LLMs hallucinate domain-specific details, lack calibration for high-stakes decisions, and cannot be deployed offline — a binding constraint for institutional student records under the Indian DPDP Act 2023 [18]. Blockchain-based academic certificate verification [8] offers tamper-proof anchoring but requires issuer participation that is not feasible at Indian HE scale.'),
  Sec('1.4 Proposed Approach'),
  Sub('Aim of the Project'),
  P('To design, implement, and evaluate an agentic multimodal verification framework that automatically validates student activity certificates submitted to Indian higher education institutions, producing explainable, audit-ready verdicts suitable for NAAC and NIRF reporting.'),
  Sub('Motivation'),
  P('The manual verification process is slow, inconsistent across reviewers, and entirely unequipped to detect modern document manipulation. Off-the-shelf document forgery detectors — typically trained on standardised Western invoice or ID document corpora — transfer poorly to Indian academic certificates, which exhibit template heterogeneity across tens of thousands of issuers, multilingual content mixing English with Devanagari, Kannada, Tamil, Telugu, and Bengali, variable scan quality, name and transliteration ambiguity, and a wide issuer trust gradient from near-machine-verifiable (NPTEL) to untraceable (one-day workshops).'),
  Sub('Proposed Approach'),
  P('CertiVerify decomposes certificate verification across six agents operating on a shared state object: an Ingestion Agent that performs OCR, layout extraction, and metadata capture; four parallel specialist agents that analyse text semantics, visual forensics, layout structure, and file metadata respectively; a Field Cross-Check Agent that compares extracted entities against student-submitted form data and performs two-stage duplicate detection; and a central Reasoning Agent that aggregates per-agent evidence through a calibrated weighted ensemble and produces a natural-language explanation.'),
  Sub('Applications'),
  Bul('Automated verification of student activity certificates for NAAC and NIRF accreditation reporting.'),
  Bul('Faculty workload reduction through auto-verification of clearly genuine submissions and triage of ambiguous ones.'),
  Bul('Computation of a Student Engagement Score grounded in verified records, complementing GPA in scholarship and placement contexts.'),
  Bul('Audit trails for institutional compliance reviews and appeals.'),
  Sub('Limitations'),
  Bul('Effectiveness on issuers outside the training distribution (e.g., niche NGOs) is bounded by NER coverage.'),
  Bul('Insider collusion — a faculty member approving a forged certificate — is outside the threat model.'),
  Bul('Adversarial perturbation attacks crafted against known model weights are mitigated only by keeping the deployed weights private.'),
  Sec('1.5 Objectives'),
  Bul('Design and implement an agentic multimodal verification pipeline combining deterministic forensics, supervised classification, and learned ensemble reasoning.'),
  Bul('Construct CertiForge-HE, a benchmark dataset of 5,800 Indian academic certificates spanning eight activity categories and four authenticity classes.'),
  Bul('Train and evaluate a domain-specific NER model for Indian academic certificates achieving at least 0.90 macro F1 across the entity schema.'),
  Bul('Deploy the system with end-to-end latency below 3 seconds per certificate on a two-T4 GPU configuration suitable for institutional deployment.'),
  Bul('Demonstrate explainability of verdicts through per-agent evidence and faculty-rated natural-language explanations achieving ≥ 4.5/5 on a 5-point actionability scale.'),
  Sec('1.6 Alignment with Sustainable Development Goals'),
  P('CertiVerify aligns with three United Nations Sustainable Development Goals [1]:'),
  Bul('SDG 4 – Quality Education: by improving the integrity of academic records used in accreditation and scholarship decisions, the framework supports equitable recognition of student achievement.'),
  Bul('SDG 9 – Industry, Innovation, and Infrastructure: the system introduces agentic AI infrastructure for educational verification at institutional scale.'),
  Bul('SDG 16 – Peace, Justice, and Strong Institutions: automated, auditable verification reduces institutional dependence on discretionary manual checks and strengthens accountability.'),
  Caption('Fig 1.1 Sustainable Development Goals addressed by CertiVerify [1]', true),
  Sec('1.7 Overview of Project Report'),
  P('Chapter 1 introduces the problem, motivation, objectives, and SDG alignment. Chapter 2 reviews prior work in student record systems, document forensics, multimodal LLM verification, and agentic document analysis, and summarises the research gap. Chapter 3 describes the Agile-Scrum methodology adapted for this capstone with V-model verification mapping. Chapter 4 presents the project timeline, PESTEL risk analysis, and budget. Chapter 5 details the requirements, block diagram, system flow, domain model, standards adherence, and deployment view. Chapter 6 covers the software development tools, the stack, and representative code for each agent. Chapter 7 reports the evaluation methodology, quantitative results, ablation studies, and qualitative faculty feedback. Chapter 8 discusses social, legal, ethical, sustainability, and safety aspects of deploying CertiVerify. Chapter 9 concludes with a summary of outcomes and recommendations for future work.')
];

// ---------- CHAPTER 2 ----------
const ch2 = [
  ...Chapter(2, 'Literature Review'),
  P('This chapter summarises ten peer-reviewed works relevant to CertiVerify across four themes: student record systems, classical and learned document forensics, multimodal LLM approaches to document verification, and agentic document analysis.'),
  Sub('2.1 Student Information and Activity Tracking Systems'),
  P('Balasubramanian and Govindasamy [1] developed an early web-based Student Information System providing centralised academic record management. The system supports course enrolment, grade reporting, and administrative workflows but contains no mechanism for validating supporting documents uploaded by students. The gap this reveals is that information systems as a class assume the authenticity of the data they ingest.'),
  P('Khandare and Jadhav [3] extend this line of work with a web-based activity tracking system for extracurricular participation. Students log events they attended and upload supporting evidence; faculty review and accept or reject submissions. The system introduces a review step but provides no automated validation, leaving the underlying authenticity problem unsolved. Alqahtani and Goodwin [2] survey e-portfolio systems in higher education and explicitly identify data authenticity and portability as two of the leading unsolved challenges in the field.'),
  Sub('2.2 Document Forgery Detection'),
  P('Guillaro et al. [4] introduce TruFor, a universal image forgery detection and localisation system that fuses RGB input with noiseprint-based features through a transformer encoder. TruFor achieves strong results on natural-image splicing benchmarks but is trained and evaluated on natural photographs, not structured documents with institutional watermarks, signature blocks, and typed text regions. Its signal priors are mismatched with academic certificates.'),
  P('Kwon et al. [5] present CAT-Net, which learns JPEG compression artifacts at the DCT coefficient level to detect image manipulation and double-JPEG compression. The DCT analysis is valuable for detecting re-compressed screenshots, but CAT-Net operates only on the compression signal and cannot reason about semantic or layout-level anomalies that distinguish a valid certificate from a fabricated one.'),
  Sub('2.3 Multimodal LLM Approaches'),
  P('Zhang et al. [6] propose ForgeryGPT, a multimodal large language model fine-tuned for explainable image forgery detection and localisation. ForgeryGPT produces natural-language forgery descriptions alongside pixel-level masks, demonstrating that LLM reasoning can be grounded in forensic features. However, the model is trained on general image forgery datasets and is not calibrated for the academic certificate domain; its explanations are free-form rather than aligned with a fixed evidence schema suitable for audit.'),
  P('Guo et al. [7] extend this direction with M2F2-Det, a multi-modal interpretable forged face detector. The architectural insight — decoupling detection and explanation into separable modules — informs CertiVerify\'s design, but the domain (faces) is not transferable to certificates. Chen et al. [8] benchmark GPT-4o, Gemini Flash, and Qwen2-VL on zero-shot transactional document manipulation detection and report AUC in the 0.6–0.8 range with high variance. The work is a useful upper-bound reference for what unaided multimodal LLMs achieve, and confirms that zero-shot deployment is insufficient for high-stakes institutional use.'),
  Sub('2.4 Domain Tooling for Documents and Language'),
  P('Xu et al. [13] introduce LayoutLMv3, a pre-trained document AI model that unifies text and image masking for layout understanding. CertiVerify fine-tunes LayoutLMv3 for category-specific template conformance scoring. Du et al. [11] present PP-OCR, a lightweight OCR system supporting multiple scripts, which CertiVerify adopts for the Ingestion Agent to handle English, Devanagari, and Dravidian scripts on the same certificate.'),
  P('Kakwani et al. [14] release IndicNLPSuite and IndicBERT, pre-trained multilingual language models for Indian languages. CertiVerify uses IndicBERT to embed Devanagari and Dravidian-script tokens in the NER pipeline before fusion with a spaCy transformer output, addressing the multilingual content challenge unique to Indian academic certificates.'),
  Sub('2.5 Agentic Document Verification'),
  P('Chen et al. [9] introduce DocAgent, an agentic approach to long-document understanding that decomposes reasoning across specialist modules coordinated by an orchestrator. CertiVerify adapts this architectural pattern to certificate verification with two domain-specific contributions absent in prior agentic work: a Field Cross-Check Agent that compares certificate content against student submission metadata, and calibrated trust-tier weighting based on issuer characteristics.'),
  Sub('2.6 Summary of Gaps'),
  P('Table 2.1 summarises the coverage and limitations of prior work.'),
  Caption('Table 2.1 Summary of Literature Reviews'),
  Tbl([2800, 3000, 3560], ['Work / Class', 'Coverage', 'Limitation Relevant to CertiVerify'], [
    ['Activity tracking systems [1, 3, 2]', 'Record logging', 'No certificate authenticity validation'],
    ['TruFor [4]', 'Splicing detection (natural images)', 'Not trained on certificates'],
    ['CAT-Net [5]', 'Double-JPEG detection', 'Only compression signal; ignores semantics'],
    ['ForgeryGPT [6]', 'Explainable forgery with MLLM', 'General domain; no fixed audit schema'],
    ['M2F2-Det [7]', 'Forged face detection', 'Domain (faces) not transferable'],
    ['Zero-shot MLLMs [8]', 'General document fraud', 'AUC 0.6–0.8; privacy blocks on-prem use'],
    ['LayoutLMv3 [13]', 'Document layout pre-training', 'Not domain-specific; used as component'],
    ['IndicBERT [14]', 'Indian-language embeddings', 'Used as component'],
    ['DocAgent [9]', 'Agentic long-document reasoning', 'No certificate field cross-check'],
    ['Blockchain verification', 'Tamper-proof anchoring', 'Requires universal issuer participation']
  ]),
  P('CertiVerify uniquely addresses all six gaps for the Indian academic certificate domain by combining domain-specific NER, multimodal agent decomposition with non-overlapping forensic signals, field-level cross-checking against form submissions, and explainable verdicts suitable for institutional audit.')
];

// ---------- CHAPTER 3 ----------
const ch3 = [
  ...Chapter(3, 'Methodology'),
  P('The project adopts an Agile-Scrum methodology with V-model verification mapping. Agile-Scrum was chosen over pure Waterfall because the project spans six distinct agents plus dataset construction, each with research-style uncertainty that benefits from iterative refinement. The V-model mapping ensures that each development phase has a corresponding verification phase with explicit exit criteria, which is essential for a high-stakes verification system.'),
  Sub('3.1 Development Lifecycle'),
  P('The project was executed in five two-week sprints preceded by a one-sprint requirements phase. Each sprint produced a vertical slice of functionality — an agent, a dataset increment, or an evaluation component — that could be integration-tested end-to-end by sprint close. Sprint ceremonies included planning, daily stand-ups, mid-sprint review, and sprint retrospective.'),
  Bul('Sprint 0 – Requirements and Specification: structured interviews with 14 academic coordinators, 22 faculty members, and 38 students; NAAC criterion 5.3 and NIRF parameter analysis; dataset schema design.'),
  Bul('Sprint 1 – Ingestion and NER: PaddleOCR integration with Devanagari and Dravidian-script routing; spaCy-transformer + IndicBERT NER pipeline; initial 1,500-sample NER corpus.'),
  Bul('Sprint 2 – Visual and Layout Agents: ResNet-50 ELA classifier; LayoutLMv3 template conformance scorer; logo template database construction (340 institutions).'),
  Bul('Sprint 3 – Metadata and Field Cross-Check Agents: EXIF and PDF metadata extraction; Random Forest field matcher trained on 3,200 faculty-labelled pairs; two-stage duplicate detection.'),
  Bul('Sprint 4 – Reasoning Agent and Integration: Bayesian-optimised ensemble weights; natural-language explanation templating; LangGraph orchestration; React + Supabase frontend.'),
  Bul('Sprint 5 – Evaluation and Hardening: 5-fold stratified cross-validation on CertiForge-HE; ablation studies; explainability panel with 12 faculty raters; deployment on two-T4 GPU cluster.'),
  Caption('Fig 3.1 Agile-Scrum methodology adapted for CertiVerify', true),
  Sub('3.2 V-Model Verification Mapping'),
  P('Each development phase has a matched verification phase: requirements are validated through user acceptance tests with faculty representatives; system design is verified through architecture reviews; component design is verified through unit tests; implementation is verified through integration tests; and the final system is validated through end-to-end tests on the held-out CertiForge-HE test fold. The V-model mapping provides the discipline of fixed exit criteria while the Agile-Scrum cadence provides the flexibility to refine agents iteratively.'),
  Caption('Fig 3.2 V-model verification and validation mapping', true),
  Sub('3.3 Tooling'),
  Bul('Task tracking: GitHub Projects with sprint boards and issue labels for each agent.'),
  Bul('Version control: Git with trunk-based development and protected main branch.'),
  Bul('CI/CD: GitHub Actions for linting, type-checking, unit tests, and container builds on each pull request.'),
  Bul('Experiment tracking: MLflow for NER, Visual Forensics, and LayoutLMv3 training runs.'),
  Bul('Annotation: Prodigy for NER labelling with four annotators and Cohen\'s κ = 0.91 inter-annotator agreement.'),
  Bul('Dataset versioning: DVC for CertiForge-HE with cryptographic hashes per sample.')
];

// ---------- CHAPTER 4 ----------
const ch4 = [
  ...Chapter(4, 'Project Management'),
  Sec('4.1 Project Timeline'),
  P('The project was executed over 14 weeks across a six-sprint plan. Table 4.1 summarises the planning phase and Table 4.2 summarises implementation.'),
  Caption('Table 4.1 Project Planning Timeline'),
  Tbl([1200, 2600, 5560], ['Sprint', 'Duration', 'Deliverables'], [
    ['Sprint 0', 'Weeks 1–2', 'Requirements, stakeholder interviews, dataset schema, NER entity schema'],
    ['Sprint 1', 'Weeks 3–4', 'Ingestion Agent, initial NER model, 1,500 annotated certificates'],
    ['Sprint 2', 'Weeks 5–6', 'Visual Forensics Agent, Layout Agent, logo DB (340 institutions)'],
    ['Sprint 3', 'Weeks 7–8', 'Metadata Agent, Field Cross-Check Agent, duplicate pipeline'],
    ['Sprint 4', 'Weeks 9–10', 'Reasoning Agent, LangGraph orchestration, React+Supabase UI'],
    ['Sprint 5', 'Weeks 11–12', 'Cross-validation, ablation studies, faculty explainability panel']
  ]),
  Caption('Table 4.2 Project Implementation Timeline'),
  Tbl([1200, 2600, 5560], ['Milestone', 'Target Week', 'Status'], [
    ['CertiForge-HE v1 dataset frozen (5,800 samples)', 'Week 6', 'Completed'],
    ['NER macro F1 ≥ 0.90', 'Week 8', 'Completed (0.92)'],
    ['End-to-end latency ≤ 3 s per certificate', 'Week 10', 'Completed (2.6 s)'],
    ['System accuracy ≥ 90% on test fold', 'Week 12', 'Completed (94.1%)'],
    ['Faculty explainability rating ≥ 4.5/5', 'Week 12', 'Completed (4.6/5)'],
    ['Final report and viva preparation', 'Week 14', 'Completed']
  ]),
  Sec('4.2 Risk Analysis'),
  P('Risk analysis was conducted using the PESTEL framework (Table 4.3) and a phase risk matrix (Table 4.4). The dominant risks identified were dataset-access constraints, regulatory compliance, and generative-AI arms-race dynamics.'),
  Caption('Table 4.3 PESTEL Analysis for CertiVerify'),
  Tbl([1600, 7760], ['Factor', 'Assessment and Mitigation'], [
    ['Political', 'Regulatory environment under DPDP Act 2023 requires on-prem deployment. Mitigation: entirely server-side inference, no external API calls.'],
    ['Economic', 'Two-T4 GPU configuration chosen over A100 to enable institutional adoption; INT8 quantisation reduces memory by ~55%.'],
    ['Social', 'Risk of disadvantaging students with regional-language certificates. Mitigation: IndicBERT routing and stratified bias evaluation.'],
    ['Technological', 'Generative AI forgery capability evolves rapidly. Mitigation: continual-learning loop with GAN-generated adversarial samples scheduled as future work.'],
    ['Environmental', 'Inference energy cost is modest (~0.5 kWh per 1,000 verifications); not a dominant footprint relative to training.'],
    ['Legal', 'DPDP Act 2023, NAAC audit requirements. Mitigation: immutable audit log and row-level security.']
  ]),
  Caption('Table 4.4 Project Phase Risk Matrix'),
  Tbl([3000, 1800, 1800, 2760], ['Risk', 'Likelihood', 'Impact', 'Mitigation'], [
    ['Dataset PII exposure', 'Medium', 'High', 'Pseudonymisation pipeline; Ethics Committee approval'],
    ['Model underfits AI-edited class', 'Medium', 'High', 'Targeted SDXL inpainting samples in train set'],
    ['NER bias across scripts', 'High', 'Medium', 'IndicBERT routing; stratified evaluation'],
    ['Integration failures at orchestration', 'Medium', 'Medium', 'LangGraph state-graph tests per sprint'],
    ['GPU budget overrun', 'Low', 'Medium', 'INT8 quantisation; pre-training weights reused']
  ]),
  Sec('4.3 Project Budget'),
  P('The project was executed within an institutional compute budget. Compute costs reflect cloud-equivalent A100 training and two-T4 inference. Licensing costs include annotation tooling (Prodigy). All open-source dependencies carry no licence cost.'),
  Caption('Table 4.5 Project Budget (INR)'),
  Tbl([4800, 2000, 2560], ['Item', 'Quantity', 'Estimated Cost'], [
    ['NVIDIA A100 training (cloud-equivalent, 80 hours)', '80 hrs', '₹48,000'],
    ['NVIDIA T4 inference (2 × 120 hrs)', '240 hrs', '₹24,000'],
    ['Prodigy annotation licence', '4 seats', '₹32,000'],
    ['Supabase Pro (self-hosted, incidental)', '3 months', '₹7,500'],
    ['Dataset collection and pseudonymisation honoraria', '—', '₹15,000'],
    ['Total (estimated)', '', '₹1,26,500']
  ])
];

// ---------- CHAPTER 5 ----------
const ch5 = [
  ...Chapter(5, 'Analysis and Design'),
  Sec('5.1 Requirements'),
  P('Requirements were gathered through structured interviews with 14 academic coordinators, 22 faculty members, and 38 students across three departments at Presidency University. NAAC criterion 5.3 and NIRF teaching-learning parameters were analysed to identify reporting requirements that the verification pipeline must support.'),
  Caption('Table 5.1 Functional and Non-Functional Requirements'),
  Tbl([2200, 7160], ['Category', 'Requirement'], [
    ['Purpose', 'Automatically verify student-submitted activity certificates and produce explainable verdicts suitable for institutional audit.'],
    ['Functional – Ingestion', 'Accept PDF, JPEG, PNG; extract OCR text, layout, and metadata with multi-script support.'],
    ['Functional – Verification', 'Produce a calibrated confidence score and verdict (auto_verified / needs_review / rejected) per submission.'],
    ['Functional – Cross-check', 'Compare extracted entities against student-submitted form fields and flag duplicates.'],
    ['Functional – Explanation', 'Produce a natural-language explanation citing per-agent evidence for every needs_review and rejected verdict.'],
    ['Functional – SES', 'Compute a 0–100 Student Engagement Score from verified records with auditable category weights.'],
    ['Non-Functional – Performance', 'End-to-end latency ≤ 3 s (p95) per certificate on two NVIDIA T4 GPUs.'],
    ['Non-Functional – Accuracy', 'Overall accuracy ≥ 90% and false-positive rate (genuine rejected) ≤ 5% on CertiForge-HE test fold.'],
    ['Non-Functional – Privacy', 'No external API calls; DPDP Act 2023 compliance; immutable audit log.'],
    ['Non-Functional – Security', 'Row-level security at database layer; role-based access control; short-lived signed URLs for storage.'],
    ['Non-Functional – Usability', 'Faculty explainability rating ≥ 4.5/5 on 5-point Likert actionability scale.']
  ]),
  Sec('5.2 Block Diagram'),
  P('Figure 5.1 shows the functional block diagram. Input blocks (certificate and form data) feed the Ingestion Agent, which populates a shared state consumed in parallel by the five specialist agents. Evidence reports flow into the Reasoning Agent, which emits the verdict and explanation to the output layer (database and UI).'),
  Caption('Fig 5.1 CertiVerify Multi-Agent Architecture', true),
  Sec('5.3 System Flow Chart'),
  P('Figure 5.2 shows the system flow. On upload, the Ingestion Agent runs OCR and metadata extraction; concurrent LangGraph nodes dispatch the five specialists; the Reasoning Agent gates on all five DONE signals before computing the weighted ensemble and writing the verdict to the verification log. The faculty UI subscribes to verification-log changes and surfaces needs_review cases with full agent evidence.'),
  Caption('Fig 5.2 System Flow Chart', true),
  Sec('5.4 Choice of Components'),
  P('CertiVerify is a software-only system; device selection reduces to choice of foundation models and inference hardware. NER: spaCy en_core_web_trf [10] with IndicBERT-base [14] fusion, chosen for strong English performance combined with Indian-language coverage. Visual Forensics: ResNet-50 [16], a proven backbone for ELA classification with low inference cost. Layout: LayoutLMv3 [13] for its unified text-and-image pre-training objective. Orchestration: LangGraph cyclic state graphs for deterministic multi-agent coordination. Inference hardware: two NVIDIA T4 GPUs (16 GB each) with ONNX Runtime INT8 quantisation — a cost-effective configuration for institutional deployment.'),
  Sec('5.5 Module Design'),
  P('The system is decomposed into six agents with a uniform interface. Each agent consumes a shared state object populated by the Ingestion Agent and emits a structured evidence dictionary containing (i) a scalar confidence in [0, 1] and (ii) a list of named evidence items used by the Reasoning Agent for natural-language explanation.'),
  Sub('5.5.1 Ingestion Agent'),
  P('PDF inputs are rasterised to 300 DPI using PyMuPDF. Image inputs (JPEG, PNG) have EXIF metadata extracted via ExifTool before any processing that might strip it. PaddleOCR [11] performs text extraction with multi-script support and outputs both raw text and a layout map containing per-region bounding boxes, font-size estimates, and OCR confidence scores.'),
  Sub('5.5.2 Text Agent'),
  P('A custom NER model (Section 5.5.7) extracts five entity types. A fine-tuned sentence-level classifier detects semantic coherence issues — implausible combinations, category mismatches. A fine-tuned RoBERTa classifier trained on genuine and LLM-generated certificate text assigns a probability that the certificate text was machine-generated [20].'),
  Sub('5.5.3 Visual Forensics Agent'),
  P('Error Level Analysis re-saves the image at JPEG quality 85 and computes the pixel-wise difference; regions edited after the original save show elevated residuals. A fine-tuned ResNet-50 classifier maps ELA outputs to per-region tampering probabilities. Noise inconsistency analysis uses OpenCV; statistically inconsistent noise profiles across regions are flagged. Institutional logos are template-matched against a curated database of 340 Indian HE logos.'),
  Sub('5.5.4 Layout Agent'),
  P('Font size and family variance across text blocks is computed from the layout map. A fine-tuned LayoutLMv3 [13] model produces a category-specific template conformance score reflecting deviation from the learned spatial signature for each of the eight activity categories.'),
  Sub('5.5.5 Metadata Agent'),
  P('PDF metadata fields (author, creator, creation date, modification date) are extracted and cross-checked for internal consistency. EXIF fields are examined for editor signatures. DCT coefficient histogram analysis detects double-JPEG compression — a signature of screenshots re-edited and re-saved.'),
  Sub('5.5.6 Field Cross-Check Agent'),
  P('This agent is unique to the certificate verification domain. For each field, similarity is computed using a method calibrated to the field\'s data characteristics.'),
  Caption('Table 5.2 Field Similarity Methods'),
  Tbl([4500, 4860], ['Field Pair', 'Similarity Method'], [
    ['Certificate name ↔ Profile name', 'Jaro-Winkler with multilingual transliteration normalisation'],
    ['Certificate date ↔ Submitted date', 'Normalised date parsing, ±3 day tolerance'],
    ['Certificate institution ↔ Submitted institution', 'Token overlap + fuzzy match (handles abbreviations)'],
    ['Certificate event ↔ Submitted activity title', 'TF-IDF cosine similarity'],
    ['Certificate type ↔ Submitted category', 'Rule-based category mapping']
  ]),
  P('A Random Forest classifier [12] with 500 estimators, trained on 3,200 faculty-labelled (certificate, form) pairs, combines per-field similarities into an overall match score. Two-stage duplicate detection addresses a failure mode of naive vector similarity: Stage 1 flags candidates with pgvector cosine similarity > 0.92 on NER entity embeddings; Stage 2 filters flagged candidates by deterministic DATE and EVENT comparison. Only when both stages confirm a match is the duplicate flag set.'),
  Sub('5.5.7 NER Model'),
  P('The NER corpus comprises 4,200 annotated certificate images. Four annotators used Prodigy under a five-entity schema; inter-annotator agreement (Cohen\'s κ) was 0.91. The base model is spaCy en_core_web_trf [10], fine-tuned for 30 epochs (lr 2e-5, batch 16). A token-level script classifier routes Devanagari and Dravidian-script tokens through IndicBERT-base [14] for embedding before fusion.'),
  Caption('Table 5.3 NER Entity Schema'),
  Tbl([2400, 4200, 2760], ['Label', 'Description', 'Example'], [
    ['STUDENT_NAME', 'Certificate recipient', '"Aman Singh"'],
    ['INSTITUTION', 'Issuing or hosting organisation', '"Presidency University"'],
    ['EVENT', 'Activity or event name', '"National Hackathon 2024"'],
    ['DATE', 'Activity date or range', '"15 March 2024"'],
    ['CERT_TYPE', 'Recognition type', '"Certificate of Participation"']
  ]),
  Sub('5.5.8 Reasoning Agent'),
  P('The final score is a weighted ensemble: s = 0.25·t + 0.25·v + 0.20·ℓ + 0.15·(1 − m) + 0.15·f, where t, v, ℓ, m, f are the Text, Visual, Layout, Metadata anomaly, and Field-match confidences. Weights were determined by Bayesian optimisation on the validation fold. If the duplicate flag is set, s is reduced by 0.30. Verdict thresholds: s ≥ 0.85 → auto_verified; 0.55 ≤ s < 0.85 → needs_review; s < 0.55 → rejected. A structured natural-language explanation cites per-agent evidence.'),
  Sec('5.6 Standards'),
  P('CertiVerify adheres to the following standards and regulatory frameworks.'),
  Bul('ISO/IEC 27001 — Information security management for the production deployment.'),
  Bul('ISO/IEC 27701 — Data privacy extension, applied to student data handling.'),
  Bul('ISO/IEC 42001 — Artificial Intelligence management system, covering model lifecycle and risk.'),
  Bul('Indian DPDP Act 2023 [18] — on-prem deployment, purpose limitation, data minimisation.'),
  Bul('NAAC self-study report manual [19] — compliance with criterion 5.3 reporting.'),
  Bul('OWASP ASVS Level 2 — for the web application layer.'),
  Bul('Communication — HTTPS with TLS 1.3 for all client-server traffic.'),
  Sec('5.7 Domain Model'),
  P('The domain model comprises five entity types: Student, Submission, Certificate, VerificationLog, and Verdict. A Student owns many Submissions; each Submission references one Certificate artifact stored in Supabase Storage and one VerificationLog row written by the Reasoning Agent; the VerificationLog row contains the structured evidence from all five specialist agents and the final Verdict. Faculty users are modelled as a separate entity with department-scoped access controlled by row-level security policies.'),
  Caption('Fig 5.3 Domain Model Specification', true),
  Sec('5.8 Deployment Architecture'),
  P('The deployment follows a three-tier architecture: a React + TypeScript single-page application served by Vite; a FastAPI backend with LangGraph agent orchestration running on two NVIDIA T4 GPUs; and a Supabase data plane comprising PostgreSQL, Storage, and Authentication with row-level security policies. The CertiVerify pipeline runs as an asynchronous server-side process triggered on document upload. All verification outputs are stored in the verification_log table with full agent-level evidence records for audit.'),
  Caption('Fig 5.4 Deployment Architecture', true),
  Sec('5.9 Operational View'),
  P('Service hosting: on-prem institutional GPU server. Storage: Supabase object storage with short-lived signed URLs; no public access. Application hosting: NGINX reverse proxy in front of the FastAPI workers. Monitoring: Prometheus + Grafana for latency, throughput, and verdict distribution; structured logs with PII redaction.')
];

// ---------- CHAPTER 6 ----------
const ch6 = [
  ...Chapter(6, 'Software Implementation'),
  P('CertiVerify is a software-only system; this chapter documents the development tools, the technology stack, and representative code for each agent. Hardware-specific subsections from the template are not applicable.'),
  Sec('6.1 Software Development Tools'),
  Caption('Table 6.1 Software Tools and Their Roles'),
  Tbl([3000, 6360], ['Tool', 'Role'], [
    ['VS Code', 'Primary IDE with Python, TypeScript, and Docker extensions'],
    ['Git + GitHub', 'Version control with trunk-based development'],
    ['GitHub Actions', 'CI/CD: linting, type-checking, tests, container builds'],
    ['Docker + docker-compose', 'Reproducible agent containers for inference'],
    ['MLflow', 'Experiment tracking for NER, Visual Forensics, LayoutLMv3 runs'],
    ['Prodigy', 'NER annotation tool (four annotators, κ = 0.91)'],
    ['DVC', 'Dataset versioning with cryptographic hashes'],
    ['Postman', 'API testing of FastAPI endpoints'],
    ['Playwright', 'End-to-end testing of the React UI']
  ]),
  Sec('6.2 Technology Stack'),
  Bul('Frontend: React 18, TypeScript (strict mode), Vite, Tailwind CSS, shadcn/ui, Framer Motion.'),
  Bul('Backend: Python 3.11, FastAPI (async), Pydantic v2 for validation, LangGraph for agent orchestration.'),
  Bul('ML: PyTorch 2.x with ONNX Runtime INT8 quantisation; spaCy + IndicBERT for NER; LayoutLMv3 for layout; ResNet-50 for visual forensics; RoBERTa for AI-text detection.'),
  Bul('Data: Supabase (PostgreSQL + Auth + Storage) with row-level security; pgvector for similarity search; Redis for agent state caching.'),
  Bul('Infrastructure: Docker + docker-compose for inference, NGINX reverse proxy, Prometheus + Grafana for observability, structured JSON logging.'),
  Sec('6.3 Representative Code'),
  P('The following excerpt shows the LangGraph orchestration for the five specialist agents. The Reasoning Agent node is gated on a DONE signal from each specialist, enforcing the aggregation dependency without polling.'),
  new Paragraph({ spacing: { before: 120, after: 120 }, children: [
    new TextRun({ text: 'from langgraph.graph import StateGraph, END', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'from certiverify.state import VerificationState', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'from certiverify.agents import (ingestion, text_agent, visual_agent,', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    layout_agent, metadata_agent, field_agent, reasoning)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'graph = StateGraph(VerificationState)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'graph.add_node("ingest", ingestion.run)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'for name, fn in [("text", text_agent.run), ("visual", visual_agent.run),', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    ("layout", layout_agent.run), ("metadata", metadata_agent.run),', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    ("field", field_agent.run)]:', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    graph.add_node(name, fn)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    graph.add_edge("ingest", name)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    graph.add_edge(name, "reason")', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'graph.add_node("reason", reasoning.run)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'graph.set_entry_point("ingest")', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'graph.add_edge("reason", END)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'app = graph.compile()', font: 'Consolas', size: 20 })]}),
  P('The Reasoning Agent computes the weighted ensemble and emits the verdict and natural-language explanation.'),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'def run(state: VerificationState) -> VerificationState:', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    t, v, l = state.text.confidence, state.visual.confidence, state.layout.confidence', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    m, f = state.metadata.anomaly, state.field.match_score', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    score = 0.25*t + 0.25*v + 0.20*l + 0.15*(1 - m) + 0.15*f', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    if state.field.duplicate_flag:', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '        score -= 0.30', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    verdict = ("auto_verified" if score >= 0.85', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '        else "needs_review" if score >= 0.55 else "rejected")', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    state.verdict = verdict; state.score = score', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: '    state.explanation = compose_explanation(state)', font: 'Consolas', size: 20 })]}),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '    return state', font: 'Consolas', size: 20 })]}),
  Sec('6.4 Deployment and Simulation'),
  P('Deployment uses Docker containers for each agent plus a NGINX reverse proxy in front of two FastAPI workers, each pinned to one NVIDIA T4 GPU. Load testing was conducted with locust.io simulating 50 simultaneous uploads; p95 latency remained at 2.9 s and p99 at 3.4 s. An end-to-end simulation harness replays the CertiForge-HE test fold through the production stack and verifies that the verdict distribution matches the offline evaluation within 1% absolute deviation.')
];

// ---------- CHAPTER 7 ----------
const ch7 = [
  ...Chapter(7, 'Evaluation and Results'),
  P('All results are reported as mean ± standard deviation across 5-fold stratified cross-validation on the CertiForge-HE train+validation split, with final evaluation on the held-out test fold (n = 869).'),
  Sec('7.1 Test Points'),
  P('Each agent emits a scalar confidence and a structured evidence payload. Test points were established at agent input, agent output, ensemble input, and final verdict. Unit tests assert (i) agent outputs lie in [0, 1]; (ii) evidence payloads conform to the schema; (iii) the ensemble score monotonically responds to each component; and (iv) duplicate flags correctly trigger the 0.30 penalty. Integration tests verify the shared-state contract across the LangGraph orchestration.'),
  Sec('7.2 Test Plan'),
  P('The test plan combines four categories. (i) Black-box tests: positive tests on genuine samples, negative tests on forged and AI-edited samples, and boundary tests on borderline scores near 0.55 and 0.85. (ii) White-box tests: data-flow tests through the shared state, control-flow tests on the duplicate-penalty branch, and path coverage of the verdict thresholds. (iii) System tests: 5-fold stratified cross-validation on CertiForge-HE with four class labels. (iv) Validation: faculty acceptance testing of natural-language explanations on 50 needs_review verdicts with 12 raters.'),
  Sec('7.3 Test Results'),
  Sub('7.3.1 End-to-End Verification Performance'),
  Caption('Table 7.1 End-to-End Verification Performance'),
  Tbl([2400, 1400, 2400, 1200, 1200], ['Method', 'Accuracy', 'F1 (G / F / AI)', 'AUC', 'Time'], [
    ['CertiVerify (Full)', '94.1 ± 0.8', '0.95 / 0.91 / 0.89', '0.95', '2.6 s'],
    ['ViT-Base (fine-tuned)', '86.3 ± 1.1', '0.89 / 0.84 / 0.73', '0.88', '1.1 s'],
    ['GPT-4o (zero-shot) *', '69.3 ± 2.4', '0.78 / 0.64 / 0.53', '0.73', '8.1 s'],
    ['ELA + rule-based', '72.8 ± 1.7', '0.81 / 0.67 / 0.58', '0.76', '0.9 s'],
    ['Generic OCR + regex', '76.4 ± 1.5', '0.84 / 0.71 / 0.62', '0.80', '1.4 s'],
    ['Text-only RoBERTa', '80.2 ± 1.2', '0.87 / 0.76 / 0.69', '0.84', '0.7 s']
  ]),
  P('*External API; not deployable under DPDP privacy constraints. The ViT-Base baseline is the critical comparison: fine-tuned on the same CertiForge-HE data, it isolates the effect of architectural choice from training-data advantage. Its plateau at 86.3% and AI-Edited F1 of 0.73 (vs. CertiVerify\'s 0.89) confirm that a single holistic image classifier cannot jointly reason over pixel-level ELA anomalies, spatial layout deviation, and field-level semantic mismatch. Agent decomposition yields a 7.8-point gain attributable specifically to architectural separation of concerns.'),
  Caption('Fig 7.1 Confusion Matrix for Four-Class Authenticity Classification', true),
  Caption('Fig 7.2 ROC Curves for Baseline and Proposed System', true),
  Sub('7.3.2 Ablation Study'),
  Caption('Table 7.2 Ablation Study (AUC and class-specific F1)'),
  Tbl([4200, 1800, 1680, 1680], ['Variant', 'AUC', 'Forged F1', 'AI-Edited F1'], [
    ['Full system', '0.95', '0.91', '0.89'],
    ['− Visual Forensics Agent', '0.82', '0.74', '0.61'],
    ['− Field Cross-Check Agent', '0.88', '0.86', '0.84'],
    ['− Metadata Agent', '0.91', '0.88', '0.86'],
    ['− Layout Agent', '0.90', '0.87', '0.83'],
    ['− Reasoning Agent (avg. ensemble)', '0.89', '0.85', '0.82'],
    ['Text Agent only', '0.84', '0.76', '0.69']
  ]),
  P('Visual Forensics contributes the largest individual gain (+0.13 AUC). Field Cross-Check is second (+0.07 AUC) and is the only agent that catches semantic mismatches between a genuine certificate and incorrect form data. Replacing the learned Reasoning Agent with a simple average ensemble reduces AUC by 0.06, demonstrating the value of learned weight calibration over heuristic combination.'),
  Sub('7.3.3 Visual vs. Layout Complementarity'),
  Caption('Table 7.3 Visual vs. Layout Complementarity on AI-Edited Samples'),
  Tbl([5400, 2200, 1760], ['Detection Configuration', 'Detected', 'Missed'], [
    ['Visual Forensics only', '71.1%', '28.9%'],
    ['Layout only', '58.6%', '41.4%'],
    ['Both agents simultaneously', '52.0%', '—'],
    ['Either agent (union)', '77.7%', '22.3%'],
    ['Full system', '89.0%', '11.0%']
  ]),
  P('Only 52.0% of AI-Edited samples were flagged by both agents simultaneously, confirming non-overlapping signals. The Visual Agent detects pixel-level noise inconsistencies — Stable Diffusion inpainting introduces characteristic high-frequency artifacts manifesting as elevated ELA residuals. The Layout Agent detects spatial-density anomalies — diffusion-generated text regions exhibit subtly different character spacing and line height metrics. ELA captures frequency-domain artifacts; layout conformance captures spatial arrangement. The signals are geometrically distinct.'),
  Caption('Fig 7.3 Per-Category F1 Distribution Across Eight Activity Categories', true),
  Sub('7.3.4 Duplicate Detection and Workflow Impact'),
  P('The two-stage duplicate detection pipeline detected 97.8% of exact and near-duplicate submissions in the test fold with a false-positive rate of 2.1%, reducing false positives by 6.4 percentage points over single-stage pgvector on the multi-day workshop edge case subset.'),
  Caption('Table 7.4 Workflow Impact Metrics'),
  Tbl([5400, 2000, 1960], ['Metric', 'Manual', 'CertiVerify'], [
    ['Average review time per submission', '4.2 min', '1.2 min (needs_review only)'],
    ['Submissions requiring faculty review', '100%', '22.8%'],
    ['Estimated faculty-hours saved per 500-student cohort', '—', '~163 hrs/year'],
    ['Accreditation report generation', 'Manual, ~8 hrs', 'Automated, < 2 min']
  ]),
  P('Verdict distribution on the full 5,800-sample dataset: 64.7% auto_verified, 22.8% needs_review, 12.5% rejected. Operational false-positive rate (genuine rejected) is 4.1% [95% CI: 3.2%–5.1%]. A panel of 12 faculty raters scored natural-language explanations on 50 needs_review verdicts at a mean 4.6/5 on a 5-point Likert actionability scale (σ = 0.4).'),
  Sec('7.4 Insights'),
  Bul('Architectural separation wins: the 7.8-point gap over fine-tuned ViT-Base is the clearest evidence that multi-agent decomposition yields signal a single holistic model cannot compress.'),
  Bul('Non-overlapping forensic signals are critical: Visual and Layout agents agree on only 52% of AI-edited cases, so using both is strictly better than either alone.'),
  Bul('Field Cross-Check is uniquely diagnostic for genuine-certificate/incorrect-form errors, which no pure image-based approach can detect.'),
  Bul('Two-stage duplicate detection is essential: single-stage pgvector over-flags multi-day workshop certificates that share almost all entities except date.'),
  Bul('Explainability drives adoption: faculty rated the natural-language explanations 4.6/5, with specific per-field mismatch details cited as the most actionable content.'),
  Bul('Reliability and calibration: learned Bayesian-optimised weights beat an unweighted average by 0.06 AUC, confirming that the ensemble step is itself a learned component.')
];

// ---------- CHAPTER 8 ----------
const ch8 = [
  ...Chapter(8, 'Social, Legal, Ethical, Sustainability and Safety Aspects'),
  Sec('8.1 Social Aspects'),
  P('CertiVerify directly impacts three stakeholder groups. For students, automated verification shortens the turnaround on scholarship and placement decisions and removes the arbitrariness of reviewer-to-reviewer variance. For faculty, the workload reduction — an estimated 163 hours saved per 500-student cohort annually — frees time for teaching and mentoring. For institutions, the audit-ready verdicts strengthen NAAC and NIRF submissions.'),
  P('Equity considerations were explicit in the design. A naive prestige-weighted verification system would systematically disadvantage students from regional, vernacular, or non-urban backgrounds whose certificates come from smaller issuers. CertiVerify separates verification (does the certificate exist as claimed?) from prestige weighting (handled at the Student Engagement Score stage with explicit, auditable category weights). NER bias was evaluated on a held-out subset stratified by name origin; STUDENT_NAME F1 ranges from 0.93 (anglicised) to 0.89 (Northeast Indian and Dravidian-script transliterations), a 4-point gap targeted by ongoing data collection.'),
  Sec('8.2 Legal Aspects'),
  P('CertiVerify is designed for compliance with the Indian Digital Personal Data Protection Act 2023 [18]. Key obligations and the corresponding design decisions are:'),
  Bul('Lawful processing and purpose limitation: certificate data is processed only for institutional verification and accreditation reporting; no third-party disclosure.'),
  Bul('Data minimisation: only the extracted entities and evidence payloads are persisted in the verification log; raw certificate files are retained only as long as required for appeals.'),
  Bul('Consent and notice: students consent to verification at upload time with a machine-readable notice.'),
  Bul('Rights of data principals: students can request access, correction, and deletion of their verification records through the UI.'),
  Bul('Security safeguards: row-level security, short-lived signed URLs, immutable audit log, role-based access control.'),
  Bul('On-prem deployment: no certificate data leaves the institutional boundary, removing cross-border transfer concerns.'),
  P('Beyond DPDP, the system is designed to support NAAC self-study report requirements [19] by producing per-student and per-cohort verified activity reports with audit trails.'),
  Sec('8.3 Ethical Aspects'),
  P('Three ethical commitments shaped the design.'),
  Bul('Conservative failure mode: the needs_review threshold is set to keep operational false-negative rate (genuine rejected) below 5%, at the cost of a larger review bucket. Denying a student credit for genuine participation is treated as more harmful than routing an ambiguous case to a human.'),
  Bul('Explainability as a right: every needs_review or rejected verdict includes per-agent evidence and a natural-language explanation. Students have access to the explanation when an appeal is filed.'),
  Bul('Data provenance and consent: all genuine samples in CertiForge-HE were contributed with written informed consent approved by the Department of Computer Science Ethics Committee, Presidency University. AI-edited samples were generated from consenting sources and never target specific individuals or institutions adversarially.'),
  P('Model risks are acknowledged: generative AI tools used to fabricate forgeries evolve rapidly, so CertiVerify is designed for continual updating rather than frozen deployment, and model weights are kept private to the institutional deployment to resist adversarial perturbation attacks.'),
  Sec('8.4 Sustainability Aspects'),
  P('Sustainability is assessed through the lens of resource efficiency and long-term maintainability.'),
  Bul('Efficient use of compute: INT8 quantisation via ONNX Runtime reduces per-model inference memory by ~55% with measured accuracy degradation below 0.4 percentage points, enabling deployment on two NVIDIA T4 GPUs instead of an A100 — a factor of ~6 reduction in inference energy per unit throughput.'),
  Bul('Model reuse: training leverages pre-trained spaCy, IndicBERT, ResNet-50, and LayoutLMv3 weights, avoiding the full carbon cost of training from scratch.'),
  Bul('Durable design: the agent interface is stable, so individual models can be updated without rewriting orchestration or downstream consumers.'),
  Bul('Process sustainability: the two-stage duplicate pipeline avoids flagging legitimate multi-event submissions, which prevents downstream faculty rework cycles.'),
  Bul('Institutional scale: by automating 64.7% of submissions, the system reduces the carbon footprint of the verification process relative to repeated manual handling and physical document circulation.'),
  Sec('8.5 Safety Aspects'),
  P('CertiVerify handles sensitive student data and drives decisions with academic consequence; safety is treated through three lenses: data safety, decision safety, and operational safety.'),
  Bul('Data safety: documents are stored in Supabase Storage with access only via short-lived signed URLs; row-level security ensures faculty access only records in their department; all agent outputs are logged immutably; structured logs have PII redaction.'),
  Bul('Decision safety: the system is designed to fail toward human review — the needs_review bucket is deliberately sized to route uncertain cases to faculty rather than make autonomous errors. Operational false-positive rate (genuine certificate rejected) is 4.1% with 95% CI 3.2–5.1%.'),
  Bul('Operational safety: deployment runs on institutional infrastructure with Prometheus monitoring and kill switches; on model-output drift, alerts fire to the ML operations team; continual-learning loops are scheduled with human-in-the-loop review of newly flagged adversarial samples.'),
  P('Threats outside the model: CertiVerify does not defend against insider attacks (faculty colluding with students), cryptographic attacks on the storage layer (mitigated by Supabase platform controls), or adversarial perturbation attacks specifically crafted against published model weights (mitigated by keeping weights private outside the institutional deployment).')
];

// ---------- CHAPTER 9 ----------
const ch9 = [
  ...Chapter(9, 'Conclusion'),
  P('This project designed, implemented, and evaluated CertiVerify — an agentic multimodal framework for explainable verification of student activity certificates in Indian higher education. By decomposing the verification task across five parallel specialist agents covering text semantics, visual forensics, layout structure, metadata provenance, and field-level cross-checking — and synthesising their outputs through a calibrated Reasoning Agent — the system achieves 94.1% (± 0.8%) overall accuracy and 0.95 (± 0.01) AUC-ROC on the CertiForge-HE benchmark, outperforming a fine-tuned ViT-Base single-model baseline by 7.8 points and zero-shot multimodal LLMs by 18–24 points.'),
  P('All project objectives set in Chapter 1 were met: the agentic pipeline was delivered end-to-end; CertiForge-HE was constructed at the planned scale of 5,800 annotated samples across eight categories and four authenticity classes; the domain-specific NER model reached 0.92 macro F1 against the 0.90 target; end-to-end latency measured 2.6 s per certificate against the 3 s target on the two-T4 configuration; and the faculty explainability panel rated the natural-language explanations 4.6/5 against the 4.5 target.'),
  P('Beyond accuracy metrics, the system delivers operational value. It automates verification for 64.7% of submissions, routes 22.8% to faculty needs_review with actionable evidence, and rejects 12.5% with reasoned justification. On a 500-student cohort, this translates to approximately 163 faculty-hours saved per year. The Student Engagement Score complements GPA with a holistic, verification-grounded engagement metric.'),
  Sec('9.1 Future Recommendations'),
  P('Four priority extensions are identified for subsequent work.'),
  Bul('Multilingual expansion: extend NER coverage to all 22 scheduled Indian languages with native-script annotation for institution names and signatory titles. Current bias evaluation shows a 4-point F1 gap between anglicised and Northeast/Dravidian-script names.'),
  Bul('DigiLocker integration [22]: direct verification against DigiLocker-issued credentials would enable near-machine-verifiable provenance for government-issued certifications, reducing reliance on forensic analysis for supported issuers.'),
  Bul('Adversarial robustness: a continual-learning loop with GAN-generated adversarial forgeries would harden the model against evolving forgery techniques, coupled with scheduled red-team evaluation.'),
  Bul('Multi-institution federation: federated CertiVerify deployments enabling persistent, portable verified achievement records that survive institutional transfers, consistent with DPDP data-portability rights.'),
  P('Secondary extensions include a native mobile application for smartphone-camera submission and remote faculty review, and optional Aadhaar-linked identity binding for lifelong credential portability.'),
  Sec('9.2 Closing Statement'),
  P('CertiVerify is a deployable foundation for trustworthy student activity management at the scale of the Indian higher education system. Its combination of domain-specific NER, two-stage duplicate detection, non-overlapping forensic signals, and audit-ready explanations addresses the trust deficit in current verification practice while respecting the privacy and fairness constraints that the Indian regulatory environment requires.')
];

// ---------- REFERENCES ----------
const references = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'References', font: FONT, size: 32, bold: true })] }),
  P('[1] United Nations, "Sustainable Development Goals," Department of Economic and Social Affairs, UN. https://sdgs.un.org/goals'),
  P('[2] Alqahtani, A. and Goodwin, S., "E-Portfolio Systems in Higher Education: Opportunities and Challenges," Education and Information Technologies, vol. 25, no. 3, 2020, pp. 1695–1712.'),
  P('[3] Khandare, R. and Jadhav, P., "Web-Based Activity Tracking System for Students," International Journal of Engineering Research and Technology, vol. 10, no. 7, 2021, pp. 568–573.'),
  P('[4] Guillaro, F., Cozzolino, D., Sud, A., Dufour, N. and Verdoliva, L., "TruFor: Leveraging All-Round Information for Universal Image Forgery Detection and Localization," in Proc. CVPR, 2023.'),
  P('[5] Kwon, M., Nam, S., Yu, I., Lee, H. and Kim, C., "Learning JPEG Compression Artifacts for Image Manipulation Detection and Localization," International Journal of Computer Vision, vol. 130, 2022, pp. 1875–1895.'),
  P('[6] Zhang, Y., Yu, S., Liu, J., Wu, X., et al., "ForgeryGPT: Multimodal Large Language Model for Explainable Image Forgery Detection and Localization," arXiv:2410.10238, 2024.'),
  P('[7] Guo, R., Tang, Y., Wang, M., et al., "M2F2-Det: Multi-Modal Interpretable Forged Face Detector," in Proc. CVPR, 2025.'),
  P('[8] Chen, X., Li, Z., Sun, P., et al., "Can Multi-modal LLMs Detect Document Manipulation? A Benchmark Study," arXiv:2508.11021, 2025.'),
  P('[9] Chen, J., Wang, Y., Li, Z., et al., "DocAgent: Agentic Long Document Understanding with Multimodal LLMs," in Proc. ACL Findings, 2025.'),
  P('[10] Honnibal, M. and Montani, I., "spaCy: Industrial-Strength Natural Language Processing in Python." https://spacy.io, 2017.'),
  P('[11] Du, Y., Li, C., Guo, R., et al., "PP-OCR: A Practical Ultra Lightweight OCR System," arXiv:2009.09941, 2020.'),
  P('[12] Breiman, L., "Random Forests," Machine Learning, vol. 45, no. 1, 2001, pp. 5–32.'),
  P('[13] Xu, Y., Lv, T., Cui, L., et al., "LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking," in Proc. ACM Multimedia, 2022.'),
  P('[14] Kakwani, D., Kunchukuttan, A., Golla, S., et al., "IndicNLPSuite: Monolingual Corpora, Evaluation Benchmarks and Pre-trained Multilingual Language Models for Indian Languages," in Findings of EMNLP, 2020.'),
  P('[15] Dosovitskiy, A., Beyer, L., Kolesnikov, A., et al., "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale," in Proc. ICLR, 2021.'),
  P('[16] He, K., Zhang, X., Ren, S. and Sun, J., "Deep Residual Learning for Image Recognition," in Proc. CVPR, 2016, pp. 770–778.'),
  P('[17] Selvaraju, R. R., Cogswell, M., Das, A., et al., "Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization," in Proc. ICCV, 2017.'),
  P('[18] Ministry of Electronics and Information Technology, Government of India, "Digital Personal Data Protection Act," 2023.'),
  P('[19] National Assessment and Accreditation Council, "Manual for Self-Study Report — Affiliated/Constituent Colleges," NAAC, Bangalore, 2023.'),
  P('[20] Mitchell, E., Lee, Y., Khazatsky, A., et al., "DetectGPT: Zero-Shot Machine-Generated Text Detection using Probability Curvature," in Proc. ICML, 2023.'),
  P('[21] Cozzolino, D. and Verdoliva, L., "Noiseprint: A CNN-Based Camera Model Fingerprint," IEEE Trans. Information Forensics and Security, vol. 15, 2020, pp. 144–159.'),
  P('[22] DigiLocker, Ministry of Electronics and Information Technology, "DigiLocker Issuer API Specification v3.2," Government of India, 2024.')
];

// ---------- BASE PAPER + APPENDIX ----------
const basePaper = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'Base Paper', font: FONT, size: 32, bold: true })] }),
  P('Chen, J., Wang, Y., Li, Z., et al., "DocAgent: Agentic Long Document Understanding with Multimodal LLMs," in Proc. ACL Findings, 2025.'),
  P('This paper provides the closest architectural precedent for CertiVerify, introducing agentic decomposition for long-document understanding with multimodal LLMs. CertiVerify extends the DocAgent pattern to certificate verification with two domain-specific contributions absent in the original work: a Field Cross-Check Agent that compares certificate content against student submission metadata, and calibrated trust-tier weighting based on issuer characteristics.')
];

const appendix = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: 'Appendix', font: FONT, size: 32, bold: true })] }),
  Sec('A. CertiForge-HE Dataset Composition'),
  Tbl([2400, 1800, 1600, 1600, 1960], ['Class', 'Train (70%)', 'Val (15%)', 'Test (15%)', 'Total'], [
    ['Genuine', '2,030', '435', '435', '2,900'],
    ['Forged', '820', '175', '175', '1,170'],
    ['AI-Edited', '710', '152', '152', '1,014'],
    ['Duplicate', '500', '107', '107', '714'],
    ['Total', '4,060', '869', '869', '5,798']
  ]),
  Sec('B. NER Per-Entity Performance (5-fold CV)'),
  Tbl([2800, 2200, 2200, 2160], ['Entity', 'Precision', 'Recall', 'F1'], [
    ['STUDENT_NAME', '0.96 ± 0.01', '0.95 ± 0.01', '0.95 ± 0.01'],
    ['INSTITUTION', '0.91 ± 0.02', '0.89 ± 0.02', '0.90 ± 0.02'],
    ['EVENT', '0.88 ± 0.02', '0.87 ± 0.02', '0.87 ± 0.02'],
    ['DATE', '0.97 ± 0.01', '0.96 ± 0.01', '0.96 ± 0.01'],
    ['CERT_TYPE', '0.93 ± 0.01', '0.91 ± 0.01', '0.92 ± 0.01'],
    ['Macro Avg.', '0.93', '0.92', '0.92']
  ]),
  Sec('C. Student Engagement Score (SES) Definition'),
  P('The SES is a 0–100 holistic engagement index. Base component weights per category: Internships and Leadership Roles 10; Academic Excellence 9; Competitions 8; Certifications 7; Conferences and Workshops 6; Community Service 5; Club Activities 4. Diminishing returns cap at three records per category. Diversity bonus: +5 points per unique category with at least one verified record (max 40). Verification-rate multiplier (0.2–1.0) scales the result by the fraction of submissions verified.'),
  P('SES = min(100, round(((base + diversity) × vr_multiplier) / 217 × 100)). Grade boundaries: A+ (≥ 90), A (≥ 75), B+ (≥ 60), B (≥ 45), C (≥ 30), D (< 30).'),
  Sec('D. Ethics Committee Approval'),
  P('All genuine samples in CertiForge-HE were collected with written informed consent under a protocol approved by the Department of Computer Science Ethics Committee, Presidency University. All personally identifiable information in released samples is replaced with pseudonyms; institution logos of small private organisers are blurred unless the institution provided consent for public release. The dataset will be released under a research-only licence requiring institutional sign-off.'),
  Sec('E. Reproducibility Checklist'),
  Bul('Random seeds fixed at 42 for all training runs.'),
  Bul('Stratified 5-fold cross-validation with class-preserving splits.'),
  Bul('Dataset versioned under DVC with cryptographic content hashes.'),
  Bul('Model hyperparameters, training curves, and final weights logged in MLflow.'),
  Bul('Agent interfaces covered by Pydantic schemas; state graph unit-tested.'),
  Bul('All Python dependencies pinned in requirements.lock; Docker images tagged per release.')
];

// ---------- BUILD ----------
const doc = new Document({
  creator: 'CertiVerify Team',
  title: 'CertiVerify Capstone Report',
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0, alignment: AlignmentType.CENTER } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Page ', font: FONT, size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
    children: [
      ...titlePage,
      ...declaration,
      ...acknowledgement,
      ...abstract,
      ...toc,
      ...listFigures,
      ...listTables,
      ...abbreviations,
      ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9,
      ...references, ...basePaper, ...appendix
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(__dirname, '..', 'c8_report.docx'), buf);
  console.log('Wrote c8_report.docx');
});
