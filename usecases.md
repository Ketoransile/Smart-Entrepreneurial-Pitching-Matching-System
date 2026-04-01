# Smart Entrepreneur Pitching and Matching System - Implementation Plan

This document outlines the implementation plan for Use Cases 05 through 15, detailing the workflows for document submission, validation, AI processing, and error handling within the system.

---

## UC-05: Full Pitch Creation and AI Submission

**Description:** Complete end-to-end workflow for an Entrepreneur submitting their project pitch, leading directly into the system's core automated evaluation and classification processes.
* **Primary Actor:** Entrepreneur, AI Evaluation Engine
* **Goal:** To create a new project record and attach all validated required documents.
* **Pre-conditions:** Entrepreneur has an approved account and is logged in.

### Flow of Events
1. Entrepreneur navigates to "Start New Pitch" and completes the initial Guided Templates (Title, Funding Goal, Summary).
2. System stores this structured data in the database and creates the Project Record.
3. Entrepreneur opens the “Business Document Upload” section linked to the new Project Record.
4. System displays the required checklist (License, TIN, MoA, Financials, Pitch Deck, etc.).
5. Entrepreneur uploads all required documents.
6. System validates file type/size [FR 2.2].
7. OCR extracts text; the local classifier identifies and validates the content of each document.
8. AI Completeness Checker (FR 2.3) scores the submission as Complete.
9. System moves the submission status to “Pending Admin Review” (for initial compliance check).
10. Administrator verifies the submission on the dashboard and approves.

**Outcome:** Pitch submission proceeds to the comprehensive AI evaluation (embeddings/matching) and recommendation stage.

---

## UC-06: Missing Required Documents (Submission Pre-Validation)

**Description:** The system halts a submission and provides actionable feedback when mandatory business documents are missing, enforcing data completeness.
* **Primary Actor:** Entrepreneur
* **Goal:** To ensure an incomplete pitch submission is corrected and completed before it can proceed to the evaluation pipeline.
* **Pre-conditions:** Entrepreneur has completed the structured pitch forms and initiated the Document Upload step.

### Flow of Events (Alternative Path)
1. Entrepreneur navigates to the "Business Document Upload" checklist.
2. Entrepreneur uploads several documents but omits the TIN Certificate and Financial Statements.
3. Entrepreneur attempts to finalize the submission.
4. System runs a synchronous Pre-Validation Check against the required document checklist.
5. System detects the missing mandatory items.
6. System halts the submission process and displays specific alerts to the Entrepreneur: "TIN Certificate missing," "Financial Statements required."
7. Entrepreneur uploads the missing TIN Certificate and Financial Statements.
8. System re-runs the Pre-Validation check and finds the submission complete.

**Outcome:** The submission status is updated to "Complete", and the system automatically triggers the AI Evaluation Engine for deep processing (as per UC02).

---

## UC-07: Wrong Document Uploaded (Content Mismatch)

**Description:** The system uses automated classification tools to detect incorrect documents (a content mismatch) and enforces the correct upload.
* **Primary Actor:** Entrepreneur
* **Goal:** To reject a document whose content does not match the required type (e.g., uploading a photo instead of a legal PDF).
* **Pre-conditions:** Entrepreneur has initiated the Document Upload step linked to their Pitch Record.

### Flow of Events (Alternative Path)
1. Entrepreneur navigates to the upload slot for MoA & AoA (Memorandum and Articles of Association).
2. Entrepreneur mistakenly uploads a non-text document (e.g., a product photo).
3. System accepts the file type (e.g., JPG) but immediately passes the content to the OCR and Local Classifier.
4. OCR extracts minimal or irrelevant text; the Classifier detects a mismatch (e.g., identifying the content as "Image Data" or "Non-Legal Document").
5. System sets the document status to "Incorrect Upload".
6. System displays a clear alert to the Entrepreneur: "The uploaded file does not match the required document type (Expected: MoA/AoA)."
7. Entrepreneur uploads the correct MoA & AoA document.
8. System validates the correct content and updates the document status to "Verified".

**Outcome:** The Pitch submission checklist is completed only after the mandatory, correctly identified MoA & AoA document is present.

---

## UC-08: Expired or Outdated Document Submission

**Description:** The system checks the validity (based on dates) of time-sensitive legal documents like a Business License.
* **Primary Actor:** Entrepreneur
* **Goal:** To block the submission of a pitch until all mandatory legal documents are current and valid.
* **Pre-conditions:** Entrepreneur has successfully uploaded a document (e.g., Business License).

### Flow of Events (Alternative Path)
1. Entrepreneur uploads a required legal document, such as a Business License.
2. System validates the file type and size.
3. OCR (Optical Character Recognition) extracts key text, specifically the Issue Date and Expiry Date from the document.
4. Rule-Based Logic compares the extracted Expiry Date against the system's current date.
5. System identifies that the Expiry Date is in the past.
6. System assigns the document status as "Expired" and displays a specific, non-blocking alert: "Your business license is expired. Please upload the renewed version."
7. System keeps the overall Pitch Submission status as "Incomplete/Blocked".
8. Entrepreneur obtains and uploads the renewed license.
9. System repeats steps 3-6 and confirms the new date is valid.

**Outcome:** The document status is updated to "Verified", and the pitch proceeds to the next stage (AI Evaluation).

---

## UC-09: Low-Quality/Unreadable Document Scenario

**Description:** The system detects and rejects documents that are physically unreadable based on OCR confidence scores.
* **Primary Actor:** Entrepreneur
* **Goal:** To prevent unreadable documents from proceeding to the AI evaluation pipeline, ensuring data quality at the source.
* **Pre-conditions:** Entrepreneur has successfully uploaded a file to a document slot.

### Flow of Events (Alternative Path)
1. Entrepreneur uploads a document (e.g., a blurry PDF scan of a business license).
2. System passes the document to the OCR Engine for text extraction.
3. The OCR Engine attempts extraction but returns a confidence score below the threshold (e.g., Confidence < 50%).
4. Classifier (FR 3.2) cannot reliably identify the document type or content due to low OCR score.
5. System flags the document status as "Unreadable" and temporarily routes the event for a fallback check (a lightweight administrative alert if confidence is extremely low).
6. System displays a clear alert to the Entrepreneur: "Document is unreadable. Please upload a clearer version."
7. Entrepreneur replaces the blurry document with a high-quality scan.
8. System repeats steps 2-4 and achieves a high confidence score.

**Outcome:** The document status is updated to "Verified", and the pitch proceeds to the next stage (AI Evaluation and Matching).

---

## UC-10: Fraud or Suspicious Document Scenario

**Description:** The system detects complex anomalies and inconsistencies within documents suggesting potential fraud and escalates to the Administrator.
* **Primary Actor:** Entrepreneur (Submitter)
* **Supporting Actor:** AI Evaluation Engine, Administrator
* **Goal:** To detect documents with structural anomalies or mismatched data fields and ensure they do not proceed without human authorization.
* **Pre-conditions:** Entrepreneur has uploaded a required document (e.g., Business License or MoA).

### Flow of Events (Exception Path)
1. Entrepreneur uploads a document that has been digitally altered (e.g., edited license) or contains inconsistent data.
2. OCR successfully extracts text but identifies inconsistencies in formatting (e.g., font changes, alignment issues).
3. AI Engine performs an anomaly check, flagging two key issues: unusual formatting and mismatched business name (e.g., the name on the license doesn't match the Entrepreneur's profile name).
4. System immediately assigns the document status as "Flagged - Suspect Content".
5. System sends an urgent notification to the Administrator for manual review [FR 8.2].
6. Administrator reviews the document against the known profile data and the AI anomaly report.
7. Administrator either:
    * a) Requests resubmission if the error is minor (e.g., user uploaded the wrong corporate entity's license).
    * b) Rejects the account entirely if clear fraudulent intent is found (FR 8.1).

**Outcome:** The document is flagged; the submission is blocked, and the Administrator makes a final, auditable decision regarding the account's status.

---

## UC-11: Partial Completion and Draft Saving

**Description:** Allows an entrepreneur to save an incomplete pitch as a draft, ensuring a seamless user experience while preventing incomplete data from entering the matching pipeline.
* **Primary Actor:** Entrepreneur
* **Goal:** To allow the Entrepreneur to save partially completed work without losing progress.
* **Pre-conditions:** Entrepreneur has initiated a Pitch Submission (UC02, Step 1).

### Flow of Events (Alternative Path)
1. Entrepreneur uploads all mandatory Legal Documents (License, MoA, etc.) but leaves the Financial Statements section empty.
2. Entrepreneur attempts to exit the submission interface.
3. System runs a quick check and recognizes partial compliance (e.g., scoring text 60% against the required checklist).
4. System does not allow the pitch to be marked "Submitted" for review, displaying a notice: "Submission is incomplete. Only complete pitches are routed to investors."
5. System automatically or manually (via a "Save Draft" button) saves the current data and sets the Pitch status to "Draft".
6. Entrepreneur successfully exits the application and logs out.
7. Entrepreneur logs in a few days later and selects the Draft Pitch from their dashboard.
8. Entrepreneur uploads the remaining Financial Statements and clicks "Finalize Submission".
9. System confirms 100% completeness and triggers the AI Evaluation Pipeline.

**Outcome:** The Pitch is successfully saved in Draft status until the missing data is provided, after which it proceeds to the matching engine.

---

## UC-12: Multistep Upload (Handling Large Media Files)

**Description:** Handles large media files efficiently using chunked upload and asynchronous processing to avoid timeouts.
* **Primary Actor:** Entrepreneur
* **Supporting Actor:** External Services (Cloud Storage/Cloudinary)
* **Goal:** To successfully upload large files without browser timeouts or session failure, leveraging external scalable media handling.
* **Pre-conditions:** Entrepreneur is logged in and is on the Document/Media Upload interface.

### Flow of Events (Main Success Path)
1. Entrepreneur selects a large file (e.g., a business video > 50 MB) for upload.
2. System initiates the upload process, displaying a progress bar to the Entrepreneur.
3. The Cloudinary (or similar external storage) integration handles the file using chunked upload, sending data in smaller, manageable segments [FR 10.2].
4. System constantly updates the progress bar until the upload is 100% complete.
5. Once the upload finishes, the System displays the message: "Upload successful".
6. System then displays "Processing document..." as the file is passed to an asynchronous worker for indexing and virus scanning.
7. The Completeness Checker runs only after the asynchronous processing is finished and the final URL is returned to the database.

**Outcome:** The large file is stored reliably in external services, preventing internal API timeouts, and the pitch submission record is updated with the media URL.

---

## UC-13: Document Conflict (Name Mismatch)

**Description:** Cross-references data extracted from different documents, detects conflicts (e.g., mismatched business names), and escalates for human resolution.
* **Primary Actor:** Entrepreneur (Submitter)
* **Supporting Actor:** AI Evaluation Engine, Administrator
* **Goal:** To detect and flag potential conflicts between essential legal documents, ensuring data integrity across the submission.
* **Pre-conditions:** Entrepreneur has uploaded two or more documents that contain overlapping data fields (e.g., Business Name, Registration Number).

### Flow of Events (Exception Path)
1. Entrepreneur uploads the TIN Certificate and the Business License.
2. OCR Engine extracts the designated entity name from the TIN Certificate (e.g., "Mamo Retail P.L.C.").
3. OCR Engine extracts the designated entity name from the Business License (e.g., "Mamo Retailers P.L.C.").
4. System Logic compares the two extracted strings and detects a mismatch (minor difference or major conflict).
5. System flags the document set status as "Conflict Detected" and provides a specific alert to the Entrepreneur: "Document names differ. Please provide supporting evidence or correct the upload."
6. System automatically routes the submission to the Administrator for manual review [FR 8.2].
7. Administrator reviews the conflict and either:
    * a) Approves the conflict if it is a minor, known discrepancy (e.g., a simple spelling mistake).
    * b) Requests additional documents (e.g., a letter from the business registry) to resolve the conflict.

**Outcome:** The submission is blocked from matching until the Administrator has verified the conflict and manually approved or requested clarification.

---

## UC-14: Administrator Correction and AI Override

**Description:** Allows an Administrator to review a submission incorrectly flagged by the AI, overriding the automated decision.
* **Primary Actor:** Administrator
* **Supporting Actor:** AI Evaluation Engine
* **Goal:** To allow a human expert (Administrator) to correct a potential false positive flagged by the AI, ensuring valid submissions are not blocked.
* **Pre-conditions:** A pitch document (e.g., MoA) has been flagged by the AI (e.g., in UC10) and its status is "Pending Admin Review."

### Flow of Events (System Correction Path)
1. Administrator logs into the Admin Dashboard [FR 8.1] and navigates to the "Flagged Submissions" queue [FR 8.2].
2. System displays the flagged document alongside the AI notes explaining why it was flagged (e.g., low confidence score, minor formatting inconsistency).
3. Administrator reviews the document and determines the flag is a false positive (the document is legally valid).
4. Administrator clicks the action button “Override AI Decision (Mark as Valid)”.
5. System records the Administrator's action, the timestamp, and the reason (if provided) in the Audit Log [FR 7.2].
6. System updates the document status to "Verified by Admin".
7. System changes the overall pitch status to "Ready for Matching" (or triggers the next step in the workflow).

**Outcome:** Human judgment prevails; the submission continues through the pipeline, and the override action is logged for accountability and future AI model training.

---

## UC-15: Multi-Business Entrepreneur (Conflict of Entities)

**Description:** Detects and resolves conflicts where documents uploaded by a single user belong to different, distinct legal entities.
* **Primary Actor:** Entrepreneur
* **Supporting Actor:** AI Evaluation Engine
* **Goal:** To identify which legal entity the pitch is for and ensure all supporting documents consistently belong to that single entity.
* **Pre-conditions:** Entrepreneur is submitting a new pitch (UC02) and likely owns multiple businesses.

### Flow of Events (Exception Path)
1. Entrepreneur uploads the Business License for Company A.
2. Entrepreneur mistakenly uploads the MoA & AoA for Company B.
3. System extracts the entity names from both documents (UC13 logic).
4. AI Logic detects a significant mismatch between the core legal documents.
5. System flags the submission as "Entity Conflict" and halts processing.
6. System asks the Entrepreneur: “We detected a name conflict: [Company A] vs. [Company B]. Which business is this pitch for?”
7. Entrepreneur selects the correct entity, Company A, confirming the intent.
8. System uses the selection to generate a new, targeted checklist for Company A's required documents.
9. System alerts the Entrepreneur that all conflicting documents (Company B's MoA) must be replaced with Company A's documents.

**Outcome:** The submission is locked to a single legal entity, and the Entrepreneur must upload a consistent set of documents before proceeding.