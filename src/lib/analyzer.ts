import { GoogleGenerativeAI } from '@google/generative-ai';
import { analyzeHeuristics, extractUrls } from './heuristics';
import { PHISHING_ANALYZER_SYSTEM_PROMPT } from './prompt';
import { ScanResult } from './types';

export async function analyzeMessage(message: string): Promise<ScanResult> {
  const heuristicResult = analyzeHeuristics(message);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful fallback to heuristic engine if no API key is set
    return heuristicResult;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const promptText = `${PHISHING_ANALYZER_SYSTEM_PROMPT}\n\n<untrusted_message>\n${message}\n</untrusted_message>`;
    const response = await model.generateContent(promptText);
    const rawText = response.response.text();

    const parsedAiResult = JSON.parse(rawText);

    // Merge AI insights with heuristic safety floor (prevent hallucinated 0 score if dangerous URL/APK exists)
    const combinedScore = Math.max(parsedAiResult.riskScore || 0, heuristicResult.riskScore);
    const finalVerdict = combinedScore >= 65 ? 'DANGEROUS_PHISHING' : (combinedScore >= 30 ? 'SUSPICIOUS' : 'SAFE');

    // Combine red flags with deduplication
    const allRedFlags = [...(parsedAiResult.redFlags || []), ...heuristicResult.redFlags];
    const uniqueRedFlags = Array.from(new Map(allRedFlags.map(item => [item.title, item])).values());

    return {
      riskScore: combinedScore,
      verdict: finalVerdict,
      impersonatedEntity: parsedAiResult.impersonatedEntity || heuristicResult.impersonatedEntity,
      scamType: parsedAiResult.scamType || heuristicResult.scamType,
      summary: parsedAiResult.summary || heuristicResult.summary,
      riskExplanation: parsedAiResult.riskExplanation || heuristicResult.riskExplanation,
      redFlags: uniqueRedFlags,
      suspiciousLinks: extractUrls(message),
      safeRemedies: parsedAiResult.safeRemedies?.length ? parsedAiResult.safeRemedies : heuristicResult.safeRemedies,
      analyzedAt: new Date().toISOString(),
      engineUsed: 'hybrid_ai'
    };
  } catch (error) {
    console.error('Gemini API analysis failed, falling back to heuristic engine:', error);
    return heuristicResult;
  }
}
