# CertiVerify: An Agentic Multimodal Framework for Explainable Verification of Student Activity Certificates in Indian Higher Education

**Dr. Leelambika K V**
School of Computer Science and Engineering
Presidency University, Bangalore, India

**Aman Singh**
Department of Computer Science
Presidency University, Bangalore, India
amansingh160704@gmail.com

**Sakshi P C**
Department of Computer Science
Presidency University, Bangalore, India
pcsakshi04@gmail.com

**Kushi S K**
Department of Computer Science
Presidency University, Bangalore, India
kushigowdas324@gmail.com

---

## Abstract

The verification of student co-curricular achievement certificates in Indian Higher Education (HE) institutions is a critical yet largely manual process, undermining the trustworthiness of student records used for NAAC and NIRF accreditation, employment, and scholarship applications. Conventional rule-based and OCR-only approaches fail to detect subtle forgeries, cross-field semantic mismatches, and duplicate submissions at scale. This paper presents **CertiVerify**, an agentic multimodal framework that cross-validates uploaded student certificates across five independent dimensions: text semantics, visual forensics, document layout, file metadata, and field-level cross-checking against student-submitted form data. Inspired by recent work on agentic reasoning architectures for document forensics, CertiVerify decomposes each document through parallel specialist agents coordinated by a central Reasoning Agent, which synthesises a calibrated confidence score and a natural-language explanation of its verdict. We construct **CertiForge-HE**, a benchmark dataset of 5,800 Indian academic certificates spanning eight activity categories — including genuine, digitally forged, AI-edited, and duplicate samples — and report preliminary results from 5-fold stratified cross-validation. CertiVerify achieves **94.1% (± 0.8%) overall accuracy** and **0.95 (± 0.01) AUC-ROC**, outperforming a fine-tuned ViT-Base baseline by 7.8 points and zero-shot MLLM baselines by 18–24 points. The platform integrating CertiVerify reduces estimated faculty verification workload by 71% while providing explainable, audit-ready verdicts suitable for institutional compliance.

**Keywords** — Certificate Verification, Agentic AI, Multimodal Forensics, Named Entity Recognition, Anomaly Detection, Indian Higher Education, NAAC, NIRF, Explainable AI

---

## I. Introduction

The rapid growth of Indian higher education — encompassing over 1,000 universities and 40,000 colleges under NAAC, NIRF, and AICTE oversight — has created a structural challenge: the systematic, verifiable documentation of student co-curricular activity. Participation in internships, workshops, certifications, competitive events, leadership roles, and community service contributes significantly to a student's holistic development. Regulatory frameworks increasingly require institutions to demonstrate, with documentary evidence, the breadth and depth of student engagement beyond GPA.

The current state of this process is inadequate. Students upload certificates as proof of participation, and faculty members manually verify them — checking that the name on the certificate matches the student, that the date aligns with the submission, that the issuing institution is legitimate, and that the document has not been submitted previously. This process is slow, inconsistent across reviewers, and entirely unequipped to detect modern document manipulation. With accessible AI image editing tools and PDF manipulation software, fabricating a convincing certificate — or subtly altering dates, names, or institutions on a genuine one — requires no specialist skill.

### A. Why Indian Academic Certificates Are Uniquely Challenging

Indian academic certificates exhibit characteristics that distinguish this verification problem from prior work on Western financial documents or invoices:

**Template heterogeneity.** Unlike government-issued identity documents with a fixed template, Indian academic certificates are issued by tens of thousands of institutions — universities, colleges, autonomous bodies, MOOC platforms, hackathon organisers, NGOs, government skilling missions — each with its own visual format, logo, signature blocks, and layout conventions.

**Multilingual content.** Certificates frequently mix English with regional scripts (Devanagari, Kannada, Tamil, Telugu, Bengali) for institution names, signatory names, or honorific titles. OCR pipelines and entity extractors trained primarily on English documents degrade significantly on these mixed-script samples.

**Variable scan quality.** Students submit certificates as smartphone photographs, scanned images, screenshots, or original PDFs. Lighting, perspective skew, JPEG compression artifacts, and partial occlusion are common.

**Name and transliteration ambiguity.** Indian names often appear in multiple romanisations across documents (e.g., "Aman Singh" vs. "Amann Singh" vs. "अमन सिंह"). Strict string matching fails; tolerant similarity must be calibrated to the script and naming conventions.

**Issuer trust hierarchy.** Institutions vary widely in trust level — an NPTEL certificate has near-machine-verifiable provenance, while a one-day workshop certificate from a small organiser has none. A verification system must accommodate this gradient rather than treating all issuers identically.

These characteristics make off-the-shelf document forgery detectors — typically trained on standardised Western invoice or ID document corpora — poorly suited to Indian academic verification. CertiVerify addresses each of these challenges through purpose-built components described in subsequent sections.

### B. Contributions

1. **CertiVerify framework** — an agentic multimodal verification system combining deterministic forensics, supervised classification, and learned ensemble reasoning, designed for Indian academic certificates.
2. **CertiForge-HE benchmark** — a dataset of 5,800 annotated Indian academic certificates across eight activity categories and four authenticity classes (Genuine, Forged, AI-Edited, Duplicate).
3. **Domain-specific NER model** — a fine-tuned named entity recogniser for five certificate-specific entity types, achieving 0.92 macro F1 on Indian academic certificates.
4. **Explainable verdicts** — per-agent evidence summaries and a natural-language reasoning trace that makes verification decisions interpretable for faculty review and institutional audit.
5. **Student Engagement Score (SES)** — a 0–100 holistic engagement index computed from verified records, providing a quantifiable co-curricular credential beyond GPA.

---

## II. Related Work

### A. Student Activity Management Systems

Balasubramanian and Govindasamy (2017) developed an early web-based Student Information System providing centralised academic record management but no extracurricular documentation. Khandare and Jadhav (2021) tracked extracurricular activity participation but provided no automated validation. Alqahtani and Goodwin (2020) explored e-portfolio systems that rely on self-reported, unverified data. None of these works address certificate authenticity.

### B. Document Forgery Detection

Traditional forensic approaches rely on Error Level Analysis (ELA) for JPEG compression inconsistencies and PDF structural analysis for edit traces. While effective against naive forgeries, these approaches fail against modern AI-assisted manipulation: diffusion model inpainting produces statistically near-indistinguishable JPEG artifacts. TruFor (Guillaro et al., 2023) uses noiseprint-based CNN features for image splicing detection. CAT-Net (Kwon et al., 2022) detects JPEG double compression at the DCT coefficient level. ForgeryGPT (Zhang et al., 2024) applies multimodal LLM reasoning to localize forgery regions with natural language descriptions. M2F2-Det (Guo et al., 2025) extends this to multimodal forged face detection. None of these systems are trained or evaluated on academic certificate documents, which exhibit distinct visual vocabulary (institutional watermarks, signature blocks, formatted date fields).

### C. Multimodal LLMs for Document Verification

Recent benchmarks (Chen et al., 2025) evaluate GPT-4o, Gemini Flash, and Qwen2-VL on transactional document fraud detection in zero-shot settings, reporting AUC of 0.6–0.8. Zero-shot multimodal LLMs hallucinate domain-specific details, lack calibration for high-stakes decisions, and cannot be deployed offline — a binding constraint for institutional student records under DPDP Act 2023.

### D. Agentic Document Verification

Recent work has explored multi-agent decomposition for document forensics, demonstrating that combining deterministic forensic modules with agentic reasoning improves both accuracy and interpretability over monolithic models. CertiVerify adapts this architectural pattern to the Indian academic certificate domain, with two domain-specific contributions absent in prior agentic work: a Field Cross-Check Agent that compares certificate content against student submission metadata, and a calibrated trust-tier weighting based on issuer characteristics.

### E. Summary of Gaps

| Approach | Coverage | Limitation |
|---|---|---|
| Student activity tracking systems | Activity logging | No certificate verification |
| ELA + metadata forensics | Visual/structural tampering | Fails on AI inpainting |
| TruFor, CAT-Net | Image splicing | Not trained on certificates |
| Zero-shot MLLMs | Multimodal reasoning | No domain grounding, no privacy |
| Blockchain verification | Tamper-proof anchoring | Requires issuer participation |
| Generic agentic forensics | General documents | No certificate-specific cross-check |

CertiVerify uniquely addresses all six gaps for the Indian academic certificate domain.

---

## III. Problem Statement

Indian HE institutions face four interconnected verification failures:

**Semantic mismatch.** A student submits a genuine certificate but enters incorrect metadata in the submission form (wrong date, mismatched institution name). Rule-based systems do not detect this; only semantic cross-referencing of extracted certificate entities against form fields can.

**Document forgery.** Students alter names, dates, or scores on genuine certificates using image editors or PDF tools. Visual forensics are required to detect pixel-level manipulation.

**AI-generated fabrication.** Generative AI tools can now produce entirely synthetic certificates that pass visual inspection. Layout analysis and provenance checks are necessary to detect structural anomalies.

**Duplicate submission.** The same certificate is submitted multiple times across different activity categories, often with minor variations in filename or compression. Embedding-based similarity search combined with deterministic entity comparison is required.

A reliable verification system must address all four failure modes simultaneously and provide interpretable evidence for each decision — not a black-box score.

---

## IV. The CertiVerify Framework

CertiVerify is a multi-agent system in which six agents — one ingestion agent, four parallel specialist analysers, one cross-check agent, and a central reasoning agent — collaborate to produce a verdict for each uploaded certificate. All specialist agents read from a shared state object populated by the Ingestion Agent and write structured evidence reports back to the same state. The Reasoning Agent consumes these reports to produce the final verdict and explanation.

### A. Architecture

```
                ┌─── Uploaded Certificate (PDF / Image) ───┐
                │                                           │
                ▼                                           │
        ┌─────────────────┐                                 │
        │ Ingestion Agent │  OCR · Layout · Metadata · DPI  │
        └────────┬────────┘                                 │
                 │ shared state                             │
   ┌─────────────┼──────────────┬──────────────┬───────────┤
   ▼             ▼              ▼              ▼           ▼
┌──────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐
│ Text │   │ Visual  │   │  Layout  │   │ Metadata │   │ Field  │
│Agent │   │Forensics│   │  Agent   │   │  Agent   │   │ Cross- │
│      │   │  Agent  │   │          │   │          │   │ Check  │
└──┬───┘   └────┬────┘   └────┬─────┘   └────┬─────┘   └───┬────┘
   │            │             │              │             │
   └────────────┴─────────────┴──────────────┴─────────────┘
                              │ evidence reports
                              ▼
                    ┌──────────────────┐
                    │ Reasoning Agent  │
                    │ Calibrated       │
                    │ Ensemble + NL    │
                    │ Explanation      │
                    └────────┬─────────┘
                             ▼
                  Verdict: auto_verified
                         /  needs_review
                         /  rejected
```

Each agent has a uniform interface: it consumes the shared state and emits a structured evidence dictionary with (i) a scalar confidence in [0, 1] and (ii) a list of named evidence items used by the Reasoning Agent for the natural-language explanation. The following subsections describe each agent's purpose, methods, and output.

### B. Ingestion Agent

**Purpose.** Prepare the uploaded document for downstream agents.

**Methods.** PDF inputs are rasterised to 300 DPI using PyMuPDF. Image inputs (JPEG, PNG) have EXIF metadata extracted via ExifTool before any processing that might strip it. PaddleOCR performs text extraction with multi-script support (English, Devanagari, Kannada, Tamil, Telugu) and outputs both raw text and a layout map containing per-region bounding boxes, font size estimates, and OCR confidence scores.

**Output.** `{raw_text, layout_map, image_tensor, metadata_dict, ocr_confidence}`

### C. Text Agent

**Purpose.** Extract structured semantic content and detect AI-generated text patterns.

**Methods.**
- *Named Entity Recognition.* A custom NER model (Section V) extracts five entity types: STUDENT_NAME, INSTITUTION, EVENT, DATE, CERT_TYPE.
- *Semantic coherence classifier.* A fine-tuned sentence-level classifier detects implausible combinations — e.g., an event description inconsistent with the declared category, or a certificate type inconsistent with the issuing institution's known vocabulary.
- *AI-generation detection.* A fine-tuned RoBERTa classifier, trained on genuine and LLM-generated certificate text, assigns the probability that the certificate text was machine-generated.

**Output.** `{entities, semantic_coherence, ai_gen_probability, confidence}`

### D. Visual Forensics Agent

**Purpose.** Detect pixel-level image manipulation.

**Methods.**
- *Error Level Analysis.* The image is re-saved at JPEG quality 85 and the pixel-wise difference is computed; regions edited after the original save show elevated residuals. A fine-tuned ResNet-50 classifier maps ELA outputs to per-region tampering probabilities.
- *Noise inconsistency analysis.* A noise map is extracted using OpenCV; statistically inconsistent noise profiles across regions are flagged.
- *Logo and watermark integrity.* A template-matching pipeline compares detected institutional logos against a curated database of 340 Indian HE institution logos. Mismatches, blurred logos, or absent watermarks are flagged.

**Output.** `{ela_score, noise_anomaly, logo_match, tampered_regions, confidence}`

### E. Layout and Structure Agent

**Purpose.** Detect structural and typographic anomalies.

**Methods.**
- *Font consistency.* Font size and family variance across text blocks is computed from the layout map.
- *Spatial density.* Text block density relative to certificate area is compared against category-specific templates.
- *Template conformance.* A fine-tuned LayoutLMv3 model produces a category-specific template conformance score reflecting deviation from the learned spatial signature for each of the eight activity categories.

**Output.** `{font_consistency, template_conformance, layout_anomaly, confidence}`

### F. Metadata and Provenance Agent

**Purpose.** Detect file-level provenance inconsistencies.

**Methods.**
- *PDF metadata.* Author, creator application, creation date, and modification date are extracted and cross-checked for internal consistency.
- *EXIF analysis.* For image uploads, EXIF fields including camera model, GPS data, and software fields are checked for editor signatures.
- *Compression artifact analysis.* DCT coefficient histogram analysis detects double-JPEG compression — a signature of screenshots that have been re-edited and re-saved.

**Output.** `{metadata_consistent, software_edit_detected, compression_anomaly, confidence}`

### G. Field Cross-Check Agent

**Purpose.** Compare extracted certificate content against student-submitted form data and detect duplicates. This agent is unique to the certificate verification domain and absent in general document forensics frameworks.

**Methods — Field matching.** For each field, a similarity score is computed using a method calibrated to the field's data characteristics:

| Field Pair | Similarity Method |
|---|---|
| Certificate name ↔ Profile name | Jaro-Winkler with multilingual transliteration normalisation |
| Certificate date ↔ Submitted date | Normalised date parsing, ±3 day tolerance |
| Certificate institution ↔ Submitted institution | Token overlap + fuzzy match (handles abbreviations) |
| Certificate event ↔ Submitted activity title | TF-IDF cosine similarity |
| Certificate type ↔ Submitted category | Rule-based category mapping |

A Random Forest classifier (500 estimators) trained on 3,200 labeled (certificate, form) pairs combines per-field similarities into an overall match score. Training labels are faculty verification decisions from historical records.

**Methods — Two-stage duplicate detection.** A naive vector similarity threshold produces false positives on highly standardised documents — for example, two certificates from the same multi-day workshop with only the date differing. CertiVerify uses a two-stage pipeline:

*Stage 1 — Vector retrieval.* pgvector cosine similarity on NER entity embeddings flags all stored records with similarity > 0.92 as duplicate candidates.

*Stage 2 — Deterministic entity filter.* For each flagged candidate, the system performs an exact comparison of the extracted DATE and EVENT entities. If date distance exceeds 7 days OR event token overlap is below 0.6, the duplicate penalty is bypassed and the submission proceeds normally. Only when both stages confirm a match is `duplicate_flag` set to `True`.

**Output.** `{match_score, field_breakdown, duplicate_flag, duplicate_candidates, confidence}`

### H. Reasoning Agent

**Purpose.** Aggregate evidence into a final verdict and produce a natural-language explanation.

**Methods.** The Reasoning Agent computes a weighted ensemble of agent confidences:

```
score = 0.25·text + 0.25·visual + 0.20·layout
      + 0.15·(1 − metadata_anomaly) + 0.15·match
```

Weights were determined by Bayesian optimisation on the validation fold. If `duplicate_flag = True`, the score is reduced by 0.30 and routed to `needs_review`.

**Verdict thresholds:**

| Score | Verdict |
|---|---|
| ≥ 0.85 | `auto_verified` |
| 0.55 – 0.84 | `needs_review` |
| < 0.55 | `rejected` |

The agent then produces a structured natural-language explanation citing per-agent evidence, e.g., "Visual Agent flagged elevated ELA residuals around the date field (region confidence 0.61); Field Cross-Check confirmed name and event match but date mismatch of 12 days; recommendation: faculty should verify date field visually." This explanation is stored in the `verification_log` table and presented to faculty alongside the submission.

---

## V. Domain-Specific NER Model

### A. Dataset

The NER training corpus comprises 4,200 annotated certificate images: genuine certificates contributed with informed student consent across three academic years, synthetic certificates from a template-based generator varying institution names, fonts, layouts, and dates, and augmented samples from controlled text perturbations. Annotation used a five-entity schema with four annotators using Prodigy. Inter-annotator agreement (Cohen's κ) was 0.91.

### B. Training

The base model is `en_core_web_trf` (spaCy transformer pipeline), fine-tuned for 30 epochs with early stopping (patience = 5), learning rate 2e-5, batch size 16. To handle multilingual content, an auxiliary token-level script classifier directs Devanagari and Dravidian-script tokens through IndicBERT-base for embedding before fusion with the spaCy transformer output.

### C. Entity Schema

| Label | Description | Example |
|---|---|---|
| `STUDENT_NAME` | Certificate recipient | "Aman Singh" |
| `INSTITUTION` | Issuing or hosting organisation | "Presidency University" |
| `EVENT` | Activity or event name | "National Hackathon 2024" |
| `DATE` | Activity date or range | "15 March 2024" |
| `CERT_TYPE` | Recognition type | "Certificate of Participation" |

### D. NER Performance (5-fold cross-validation)

| Entity | Precision | Recall | F1 |
|---|---|---|---|
| STUDENT_NAME | 0.96 ± 0.01 | 0.95 ± 0.01 | 0.95 ± 0.01 |
| INSTITUTION | 0.91 ± 0.02 | 0.89 ± 0.02 | 0.90 ± 0.02 |
| EVENT | 0.88 ± 0.02 | 0.87 ± 0.02 | 0.87 ± 0.02 |
| DATE | 0.97 ± 0.01 | 0.96 ± 0.01 | 0.96 ± 0.01 |
| CERT_TYPE | 0.93 ± 0.01 | 0.91 ± 0.01 | 0.92 ± 0.01 |
| **Macro Avg** | **0.93** | **0.92** | **0.92** |

---

## VI. CertiForge-HE Benchmark Dataset

No publicly available dataset of Indian academic certificates exists for this domain. We construct **CertiForge-HE**, comprising 5,800 samples across eight activity categories and four authenticity classes:

| Class | Train (70%) | Validation (15%) | Test (15%) | Total |
|---|---|---|---|---|
| Genuine | 2,030 | 435 | 435 | 2,900 |
| Forged | 820 | 175 | 175 | 1,170 |
| AI-Edited | 710 | 152 | 152 | 1,014 |
| Duplicate | 500 | 107 | 107 | 714 |

**Genuine.** Student-contributed certificates (with written informed consent) collected across three academic years (2022–2024) at Presidency University. Distribution is balanced across the eight activity categories.

**Forged.** Genuine certificates manipulated using GIMP, Adobe Photoshop, and Canva — operations include text replacement (name, date, institution), logo substitution, and border modification. Each forgery is logged with the manipulation type to support targeted error analysis.

**AI-Edited.** Certificates generated or modified using Stable Diffusion XL inpainting (text region replacement) and Gemini 2.5 Flash (full certificate generation from text prompts). All AI-generated samples are marked as such in metadata and used solely for adversarial training and evaluation.

**Duplicate.** Exact and near-duplicate submissions (same certificate with variations in filename, rotation, compression level, and crop boundaries).

**Ethics and Consent.** Consent was obtained from each student contributor through a written form approved by the Department of Computer Science Ethics Committee, Presidency University. All personally identifiable information in released samples is replaced with pseudonyms; institution logos of small private organisers are blurred unless the institution provided consent for public release. AI-edited samples were generated from genuine samples with explicit annotator approval; the AI-generation procedure does not target any specific individual or institution adversarially. The dataset will be released under a research-only license requiring institutional sign-off.

---

## VII. Methodology

### A. Requirement Analysis

Requirements were gathered through structured interviews with 14 academic coordinators, 22 faculty members, and 38 students across three departments at Presidency University. NAAC criterion 5.3 (Student Participation and Activities) and NIRF teaching-learning parameters were analysed to identify reporting requirements that the verification pipeline must support.

### B. System Design

A modular architecture was designed with layered separation of concerns: presentation, application, data, and analytics layers. UML sequence diagrams and data flow diagrams specify agent interactions and database write patterns.

### C. Model Training

Training was performed on a single NVIDIA A100 (40 GB).

| Component | Architecture | Training Time | Notes |
|---|---|---|---|
| NER | spaCy en_core_web_trf + IndicBERT fusion | 4h | 30 epochs, lr 2e-5 |
| Visual Forensics CNN | ResNet-50 fine-tune | 6h | 50 epochs |
| ViT-Base baseline | ViT-Base/16 fine-tune | 9h | 40 epochs |
| Layout Agent | LayoutLMv3 fine-tune | 5h | 35 epochs |
| Field-matcher | Random Forest, 500 trees | 12 min | depth 12 |

All reported metrics use stratified 5-fold cross-validation on the train+validation split, with a held-out test fold (15%, n=869) reserved for final evaluation.

### D. Frontend and Backend Implementation

The frontend is built with React 18, TypeScript, Tailwind CSS, and shadcn/ui. The backend uses Supabase (PostgreSQL + Auth + Storage) with row-level security policies. The CertiVerify pipeline runs as an asynchronous server-side process triggered on document upload. All verification outputs are stored in the `verification_log` table with full agent-level evidence records for audit.

---

## VIII. Deployment Infrastructure

### A. Inference Hardware

While training used an A100, production inference runs on two NVIDIA T4 GPUs (16 GB each) — a cost-effective configuration suitable for institutional deployment. Model weights are quantised to INT8 using ONNX Runtime, reducing per-model GPU memory footprint by approximately 55% with measured accuracy degradation below 0.4 percentage points.

### B. Orchestration

Agent orchestration is implemented as a LangGraph cyclic state graph. The Ingestion Agent populates a shared state object; the five specialist agents are dispatched as concurrent LangGraph nodes that read from and write to the shared state without blocking one another. The Reasoning Agent node is gated to execute only after all five specialist nodes emit a `DONE` signal, enforcing the aggregation dependency without polling.

### C. Latency Profile

Concurrent execution of five agents whose combined serial cost is approximately 9.1 seconds yields a wall-clock time bounded by the slowest agent (Visual Forensics CNN, ≈2.1 s). The Reasoning Agent aggregation adds ≈0.3 s, and database writes add ≈0.2 s.

```
Ingestion Agent (0.4s)
        │
        ├──────────┬──────────┬──────────┬─────────┐
        ▼          ▼          ▼          ▼         ▼
      Text      Visual     Layout    Metadata    Field
     (0.6s)    (2.1s)     (0.8s)    (0.3s)     (0.7s)
        │          │          │          │         │
        └──────────┴──────────┴──────────┴─────────┘
                              │
                       Reasoning (0.3s)
                              │
                       DB Write (0.2s)
                              │
                  Wall-clock total: ~2.6s
```

Under simulated concurrent load of 50 simultaneous uploads, p95 latency remains at 2.9 s and p99 at 3.4 s on the two-T4 configuration.

---

## IX. Results

All results are reported as mean ± standard deviation across 5-fold stratified cross-validation on the CertiForge-HE train+validation split, with final evaluation on the held-out test fold (n=869). Results in this section are preliminary and based on the initial CertiForge-HE collection; broader external validation across additional institutions is planned future work.

### A. End-to-End Verification Performance

| Method | Accuracy | F1 (Genuine / Forged / AI-Edited) | AUC | Avg. Time |
|---|---|---|---|---|
| **CertiVerify (Full)** | **94.1 ± 0.8%** | **0.95 / 0.91 / 0.89** | **0.95 ± 0.01** | **2.6 s** |
| ViT-Base (fine-tuned, CertiForge-HE) | 86.3 ± 1.1% | 0.89 / 0.84 / 0.73 | 0.88 ± 0.02 | 1.1 s |
| GPT-4o (zero-shot) | 69.3 ± 2.4% | 0.78 / 0.64 / 0.53 | 0.73 ± 0.03 | 8.1 s* |
| ELA + Rule-Based | 72.8 ± 1.7% | 0.81 / 0.67 / 0.58 | 0.76 ± 0.02 | 0.9 s |
| Generic OCR + Regex | 76.4 ± 1.5% | 0.84 / 0.71 / 0.62 | 0.80 ± 0.02 | 1.4 s |
| Text-only RoBERTa | 80.2 ± 1.2% | 0.87 / 0.76 / 0.69 | 0.84 ± 0.02 | 0.7 s |

*GPT-4o requires external API call; not deployable in privacy-constrained environments.

The **ViT-Base baseline** is critical to the comparison: it is fine-tuned on the same CertiForge-HE data, isolating the effect of architectural choice from training-data advantage. The ViT-Base plateaus at 86.3% — confirming that fine-tuning alone is insufficient. The largest gap appears on the AI-Edited class (F1 0.73 vs. 0.89): a holistic image classifier cannot separately reason about pixel-level ELA anomalies, spatial layout deviations, and field-level semantic mismatches; it must learn to compress these signals into a single representation and fails when any one is subtle. CertiVerify's agent decomposition handles each signal in a purpose-built module, yielding a 7.8-point accuracy gain over the fine-tuned single-model baseline that is attributable specifically to the multi-agent decomposition.

### B. Per-Category Performance

Disaggregated F1 by activity category on the test fold (CertiVerify Full):

| Category | F1 (Genuine) | F1 (Forged) | F1 (AI-Edited) |
|---|---|---|---|
| Internships | 0.96 | 0.92 | 0.90 |
| Leadership Roles | 0.94 | 0.89 | 0.86 |
| Academic Excellence | 0.97 | 0.93 | 0.91 |
| Competitions | 0.95 | 0.92 | 0.90 |
| Certifications | 0.96 | 0.93 | 0.92 |
| Conferences & Workshops | 0.94 | 0.90 | 0.88 |
| Community Service | 0.92 | 0.87 | 0.84 |
| Club Activities | 0.91 | 0.85 | 0.82 |

Performance is consistent across categories, with a modest dip on Community Service and Club Activities — categories that exhibit the highest template heterogeneity (small NGO and student club organisers without standardised certificate formats).

### C. Ablation Study

| Variant | AUC | Forged F1 | AI-Edited F1 |
|---|---|---|---|
| Full system | **0.95** | **0.91** | **0.89** |
| − Visual Forensics Agent | 0.82 | 0.74 | 0.61 |
| − Field Cross-Check Agent | 0.88 | 0.86 | 0.84 |
| − Metadata Agent | 0.91 | 0.88 | 0.86 |
| − Layout Agent | 0.90 | 0.87 | 0.83 |
| − Reasoning Agent (avg. ensemble) | 0.89 | 0.85 | 0.82 |
| Text Agent only | 0.84 | 0.76 | 0.69 |

The Visual Forensics Agent contributes the largest individual gain (+0.13 AUC). The Field Cross-Check Agent contributes the second largest (+0.07 AUC) and is the only agent that catches semantic mismatches between a genuine certificate and an incorrect form submission. Replacing the learned Reasoning Agent with a simple average ensemble reduces AUC by 0.06, demonstrating the value of learned weight calibration over heuristic combination.

### D. Visual vs. Layout Agent — Complementarity Analysis

A reviewer concern is whether Visual Forensics and Layout Agents perform redundant work on AI-generated certificates. Per-agent detection rates on the AI-Edited test subset:

| Agent | AI-Edited detected (solo) | Missed |
|---|---|---|
| Visual Forensics only | 71.1% | 28.9% |
| Layout only | 58.6% | 41.4% |
| Both agents | 52.0% | — |
| Either agent (union) | 77.7% | 22.3% |
| Full system | 89.0% | 11.0% |

Only 52.0% of AI-Edited samples were flagged by both agents simultaneously, confirming non-overlapping signals. The Visual Agent detects pixel-level noise inconsistencies — Stable Diffusion inpainting introduces characteristic high-frequency artifacts in regenerated text regions that manifest as elevated ELA residuals. Grad-CAM saliency maps on the ResNet-50 Visual Agent show activation concentrated at text-replacement boundaries between inpainted regions and original certificate background. The Layout Agent, by contrast, detects spatial density anomalies — diffusion-generated text regions exhibit subtly different character spacing and line height metrics that the LayoutLMv3-based template scorer registers as deviation. ELA captures frequency-domain artifacts; layout conformance captures spatial-domain arrangement. The signals are geometrically distinct, explaining why both agents are necessary.

### E. Verdict Distribution

On the full 5,800-sample dataset:
- `auto_verified`: 64.7%
- `needs_review`: 22.8%
- `rejected`: 12.5%

The `needs_review` bucket is deliberately sized to route uncertain cases to faculty rather than make autonomous errors. Operational false-positive rate (genuine certificate rejected) is 4.1% [95% CI: 3.2%–5.1%].

### F. Duplicate Detection

The two-stage duplicate detection pipeline detected 97.8% of exact and near-duplicate submissions in the test fold, with a false positive rate of 2.1%. Compared to the single-stage pgvector-only baseline (similarity threshold 0.92), the two-stage filter reduced false positives by 6.4 percentage points on the multi-day workshop edge case subset.

### G. Workflow Impact

| Metric | Manual | CertiVerify |
|---|---|---|
| Avg. review time per submission | 4.2 min | 1.2 min (needs_review only) |
| Submissions requiring faculty review | 100% | 22.8% |
| Estimated faculty-hours saved per 500-student cohort | — | ~163 hours/year |
| Accreditation report generation | Manual, ~8 hours | Automated, <2 min |

### H. Explainability Evaluation

A panel of 12 faculty members rated the natural-language explanation quality of 50 `needs_review` verdicts on a 5-point Likert scale (1 = unhelpful, 5 = fully actionable). Mean rating: **4.6/5** (σ = 0.4). Faculty reported that per-agent evidence breakdowns and specific field-mismatch details enabled faster, more confident review decisions.

---

## X. Student Engagement Score

Beyond verification, the platform computes a Student Engagement Score (SES) — a 0–100 holistic index quantifying co-curricular engagement from each student's verified activity portfolio.

**Components.**

1. **Base score:** Weighted sum of verified records. Category weights — Internships and Leadership Roles: 10; Academic Excellence: 9; Competitions: 8; Certifications: 7; Conferences & Workshops: 6; Community Service: 5; Club Activities: 4. Diminishing returns cap at three records per category.
2. **Diversity bonus:** +5 points per unique category with at least one verified record, capped at 40 points.
3. **Verification-rate multiplier:** Scales raw score by the fraction of submitted records that are verified (range: 0.2–1.0), penalising portfolios with predominantly unverified submissions.

```
SES = min(100, round(((base + diversity) × vr_multiplier) / 217 × 100))
```

Grade boundaries: A+ (≥90), A (≥75), B+ (≥60), B (≥45), C (≥30), D (<30).

The SES complements GPA in scholarship, placement, and accreditation contexts.

---

## XI. Security, Privacy, and Bias

### A. Data Protection

Documents are stored in Supabase Storage with access via short-lived signed URLs and are never publicly accessible. CertiVerify runs entirely server-side; no certificate data is transmitted to external APIs. Row-level security ensures faculty access only records belonging to students in their department. All agent outputs and verification decisions are logged immutably for audit. RBAC enforces role-appropriate actions at both the API and database layers. The system is designed to comply with the Indian Digital Personal Data Protection Act 2023 (DPDP Act) for student data handling.

### B. Bias and Fairness Considerations

Indian academic contexts present distinct fairness risks:

**Name and script bias.** The NER model was evaluated on a held-out subset stratified by name origin (North Indian, South Indian, Northeast Indian, anglicised) and script (Roman, Devanagari, Dravidian). STUDENT_NAME F1 ranges from 0.93 (anglicised) to 0.89 (Northeast Indian / Dravidian script transliterations). This 4-point gap is a known limitation; ongoing data collection targets underrepresented name and script categories.

**Issuer trust bias.** A naive trust ranking based on issuer prominence would systematically disadvantage students who participate in regional or vernacular events. CertiVerify deliberately separates verification (does this certificate exist as claimed?) from prestige weighting (handled at the SES stage with explicit, auditable category weights).

**False-negative risk in accreditation contexts.** A wrongful rejection denies a student credit for genuine participation. The conservative `needs_review` threshold and mandatory faculty review on rejection appeals are designed to keep operational false negatives below 5%.

### C. Threat Model

CertiVerify defends against three threat classes: naive forgery (image editor manipulation), AI-assisted forgery (diffusion-model inpainting, full LLM generation), and duplicate resubmission. It does not defend against insider attacks (faculty colluding with students), cryptographic attacks on Supabase Storage (mitigated by platform-level controls), or adversarial perturbation attacks specifically crafted against CertiVerify's known weights (mitigated by keeping model weights non-public outside the institutional deployment).

---

## XII. Future Work

**Multilingual expansion.** Extending NER coverage to all 22 scheduled Indian languages, with native-script annotation for institution names and signatory titles.

**DigiLocker integration.** Direct verification against DigiLocker-issued credentials would enable near-machine-verifiable provenance for government-issued certifications, eliminating the need for forensic analysis on supported issuers.

**Real-time issuer verification APIs.** For institutions exposing digital certificate APIs (NPTEL, Coursera, government skilling missions), CertiVerify could query the issuer to confirm authenticity, approaching 100% accuracy for supported issuers.

**Adversarial robustness.** Continual learning loop with adversarial samples generated by GAN-based forgery attackers, hardening the model against evolving forgery techniques.

**Aadhaar-linked identity binding.** Optional binding of verified portfolios to Aadhaar-based identity attributes for irrefutable lifelong credential portability.

**Mobile application.** Native mobile interface for smartphone-camera certificate submission and remote faculty review.

**Multi-institution federation.** Federated CertiVerify deployments enabling persistent, portable verified achievement records that survive institutional transfers.

---

## XIII. Conclusion

This paper presented CertiVerify, an agentic multimodal framework for explainable verification of student activity certificates in Indian higher education. By decomposing certificate verification across five parallel specialist agents — text semantics, visual forensics, layout structure, metadata provenance, and field-level cross-checking — and synthesising their outputs through a calibrated Reasoning Agent, CertiVerify achieves 94.1% (± 0.8%) overall accuracy and 0.95 (± 0.01) AUC-ROC on the CertiForge-HE benchmark, outperforming a fine-tuned ViT-Base single-model baseline by 7.8 points and zero-shot multimodal LLMs by 18–24 points.

The system addresses a critical trust deficit in Indian HE student record management. By automating verification for 64.7% of submissions and providing actionable, interpretable evidence reports for the remainder, CertiVerify substantially reduces faculty workload while improving record integrity and accreditation readiness. The Student Engagement Score complements CertiVerify by providing a quantifiable holistic engagement metric grounded in verified records.

The framework's contributions — domain-specific NER for Indian academic certificates, two-stage duplicate detection accounting for multi-day event edge cases, multimodal agent decomposition with non-overlapping forensic signals, and explainable verdicts suitable for institutional audit — together establish a deployable foundation for trustworthy student activity management at the scale of the Indian higher education system.

---

## References

[1] Balasubramanian, S. and Govindasamy, S., "Web-Based Student Information System for Managing Student Records," *International Journal of Computer Applications*, vol. 174, no. 2, 2017, pp. 212–234.

[2] Jadhav, P., Patil, R., and Kulkarni, M., "A Framework for Tracking Student Academic Performance," *International Journal of Advanced Computer Science and Applications*, vol. 9, no. 5, 2018, pp. 245–251.

[3] Rahman, M., Islam, S., and Ahmed, K., "Design of a Large-Scale Web-Based Academic Management System," *Journal of Educational Technology Systems*, vol. 47, no. 4, 2019, pp. 534–548.

[4] Alqahtani, A. and Goodwin, S., "E-Portfolio Systems in Higher Education: Opportunities and Challenges," *Education and Information Technologies*, vol. 25, no. 3, 2020, pp. 1695–1712.

[5] Khandare, R. and Jadhav, P., "Web-Based Activity Tracking System for Students," *International Journal of Engineering Research and Technology*, vol. 10, no. 7, 2021, pp. 568–573.

[6] Sharma, A., Verma, P., and Singh, R., "Cloud-Based Education Systems for Smart Universities," *IEEE Access*, vol. 10, 2022, pp. 112450–112462.

[7] Martinez, J. and Wilson, P., "AI-Driven Academic Document Verification for Student Records," *Computers and Education: Artificial Intelligence*, vol. 5, 2024, art. 100138.

[8] Lee, S., Kim, H., and Park, J., "Blockchain-Based Academic Certificate Verification in Higher Education," *IEEE Access*, vol. 12, 2024, pp. 25564–25576.

[9] Guillaro, F., Cozzolino, D., Sud, A., Dufour, N., and Verdoliva, L., "TruFor: Leveraging All-Round Information for Universal Image Forgery Detection and Localization," in *Proc. CVPR*, 2023.

[10] Kwon, M., Nam, S., Yu, I., Lee, H., and Kim, C., "Learning JPEG Compression Artifacts for Image Manipulation Detection and Localization," *International Journal of Computer Vision*, vol. 130, 2022, pp. 1875–1895.

[11] Zhang, Y., Yu, S., Liu, J., Wu, X., et al., "ForgeryGPT: Multimodal Large Language Model for Explainable Image Forgery Detection and Localization," *arXiv preprint arXiv:2410.10238*, 2024.

[12] Guo, R., Tang, Y., Wang, M., et al., "M2F2-Det: Multi-Modal Interpretable Forged Face Detector," in *Proc. CVPR*, 2025.

[13] Chen, X., Li, Z., Sun, P., et al., "Can Multi-modal LLMs Detect Document Manipulation? A Benchmark Study," *arXiv preprint arXiv:2508.11021*, 2025.

[14] Honnibal, M. and Montani, I., "spaCy: Industrial-Strength Natural Language Processing in Python," *Software available from spacy.io*, 2017.

[15] Du, Y., Li, C., Guo, R., et al., "PP-OCR: A Practical Ultra Lightweight OCR System," *arXiv preprint arXiv:2009.09941*, 2020.

[16] Liu, F. T., Ting, K. M., and Zhou, Z. H., "Isolation Forest," in *Proc. IEEE ICDM*, 2008, pp. 413–422.

[17] Breiman, L., "Random Forests," *Machine Learning*, vol. 45, no. 1, 2001, pp. 5–32.

[18] Xu, Y., Lv, T., Cui, L., et al., "LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking," in *Proc. ACM Multimedia*, 2022.

[19] Kakwani, D., Kunchukuttan, A., Golla, S., et al., "IndicNLPSuite: Monolingual Corpora, Evaluation Benchmarks and Pre-trained Multilingual Language Models for Indian Languages," in *Findings of EMNLP*, 2020.

[20] Dosovitskiy, A., Beyer, L., Kolesnikov, A., et al., "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale," in *Proc. ICLR*, 2021.

[21] He, K., Zhang, X., Ren, S., and Sun, J., "Deep Residual Learning for Image Recognition," in *Proc. CVPR*, 2016, pp. 770–778.

[22] Selvaraju, R. R., Cogswell, M., Das, A., et al., "Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization," in *Proc. ICCV*, 2017, pp. 618–626.

[23] Krishnan, P., Dutta, K., and Jawahar, C. V., "Deep Feature Embedding for Accurate Recognition and Retrieval of Handwritten Text," in *Proc. ICFHR*, 2016.

[24] Ministry of Electronics and Information Technology, Government of India, "Digital Personal Data Protection Act," 2023.

[25] National Assessment and Accreditation Council, "Manual for Self-Study Report — Affiliated/Constituent Colleges," NAAC, Bangalore, 2023.

[26] Ministry of Education, Government of India, "National Institutional Ranking Framework — India Rankings Methodology," 2024.

[27] Wang, J., Liu, Y., Wang, X., et al., "DocFormer: End-to-End Transformer for Document Understanding," in *Proc. ICCV*, 2021.

[28] Touvron, H., Lavril, T., Izacard, G., et al., "LLaMA: Open and Efficient Foundation Language Models," *arXiv preprint arXiv:2302.13971*, 2023.

[29] Schick, T. and Schütze, H., "Generating Datasets with Pretrained Language Models," in *Proc. EMNLP*, 2021.

[30] Cordonnier, J. B., Loukas, A., and Jaggi, M., "On the Relationship between Self-Attention and Convolutional Layers," in *Proc. ICLR*, 2020.

[31] Mitchell, E., Lee, Y., Khazatsky, A., et al., "DetectGPT: Zero-Shot Machine-Generated Text Detection using Probability Curvature," in *Proc. ICML*, 2023.

[32] Cozzolino, D. and Verdoliva, L., "Noiseprint: A CNN-Based Camera Model Fingerprint," *IEEE Trans. Information Forensics and Security*, vol. 15, 2020, pp. 144–159.

[33] Wang, S. Y., Wang, O., Zhang, R., Owens, A., and Efros, A. A., "CNN-Generated Images are Surprisingly Easy to Spot... For Now," in *Proc. CVPR*, 2020.

[34] DigiLocker, Ministry of Electronics and Information Technology, "DigiLocker Issuer API Specification v3.2," Government of India, 2024.

[35] Chen, J., Wang, Y., Li, Z., et al., "DocAgent: Agentic Long Document Understanding with Multimodal LLMs," in *Proc. ACL Findings*, 2025.
