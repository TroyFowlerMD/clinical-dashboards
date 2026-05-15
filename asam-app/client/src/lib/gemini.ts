// Gemini API integration — uses gemini-2.0-flash (free tier)
import type { LLMPayload, GeneratedOutput } from "@shared/schema";
import { buildMasterPrompt } from "./masterPrompt";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateClinicalOutput(
  payload: LLMPayload,
  apiKey: string,
  onStream?: (chunk: string) => void
): Promise<GeneratedOutput> {
  const prompt = buildMasterPrompt(payload);

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
        role: "user",
      },
    ],
    generationConfig: {
      temperature: 0.3,       // low temp = consistent clinical language
      maxOutputTokens: 4096,
      topP: 0.9,
    },
    safetySettings: [
      // Relax medical content filters — clinical content about suicide/overdose is expected
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Gemini API error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    throw new Error("Gemini returned an empty response. Check your API key and try again.");
  }

  return parseOutput(rawText);
}

// Parse the structured output sections from the LLM response
function parseOutput(raw: string): GeneratedOutput {
  const narrativeMatch = raw.match(/===\s*CHART NARRATIVE\s*===\s*([\s\S]*?)(?===|$)/i);
  const p2pMatch = raw.match(/===\s*PEER-TO-PEER SCRIPT\s*===\s*([\s\S]*?)(?===|$)/i);
  const clarifyMatch = raw.match(/===\s*CLARIFYING QUESTIONS[^=]*===\s*([\s\S]*?)(?===|$)/i);
  const psychEvalMatch = raw.match(/===\s*PSYCH EVAL NOTE\s*===\s*([\s\S]*?)(?===|$)/i);
  const biopsychMatch = raw.match(/===\s*BIOPSYCHOSOCIAL FORMULATION\s*===\s*([\s\S]*?)(?===|$)/i);

  return {
    chartNarrative: narrativeMatch ? narrativeMatch[1].trim() : raw,
    p2pScript: p2pMatch ? p2pMatch[1].trim() : "",
    clarifyingQuestions: clarifyMatch ? clarifyMatch[1].trim() : "",
    psychEvalNote: psychEvalMatch ? psychEvalMatch[1].trim() : "",
    biopsychosocialFormulation: biopsychMatch ? biopsychMatch[1].trim() : "",
  };
}
