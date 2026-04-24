# CertiVerify: An Agentic Multimodal Framework for Explainable Verification of Student Activity Certificates in Indian Higher Education

**Leelambika K V · Aman Singh · Sakshi P C · Kushi S K**
Presidency University, Bangalore, India
{amansingh160704, pcsakshi04, kushigowdas324}@gmail.com

---

## Abstract

The verification of student co-curricular certificates in Indian higher education is a manual, error-prone process that undermines the integrity of records used for NAAC and NIRF accreditation. Rule-based and OCR-only pipelines fail to detect subtle forgeries, cross-field semantic mismatches, and duplicate submissions at scale. We present **CertiVerify**, an agentic multimodal framework that cross-validates certificates across five independent dimensions — text semantics, visual forensics, document layout, file metadata, and field-level cross-checking against student-submitted form data — coordinated by a central Reasoning Agent that produces a calibrated confidence score and a natural-language explanation. We also introduce **CertiForge-HE**, a benchmark of 5,800 Indian academic certificates across eight activity categories and four authenticity classes. Under 5-fold stratified cross-validation, CertiVerify achieves **94.1% (± 0.8%) accuracy** and **0.95 AUC-ROC**, outperforming a fine-tuned ViT-Base baseline by 7.8 points and zero-shot multimodal LLMs by 18–24 points, while reducing estimated faculty review workload by 71%.

**Keywords** — Certificate Verification · Agentic AI · Multimodal Forensics · NER · Explainable AI · Indian Higher Education

---

## 1. Introduction

Indian higher education — over 1,000 universities and 40,000 colleges under NAAC, NIRF, and AICTE — requires institutions to document student co-curricular engagement with verifiable evidence. In practice, students upload certificates and faculty verify them manually: a slow, inconsistent process that is entirely unequipped to detect modern document manipulation. With accessible image editors and diffusion-based inpainting tools, fabricating or altering a convincing certificate requires no specialist skill.

Indian academic certificates are uniquely challenging relative to prior document-forensics work on Western invoices or ID documents: templates vary across tens of thousands of issuers; content mixes English with Devanagari, Kannada, Tamil, Telugu, and Bengali scripts; submissions arrive as smartphone photos, scans, screenshots, or PDFs with inconsistent quality; Indian names exhibit transliteration ambiguity ("Aman Singh" vs. "Amann Singh" vs. "अमन सिंह"); and issuer trust varies from near-machine-verifiable (NPTEL) to untraceable (one-day workshops). Off-the-shelf forgery detectors trained on standardised Western corpora transfer poorly to this domain.

**Contributions.** (1) **CertiVerify**, an agentic multimodal verification framework combining deterministic forensics, supervised classification, and learned ensemble reasoning for Indian academic certificates. (2) **CertiForge-HE**, a dataset of 5,800 annotated certificates across eight categories and four authenticity classes. (3) A domain-specific NER model with 0.92 macro F1 on five certificate entity types. (4) Explainable verdicts with per-agent evidence suitable for institutional audit. (5) A holistic Student Engagement Score (SES) grounded in verified records.

---

## 2. Related Work

Prior student information and e-portfolio systems [1, 3, 2] centralise records but rely on self-reported, unverified data. Classical document forensics uses Error Level Analysis and PDF structural checks; these fail against diffusion-based inpainting whose JPEG residuals are near-indistinguishable from genuine artifacts. TruFor [4] applies noiseprint CNN features to splicing detection; CAT-Net [5] detects double-JPEG compression at the DCT level; ForgeryGPT [6] and M2F2-Det [7] apply multimodal LLMs to forgery localisation. None are trained on academic certificates, which exhibit distinctive visual vocabulary (institutional watermarks, signature blocks, formatted date fields). Zero-shot multimodal LLM benchmarks [8] report AUC 0.6–0.8 on transactional documents but cannot be deployed offline — a binding constraint under the Indian DPDP Act 2023 [18]. Recent agentic forensics decomposes document analysis across specialist modules [9]; CertiVerify adapts this pattern with two domain-specific contributions absent in prior work: a Field Cross-Check Agent that compares certificate content against student submission metadata, and calibrated trust-tier weighting based on issuer characteristics.

**Table 1.** Coverage gaps in prior work.

| Approach | Coverage | Limitation |
|---|---|---|
| Activity tracking systems | Record logging | No certificate verification |
| ELA + metadata forensics | Visual tampering | Fails on AI inpainting |
| TruFor, CAT-Net | Image splicing | Not trained on certificates |
| Zero-shot MLLMs | Multimodal reasoning | No privacy, hallucination |
| Blockchain verification | Tamper-proof anchoring | Requires issuer participation |
| Generic agentic forensics | General documents | No field-level cross-check |

---

## 3. The CertiVerify Framework

CertiVerify decomposes verification across seven agents (Fig. 1): one Ingestion Agent, five specialist analysers executed in parallel, and a central Reasoning Agent. All agents share a common interface — consuming a shared state object and emitting a structured evidence report with a scalar confidence in [0, 1] and a list of named evidence items used by the Reasoning Agent for natural-language explanation.

```
    Upload -> Ingestion (OCR, Layout, Metadata, DPI)
                 |
         +-------+-------+-------+--------+
         v       v       v       v        v
       Text  Visual   Layout  Metadata  Field
                              Cross-Check
         +-------+-------+-------+--------+
                         |
                    Reasoning Agent
                 (calibrated ensemble
                  + NL explanation)
                         |
            auto_verified / needs_review / rejected
```
**Fig. 1.** CertiVerify multi-agent architecture.

**Ingestion Agent.** PDFs are rasterised at 300 DPI (PyMuPDF). EXIF metadata is extracted from images before any processing that might strip it. PaddleOCR [11] produces multi-script text (English, Devanagari, Kannada, Tamil, Telugu) and a layout map with per-region bounding boxes, font-size estimates, and OCR confidence.

**Text Agent.** A custom NER model (Sect. 4) extracts five entity types. A fine-tuned sentence classifier scores semantic coherence, flagging implausible combinations (e.g., event descriptions inconsistent with declared category). A RoBERTa classifier trained on genuine and LLM-generated certificate text assigns a machine-generation probability.

**Visual Forensics Agent.** Error Level Analysis (re-save at JPEG Q85, pixel-wise residual) is mapped to per-region tampering probabilities by a fine-tuned ResNet-50 [16]. Noise inconsistency analysis flags statistically mismatched regions. Institutional logos are matched against a curated database of 340 Indian HE logos.

**Layout Agent.** Font-size and family variance are computed across text blocks. A fine-tuned LayoutLMv3 [13] scores category-specific template conformance against learned spatial signatures for each of the eight activity categories.

**Metadata Agent.** PDF metadata (author, creator, creation/modification dates) is checked for internal consistency. EXIF fields flag editor signatures. DCT coefficient histogram analysis detects double-JPEG compression — a signature of screenshots re-edited and re-saved.

**Field Cross-Check Agent.** This agent — unique to certificate verification — compares extracted certificate entities against student-submitted form fields. Name pairs use Jaro-Winkler with transliteration normalisation; dates use normalised parsing with ±3 day tolerance; institutions use token overlap plus fuzzy matching; event titles use TF-IDF cosine similarity; categories use rule-based mapping. A Random Forest (500 trees, trained on 3,200 faculty-labelled pairs) combines per-field similarities into an overall match score.

A two-stage duplicate detector addresses a known failure mode of naive vector similarity on highly standardised documents (e.g., two certificates from the same multi-day workshop differing only in date). *Stage 1:* pgvector cosine similarity > 0.92 on NER entity embeddings flags candidates. *Stage 2:* for each candidate, exact comparison of DATE and EVENT entities — if date distance exceeds 7 days or event token overlap is below 0.6, the duplicate penalty is bypassed. Only when both stages confirm a match is `duplicate_flag` set.

**Reasoning Agent.** The final score is a weighted ensemble:

$$s = 0.25\,t + 0.25\,v + 0.20\,\ell + 0.15(1 - m) + 0.15\,f \tag{1}$$

where $t, v, \ell, m, f$ are the Text, Visual, Layout, Metadata anomaly, and Field-match confidences. Weights were determined by Bayesian optimisation on the validation fold. If `duplicate_flag` is set, $s$ is reduced by 0.30 and routed to `needs_review`. Verdicts: $s \geq 0.85$ → `auto_verified`; $0.55 \leq s < 0.85$ → `needs_review`; $s < 0.55$ → `rejected`. A structured natural-language explanation cites per-agent evidence (e.g., "Visual Agent flagged elevated ELA residuals at the date field; Field Cross-Check confirmed name match but date mismatch of 12 days") and is persisted in the audit log.

---

## 4. Domain-Specific NER Model

The NER corpus comprises 4,200 annotated certificate images: consented genuine samples across three academic years, template-generated synthetic samples, and controlled text-perturbation augmentations. Four annotators labelled under a five-entity schema (`STUDENT_NAME`, `INSTITUTION`, `EVENT`, `DATE`, `CERT_TYPE`) using Prodigy; inter-annotator agreement (Cohen's κ) was 0.91. The base model is spaCy `en_core_web_trf` [10], fine-tuned for 30 epochs (lr 2e-5, batch 16, patience 5). A token-level script classifier routes Devanagari and Dravidian-script tokens through IndicBERT-base [14] before fusion with the spaCy transformer output. Macro F1 under 5-fold CV is **0.92**, with per-entity F1 ranging from 0.87 (EVENT) to 0.96 (DATE).

---

## 5. CertiForge-HE Benchmark

No public Indian academic certificate dataset exists. CertiForge-HE comprises 5,800 samples across eight activity categories and four authenticity classes (Table 2).

**Table 2.** CertiForge-HE composition (stratified 70/15/15 split).

| Class | Train | Val | Test | Total |
|---|---:|---:|---:|---:|
| Genuine   | 2,030 | 435 | 435 | 2,900 |
| Forged    |   820 | 175 | 175 | 1,170 |
| AI-Edited |   710 | 152 | 152 | 1,014 |
| Duplicate |   500 | 107 | 107 |   714 |

*Genuine* samples were student-contributed (2022–2024, Presidency University) with written informed consent. *Forged* samples were produced via GIMP, Photoshop, and Canva using logged manipulation types (text replacement, logo substitution, border modification). *AI-Edited* samples used Stable Diffusion XL inpainting for text-region replacement and Gemini 2.5 Flash for full generation. *Duplicate* samples include rotation, compression, and crop variants.

**Ethics and Consent.** The study was approved by the Department of Computer Science Ethics Committee, Presidency University. PII in released samples is pseudonymised; small-organiser logos are blurred unless consent was obtained. The dataset will be released under a research-only licence requiring institutional sign-off.

---

## 6. Deployment

Training used a single NVIDIA A100 (40 GB). Inference runs on two NVIDIA T4 GPUs (16 GB), with ONNX Runtime INT8 quantisation reducing per-model memory by ~55% at accuracy cost below 0.4 percentage points. Orchestration uses a LangGraph cyclic state graph: the Ingestion Agent populates shared state, the five specialists run as concurrent nodes, and the Reasoning Agent is gated on all five `DONE` signals. Wall-clock latency is bounded by the slowest agent (Visual Forensics, ~2.1 s); end-to-end ~2.6 s per certificate. Under 50 simultaneous uploads, p95 remains at 2.9 s and p99 at 3.4 s. The web stack is React 18 + TypeScript with Supabase (PostgreSQL + Auth + Storage) enforcing row-level security.

---

## 7. Results

All results are 5-fold stratified cross-validation on CertiForge-HE train+validation, with final evaluation on the held-out test fold (*n* = 869).

**Table 3.** End-to-end verification performance.

| Method | Acc. | F1 (G / F / AI) | AUC | Time |
|---|---|---|---|---|
| **CertiVerify (Full)**      | **94.1 ± 0.8** | **0.95 / 0.91 / 0.89** | **0.95** | 2.6 s |
| ViT-Base (fine-tuned)       | 86.3 ± 1.1     | 0.89 / 0.84 / 0.73     | 0.88     | 1.1 s |
| GPT-4o (zero-shot)*         | 69.3 ± 2.4     | 0.78 / 0.64 / 0.53     | 0.73     | 8.1 s |
| ELA + rule-based            | 72.8 ± 1.7     | 0.81 / 0.67 / 0.58     | 0.76     | 0.9 s |
| Generic OCR + regex         | 76.4 ± 1.5     | 0.84 / 0.71 / 0.62     | 0.80     | 1.4 s |
| Text-only RoBERTa           | 80.2 ± 1.2     | 0.87 / 0.76 / 0.69     | 0.84     | 0.7 s |

*External API; not deployable under DPDP privacy constraints.

The ViT-Base baseline is the critical comparison: fine-tuned on the same CertiForge-HE data, it isolates the effect of architectural choice from training-data advantage. Its plateau at 86.3% and AI-Edited F1 of 0.73 (vs. CertiVerify's 0.89) confirm that a single holistic image classifier cannot jointly reason over pixel-level ELA anomalies, spatial layout deviation, and field-level semantic mismatch. Agent decomposition yields a 7.8-point gain attributable specifically to architectural separation of concerns.

**Table 4.** Ablation study (AUC and class-specific F1).

| Variant | AUC | Forged F1 | AI-Edited F1 |
|---|---|---|---|
| Full system                          | **0.95** | **0.91** | **0.89** |
| − Visual Forensics Agent             | 0.82     | 0.74     | 0.61 |
| − Field Cross-Check Agent            | 0.88     | 0.86     | 0.84 |
| − Metadata Agent                     | 0.91     | 0.88     | 0.86 |
| − Layout Agent                       | 0.90     | 0.87     | 0.83 |
| − Reasoning Agent (avg. ensemble)    | 0.89     | 0.85     | 0.82 |
| Text Agent only                      | 0.84     | 0.76     | 0.69 |

Visual Forensics contributes the largest individual gain (+0.13 AUC); Field Cross-Check is second (+0.07 AUC) and is the only agent that detects genuine-certificate/incorrect-form-data mismatches. Replacing the learned Reasoning Agent with a simple average ensemble reduces AUC by 0.06.

**Visual vs. Layout complementarity.** On the AI-Edited subset, Visual Forensics alone detects 71.1%, Layout alone 58.6%, both simultaneously 52.0%, and the union 77.7%. Only 52% overlap confirms non-redundant signals: ELA captures frequency-domain artifacts from diffusion inpainting, while LayoutLMv3 captures spatial-domain character-spacing and line-height deviation. The full system reaches 89.0% AI-Edited detection.

**Duplicate detection.** The two-stage pipeline detects 97.8% of duplicates with a 2.1% false-positive rate, reducing false positives by 6.4 points over single-stage pgvector on the multi-day workshop subset.

**Workflow impact and explainability.** Verdict distribution on the full dataset: 64.7% `auto_verified`, 22.8% `needs_review`, 12.5% `rejected`. Operational false-positive rate (genuine rejected) is 4.1% [95% CI: 3.2–5.1%]. Average faculty review time drops from 4.2 to 1.2 minutes per submission (on the `needs_review` subset), with an estimated 163 faculty-hours saved per 500-student cohort annually. Twelve faculty raters scored natural-language explanations for 50 `needs_review` verdicts at a mean 4.6/5 on actionability (5-point Likert, σ = 0.4).

---

## 8. Student Engagement Score

Beyond verification, the platform computes a 0–100 Student Engagement Score (SES) from each student's verified portfolio. The base component weights categories (Internships and Leadership: 10; Academic Excellence: 9; Competitions: 8; Certifications: 7; Conferences: 6; Community Service: 5; Clubs: 4) with diminishing returns capped at three records per category. A diversity bonus adds 5 points per unique category (max 40). A verification-rate multiplier (0.2–1.0) scales the result by the fraction of submissions that are verified, penalising portfolios with predominantly unverified records. Grade bands: A+ (≥ 90), A (≥ 75), B+ (≥ 60), B (≥ 45), C (≥ 30), D (< 30).

---

## 9. Security, Privacy, and Bias

Documents are stored in Supabase Storage with short-lived signed URLs; no certificate data leaves the institutional deployment. Row-level security enforces department-scoped faculty access. All agent outputs and verdicts are logged immutably for audit. The system is designed for compliance with the Indian DPDP Act 2023 [18].

CertiVerify defends against naive forgery, AI-assisted forgery, and duplicate resubmission; it does not defend against insider collusion or adversarial perturbation attacks crafted against known weights (mitigated by keeping weights private to the institutional deployment). Two fairness risks were evaluated explicitly. *Name and script bias:* NER `STUDENT_NAME` F1 ranges from 0.93 (anglicised) to 0.89 (Northeast Indian and Dravidian-script transliterations) — a 4-point gap targeted by ongoing data collection. *Issuer trust bias:* a naive prominence ranking would disadvantage regional and vernacular-event participants, so CertiVerify separates verification (does the certificate exist as claimed?) from prestige weighting, which is handled at the SES stage with explicit, auditable category weights.

---

## 10. Future Work

Priority extensions: (i) NER coverage across all 22 scheduled Indian languages with native-script annotation; (ii) direct DigiLocker integration [22] for near-machine-verifiable provenance on government-issued credentials; (iii) a continual-learning loop against GAN-generated adversarial forgeries; (iv) multi-institution federation for portable verified achievement records that survive institutional transfers.

---

## 11. Conclusion

CertiVerify decomposes certificate verification across five parallel specialist agents — text semantics, visual forensics, layout, metadata, and field-level cross-checking — synthesised by a calibrated Reasoning Agent. On CertiForge-HE it achieves 94.1% accuracy and 0.95 AUC, outperforming a fine-tuned ViT-Base baseline by 7.8 points and zero-shot multimodal LLMs by 18–24 points. The framework automates verification for 64.7% of submissions and provides explainable evidence for the remainder, reducing faculty workload by an estimated 71% while improving record integrity and accreditation readiness. Domain-specific NER for Indian academic certificates, two-stage duplicate detection, non-overlapping forensic signals, and audit-ready explanations together establish a deployable foundation for trustworthy student activity management in Indian higher education.

---

## References

1. Balasubramanian, S., Govindasamy, S.: Web-Based Student Information System for Managing Student Records. Int. J. Comput. Appl. **174**(2), 212–234 (2017)
2. Alqahtani, A., Goodwin, S.: E-Portfolio Systems in Higher Education: Opportunities and Challenges. Educ. Inf. Technol. **25**(3), 1695–1712 (2020)
3. Khandare, R., Jadhav, P.: Web-Based Activity Tracking System for Students. Int. J. Eng. Res. Technol. **10**(7), 568–573 (2021)
4. Guillaro, F., Cozzolino, D., Sud, A., Dufour, N., Verdoliva, L.: TruFor: Leveraging All-Round Information for Universal Image Forgery Detection and Localization. In: Proc. CVPR (2023)
5. Kwon, M., Nam, S., Yu, I., Lee, H., Kim, C.: Learning JPEG Compression Artifacts for Image Manipulation Detection and Localization. Int. J. Comput. Vis. **130**, 1875–1895 (2022)
6. Zhang, Y., Yu, S., Liu, J., Wu, X., et al.: ForgeryGPT: Multimodal Large Language Model for Explainable Image Forgery Detection and Localization. arXiv:2410.10238 (2024)
7. Guo, R., Tang, Y., Wang, M., et al.: M2F2-Det: Multi-Modal Interpretable Forged Face Detector. In: Proc. CVPR (2025)
8. Chen, X., Li, Z., Sun, P., et al.: Can Multi-modal LLMs Detect Document Manipulation? A Benchmark Study. arXiv:2508.11021 (2025)
9. Chen, J., Wang, Y., Li, Z., et al.: DocAgent: Agentic Long Document Understanding with Multimodal LLMs. In: Proc. ACL Findings (2025)
10. Honnibal, M., Montani, I.: spaCy: Industrial-Strength Natural Language Processing in Python. https://spacy.io (2017)
11. Du, Y., Li, C., Guo, R., et al.: PP-OCR: A Practical Ultra Lightweight OCR System. arXiv:2009.09941 (2020)
12. Breiman, L.: Random Forests. Mach. Learn. **45**(1), 5–32 (2001)
13. Xu, Y., Lv, T., Cui, L., et al.: LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking. In: Proc. ACM Multimedia (2022)
14. Kakwani, D., Kunchukuttan, A., Golla, S., et al.: IndicNLPSuite: Monolingual Corpora, Evaluation Benchmarks and Pre-trained Multilingual Language Models for Indian Languages. In: Findings of EMNLP (2020)
15. Dosovitskiy, A., Beyer, L., Kolesnikov, A., et al.: An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale. In: Proc. ICLR (2021)
16. He, K., Zhang, X., Ren, S., Sun, J.: Deep Residual Learning for Image Recognition. In: Proc. CVPR, pp. 770–778 (2016)
17. Selvaraju, R.R., Cogswell, M., Das, A., et al.: Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization. In: Proc. ICCV, pp. 618–626 (2017)
18. Ministry of Electronics and Information Technology, Government of India: Digital Personal Data Protection Act (2023)
19. National Assessment and Accreditation Council: Manual for Self-Study Report — Affiliated/Constituent Colleges. NAAC, Bangalore (2023)
20. Mitchell, E., Lee, Y., Khazatsky, A., et al.: DetectGPT: Zero-Shot Machine-Generated Text Detection using Probability Curvature. In: Proc. ICML (2023)
21. Cozzolino, D., Verdoliva, L.: Noiseprint: A CNN-Based Camera Model Fingerprint. IEEE Trans. Inf. Forensics Secur. **15**, 144–159 (2020)
22. DigiLocker, Ministry of Electronics and Information Technology: DigiLocker Issuer API Specification v3.2. Government of India (2024)
