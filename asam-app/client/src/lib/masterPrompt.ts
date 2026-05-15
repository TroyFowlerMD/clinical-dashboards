// Master Clinical Prompt — sent to Gemini with structured form data
// Based on NC Medicaid CCP 8D-4/8D-5, ASAM Criteria 3rd Ed (default), 
// and JFK ADATC-level documentation standards.

import type { LLMPayload } from "@shared/schema";

export function buildMasterPrompt(payload: LLMPayload): string {
  const { configuration: cfg, facilityCapabilities: caps, dimensions: dim } = payload;

  const editionNote =
    cfg.editionLanguage === "4th"
      ? "Use ASAM 4th Edition dimension labels and language (Dimension 1: Withdrawal Management; Dimension 2: Physical Health; Dimension 3: Mental Health; Dimension 4: Cognitive Conditions; Dimension 5: Readiness to Change; Dimension 6: Relapse, Continued Use, Continued Problem; Dimension 7: Recovery Environment). Incorporate person-centered language per ASAM 4th edition guidance."
      : cfg.editionLanguage === "hybrid"
      ? "Default to ASAM 3rd Edition six-dimension labels but incorporate ASAM 4th Edition person-centered language where appropriate."
      : "Use ASAM 3rd Edition six-dimension labels: D1 (Acute Intoxication/Withdrawal), D2 (Biomedical), D3 (Emotional/Behavioral/Cognitive), D4 (Readiness to Change), D5 (Relapse/Continued Use Potential), D6 (Recovery Environment). This is the NC Medicaid default.";

  const ncNote = cfg.ncMedicaid
    ? `NC Medicaid / Tailored Plan context: This is an NC Medicaid case. Apply NC Medicaid Clinical Coverage Policy (8D-4 for Level 3.7, 8D-5 for Level 3.5) documentation standards. Explicitly address: (1) presenting problem and diagnostic summary, (2) ASAM dimensional risk ratings and clinical evidence, (3) functional impairment and ADL limitations, (4) safety risk profile, (5) prior treatment history, (6) level-of-care determination with specific medical necessity rationale referencing ASAM criteria, and (7) person-centered treatment plan elements. Use language acceptable to NC Tailored Plans (Cardinal Innovations, Trillium, Alliance, etc.) and standard Medicaid behavioral health UM reviewers.`
    : "";

  const locNote =
    cfg.levelOfCare === "3.7"
      ? "Primary focus: ASAM Level 3.7 (Medically Monitored Intensive Inpatient) admission and continued-stay justification."
      : cfg.levelOfCare === "3.5"
      ? "Primary focus: ASAM Level 3.5 (Clinically Managed High-Intensity Residential) admission and continued-stay justification."
      : "Document both ASAM Level 3.7 (acute/detox phase) and anticipated step-down to Level 3.5 (residential rehabilitation phase). Justify each level separately.";

  const outputInstructions =
    cfg.outputType === "narrative"
      ? "Generate the Chart Narrative section, the Psych Eval Note, and the Biopsychosocial Formulation sections."
      : cfg.outputType === "p2p"
      ? "Generate the Peer-to-Peer Script section (both call script and written appeal formats), the Psych Eval Note, and the Biopsychosocial Formulation sections."
      : "Generate all five sections: Chart Narrative, Peer-to-Peer Script, Clarifying Questions, Psych Eval Note, and Biopsychosocial Formulation.";

  // Serialize the structured data as readable clinical text
  const formDataSummary = JSON.stringify(
    {
      patientDescriptor: cfg.patientDescriptor || "[de-identified patient descriptor not entered]",
      levelOfCareRequested: cfg.levelOfCare,
      facilityCapabilities: {
        level37Summary: caps.level37.substring(0, 200) + "...",
        level35Summary: caps.level35.substring(0, 200) + "...",
      },
      dimensions: dim,
    },
    null,
    2
  );

  return `You are an expert addiction psychiatrist and clinical documentation specialist at a North Carolina state-operated ADATC (Alcohol and Drug Abuse Treatment Center) providing ASAM Level 3.7 and 3.5 services.

TASK: Using the structured clinical assessment data below, generate high-quality, insurance-defensible clinical documentation supporting medical necessity for the requested level of care. All documentation must reflect the patient's clinical status at the time of assessment (use past tense for admission notes, present tense for continued-stay).

EDITION & LANGUAGE: ${editionNote}

LEVEL OF CARE FOCUS: ${locNote}

NC MEDICAID CONTEXT: ${ncNote}

OUTPUT FORMAT: ${outputInstructions}

FACILITY CAPABILITIES (pre-authorized language):
Level 3.7: ${caps.level37}
Level 3.5: ${caps.level35}

STRUCTURED CLINICAL DATA (form fields — booleans indicate presence of finding):
${formDataSummary}

─────────────────────────────────────────────────────────────────────────────
DOCUMENTATION STANDARDS (follow strictly):

1. CHART NARRATIVE (for medical record):
   - Write in professional medical prose, paragraph form, past tense for admission documentation
   - Begin with patient descriptor and presenting clinical picture
   - Address each ASAM dimension with clinical evidence from the structured data
   - Explicitly state why the patient cannot be safely treated at a lower level of care
   - Include: diagnostic impression, ASAM level determination, functional impairment, safety risk, prior treatment history, treatment plan elements
   - Do NOT include direct identifiers (name, DOB, MRN)
   - Length: comprehensive but efficient — target 400-600 words for Level 3.7; 350-500 words for Level 3.5
   - End with a clear level-of-care determination statement

2. PEER-TO-PEER SCRIPT (for UM reviewer calls and written appeals):
   FORMAT A — CALL SCRIPT (spoken, first-person):
   - Start: "I'm calling to request authorization for [level] for a [descriptor]..."
   - Hit: diagnosis, ASAM dimension highlights, specific safety/medical risks, why lower LOC is insufficient
   - Anticipate common UM denial rationale and preemptively counter it
   - Close: specific ask for authorization with days requested
   
   FORMAT B — WRITTEN APPEAL (formal, third-person, suitable for email/fax):
   - Professional letter format: Re: Authorization Request for ASAM Level [X]
   - Structured paragraphs: clinical summary, ASAM dimensional analysis, medical necessity rationale, counter to anticipated denial, specific authorization request
   - Reference ASAM Criteria and NC Medicaid policy where applicable

3. CLARIFYING QUESTIONS / SUGGESTIONS (if applicable):
   - List any clinical domains where additional documentation would strengthen the case
   - Note any dimensional risk ratings that seem inconsistent with checked findings
   - Suggest any additional assessment tools or documentation that would support medical necessity
   - Keep to 3-5 bullet points

4. PSYCH EVAL NOTE (always generate):
   A draft psychiatric evaluation clinical note with sections: Chief Complaint, History of Present Illness, Mental Status Examination template (populate thought content from SI/HI/psychosis data, insight from D4 data), Substance Use History, Psychiatric History, Medical History, Social History/SDOH, Assessment, Plan.
   - 400-600 words. Use all free-text notes provided in the data.
   - Populate all sections with data from the form. Use "[Not documented — assess at time of evaluation]" only when truly no data exists for a section.
   - Separate with: === PSYCH EVAL NOTE ===

5. BIOPSYCHOSOCIAL FORMULATION (always generate):
   A biopsychosocial assessment and case formulation with sections: Biological Factors, Psychological Factors, Social/Environmental Factors, Substance Use Pattern, Precipitating Factors (current episode), Perpetuating Factors, Protective Factors/Strengths, Formulation Summary (3-4 sentence integration), Treatment Recommendations.
   - 400-600 words. Use all free-text notes provided in the data.
   - Separate with: === BIOPSYCHOSOCIAL FORMULATION ===

CRITICAL RULES:
- Never fabricate clinical details not present in the structured data
- If a finding is not checked, do not include it
- Use only the data provided; do not assume
- Maintain professional, insurance-defensible tone throughout
- Dimensional risk ratings (0-4) should anchor the narrative intensity for each domain
- Do not use tables — narrative prose and structured paragraphs only
- Separate each output section with: === [SECTION NAME] ===
- Always generate the Psych Eval Note and Biopsychosocial Formulation sections regardless of output type setting

Begin output now.`;
}
