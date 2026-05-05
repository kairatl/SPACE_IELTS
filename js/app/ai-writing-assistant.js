/**
 * AI Writing Assistant — chat completion request (configure apiKey & system prompt below).
 */
const AI_PROXY_URL = "/api/ai";
const AI_MODEL = "gpt-4o-mini";
const SYSTEM_PROMPT =
    "You are a strict but encouraging IELTS Examiner. Analyze the essay using a structured, academic feedback style. CRITICAL: If the calculated score is between bands (e.g., 6.1 or 6.6), always round UP to the nearest 0.5 to give the student a slight motivational boost (the Euphoria Effect), but keep the feedback honest. Your response MUST follow this exact format: ### Critical mistakes and weaknesses #### Task & logic - Identify issues with task response, clarity of position, or balance. Explain WHY and HOW to improve. #### Lexical Resource - Point out unnatural word choices. - Format: Incorrect phrase | Explanation | Correct: better academic version. #### Grammar & structure - Identify mistakes. For EVERY mistake, provide a Before/After example: - Example: He go (Incorrect) -> He goes (Correct: Subject-verb agreement). - Mention if the student should use more C1 structures (inversions, conditionals). ### Improved version (Band 7.5 style) - Rewrite the essay keeping the same ideas but using better flow and sophisticated (but natural) grammar. ### IELTS-style evaluation 1. Task Achievement — [score/9] 2. Coherence and Cohesion — [score/9] 3. Lexical Resource — [score/9] 4. Grammatical Range and Accuracy — [score/9] Overall Estimated Score: X / 9 ### Student Takeaway - Give 3–4 specific bullet points on how to reach the next band. Focus on practical steps. Additional instructions: Be direct. Avoid empty praise. Focus on making the student feel that a higher band is within reach if they fix these specific points.";

async function runAIAnalysis() {
    const input = document.getElementById("ai-input");
    const resultEl = document.getElementById("ai-result");
    if (!input || !resultEl) return;

    const text = input.value.trim();

    resultEl.style.display = "block";
    resultEl.classList.remove("wg-ai-result--error");

    if (!text) {
        resultEl.textContent =
            "Paste your writing above, then tap “Check with AI”.";
        resultEl.classList.add("wg-ai-result--error");
        return;
    }

    resultEl.textContent = "Analyzing...";

    try {
        const res = await fetch(AI_PROXY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: AI_MODEL,
                text,
                systemPrompt: SYSTEM_PROMPT,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg =
                data.error?.message ||
                `${res.status} ${res.statusText || ""}`.trim();
            resultEl.textContent = msg || "Request failed.";
            resultEl.classList.add("wg-ai-result--error");
            return;
        }

        const raw = data.content ?? "";
        const normalized = String(raw).replace(/\r\n/g, "\n");
        resultEl.textContent = normalized || "(Empty response)";
    } catch (err) {
        resultEl.textContent =
            err && err.message ? String(err.message) : "Network error.";
        resultEl.classList.add("wg-ai-result--error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("ai-btn");
    if (btn) {
        btn.addEventListener("click", () => runAIAnalysis());
    }
});
