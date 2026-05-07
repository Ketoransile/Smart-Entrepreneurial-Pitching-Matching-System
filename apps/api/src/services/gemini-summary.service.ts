import { GoogleGenAI } from "@google/genai";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";
import { Submission } from "../models/Submission";

/**
 * Structured response from Gemini pitch summarization.
 */
export interface AiPitchSummary {
	executiveSummary: string;
	keyStrengths: string[];
	keyRisks: string[];
	investmentReadiness: string;
	marketOpportunity: string;
	generatedAt: string;
	model: string;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Retry a function with exponential backoff.
 * Retries on transient errors (rate limits, server errors).
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	label: string,
	maxRetries = MAX_RETRIES,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err as Error;
			const isRetryable =
				lastError.message?.includes("429") ||
				lastError.message?.includes("500") ||
				lastError.message?.includes("503") ||
				lastError.message?.includes("ECONNRESET") ||
				lastError.message?.includes("timeout");

			if (!isRetryable || attempt === maxRetries) {
				throw lastError;
			}

			const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
			console.warn(
				`[${label}] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms: ${lastError.message}`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * GeminiSummaryService
 * --------------------
 * Generates investor-grade AI pitch summaries using Google Gemini.
 * Also produces a voice narration (TTS) of the executive summary.
 *
 * Called asynchronously after pitch submission — never blocks the
 * submission flow. Failures are logged but do not affect the pitch.
 */
export class GeminiSummaryService {
	private constructor() {}

	/**
	 * Generate and persist an AI summary for a submission.
	 * This is the main entry point called from the AI worker.
	 */
	static async generateAndSave(submissionId: string): Promise<void> {
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			console.warn(
				"[GEMINI:SUMMARY] GEMINI_API_KEY not set — skipping summary generation",
			);
			return;
		}

		const submission = await Submission.findById(submissionId);
		if (!submission) {
			console.error(`[GEMINI:SUMMARY] Submission ${submissionId} not found`);
			return;
		}

		// Skip if summary already exists (idempotency)
		if (
			submission.aiSummary?.executiveSummary &&
			submission.aiSummary.executiveSummary.length > 0
		) {
			console.log(
				`[GEMINI:SUMMARY] Summary already exists for ${submissionId} — skipping`,
			);
			return;
		}

		console.log(
			`[GEMINI:SUMMARY] Generating summary for "${submission.title}" (${submissionId})...`,
		);

		try {
			const summary = await withRetry(
				() => GeminiSummaryService.callGemini(GEMINI_API_KEY, submission),
				"GEMINI:SUMMARY",
			);

			// Save summary to database
			await Submission.findByIdAndUpdate(submissionId, {
				aiSummary: summary,
			});

			console.log(
				`[GEMINI:SUMMARY] ✅ Summary saved for "${submission.title}"`,
			);

			// Generate voice narration (TTS) in the background
			try {
				await GeminiSummaryService.generateVoiceSummary(
					GEMINI_API_KEY,
					submissionId,
					summary.executiveSummary,
				);
			} catch (ttsErr) {
				console.error(
					`[GEMINI:TTS] Voice generation failed for ${submissionId}:`,
					(ttsErr as Error).message,
				);
				// Non-blocking — text summary is still saved
			}
		} catch (err) {
			console.error(
				`[GEMINI:SUMMARY] Failed for "${submission.title}" after ${MAX_RETRIES} attempts:`,
				(err as Error).message,
			);
			throw err; // Re-throw so the worker can mark status as "failed"
		}
	}

	/**
	 * Force-regenerate a summary (used by admin regeneration endpoint).
	 * Overwrites any existing summary.
	 */
	static async regenerate(
		submissionId: string,
	): Promise<AiPitchSummary | null> {
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			throw new Error("GEMINI_API_KEY is not configured");
		}

		const submission = await Submission.findById(submissionId);
		if (!submission) {
			throw new Error("Submission not found");
		}

		console.log(
			`[GEMINI:SUMMARY] Regenerating summary for "${submission.title}" (${submissionId})...`,
		);

		// Mark as generating
		await Submission.findByIdAndUpdate(submissionId, {
			summaryStatus: "generating",
			summaryError: null,
		});

		try {
			const summary = await withRetry(
				() => GeminiSummaryService.callGemini(GEMINI_API_KEY, submission),
				"GEMINI:REGEN",
			);

			await Submission.findByIdAndUpdate(submissionId, {
				aiSummary: summary,
				summaryStatus: "completed",
				summaryError: null,
			});

			console.log(
				`[GEMINI:SUMMARY] ✅ Summary regenerated for "${submission.title}"`,
			);

			// Regenerate voice too
			try {
				await GeminiSummaryService.generateVoiceSummary(
					GEMINI_API_KEY,
					submissionId,
					summary.executiveSummary,
				);
			} catch (ttsErr) {
				console.error(
					`[GEMINI:TTS] Voice regeneration failed for ${submissionId}:`,
					(ttsErr as Error).message,
				);
			}

			return summary;
		} catch (err) {
			await Submission.findByIdAndUpdate(submissionId, {
				summaryStatus: "failed",
				summaryError: (err as Error).message,
			});
			throw err;
		}
	}

	/**
	 * Call Gemini to produce a structured pitch summary.
	 */
	private static async callGemini(
		apiKey: string,
		// biome-ignore lint/suspicious/noExplicitAny: Mongoose document type
		submission: any,
	): Promise<AiPitchSummary> {
		const ai = new GoogleGenAI({ apiKey });

		const pitchData = GeminiSummaryService.buildPitchContext(submission);

		const prompt = `You are an expert AI investment analyst working for a startup pitch evaluation platform.

Analyze the following startup pitch data and produce a structured JSON summary for investors and platform administrators.

RULES:
- Base your analysis ONLY on the information provided — do not infer or hallucinate data that is not present.
- Be concise but insightful. Write like a professional investment memo.
- The executiveSummary should be a 2-3 sentence elevator pitch that captures the essence of this startup.
- keyStrengths should list 3-5 concrete strengths based on what the founder has provided.
- keyRisks should list 3-5 risks, gaps, or concerns an investor should be aware of.
- investmentReadiness should be "High", "Medium", or "Low" followed by a dash and a one-sentence justification.
- marketOpportunity should be one paragraph assessing the market potential based on the data provided.

PITCH DATA:
"""
${pitchData}
"""

Return ONLY a valid JSON object — no markdown fences, no explanation, nothing else:
{"executiveSummary": "...", "keyStrengths": ["...", "..."], "keyRisks": ["...", "..."], "investmentReadiness": "High|Medium|Low — ...", "marketOpportunity": "..."}`;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
		});

		const rawText = response.text ?? "";

		// Strip markdown fences if Gemini wraps the response
		const cleaned = rawText
			.replace(/```json\s*/gi, "")
			.replace(/```\s*/g, "")
			.trim();

		const parsed = JSON.parse(cleaned) as {
			executiveSummary: string;
			keyStrengths: string[];
			keyRisks: string[];
			investmentReadiness: string;
			marketOpportunity: string;
		};

		return {
			executiveSummary: parsed.executiveSummary || "Summary unavailable.",
			keyStrengths: Array.isArray(parsed.keyStrengths)
				? parsed.keyStrengths
				: [],
			keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
			investmentReadiness:
				parsed.investmentReadiness || "Medium — Insufficient data",
			marketOpportunity:
				parsed.marketOpportunity || "Market assessment unavailable.",
			generatedAt: new Date().toISOString(),
			model: GEMINI_MODEL,
		};
	}

	/**
	 * Wrap raw PCM (signed 16-bit LE, mono) audio data in a WAV container.
	 * Gemini TTS returns audio/L16;rate=24000 — raw PCM without headers.
	 */
	private static pcmToWav(
		pcmBuffer: Buffer,
		sampleRate = 24000,
		channels = 1,
		bitsPerSample = 16,
	): Buffer {
		const byteRate = (sampleRate * channels * bitsPerSample) / 8;
		const blockAlign = (channels * bitsPerSample) / 8;
		const dataSize = pcmBuffer.length;
		const headerSize = 44;
		const fileSize = headerSize + dataSize;

		const header = Buffer.alloc(headerSize);

		// RIFF header
		header.write("RIFF", 0);
		header.writeUInt32LE(fileSize - 8, 4);
		header.write("WAVE", 8);

		// fmt sub-chunk
		header.write("fmt ", 12);
		header.writeUInt32LE(16, 16); // Sub-chunk size (16 for PCM)
		header.writeUInt16LE(1, 20); // Audio format (1 = PCM)
		header.writeUInt16LE(channels, 22);
		header.writeUInt32LE(sampleRate, 24);
		header.writeUInt32LE(byteRate, 28);
		header.writeUInt16LE(blockAlign, 32);
		header.writeUInt16LE(bitsPerSample, 34);

		// data sub-chunk
		header.write("data", 36);
		header.writeUInt32LE(dataSize, 40);

		return Buffer.concat([header, pcmBuffer]);
	}

	/**
	 * Generate a TTS voice narration of the executive summary using Gemini.
	 * Uploads audio to Cloudinary if configured, otherwise falls back to
	 * base64 data URL stored directly on the submission.
	 */
	private static async generateVoiceSummary(
		apiKey: string,
		submissionId: string,
		executiveSummary: string,
	): Promise<void> {
		if (!executiveSummary || executiveSummary.length < 10) {
			return;
		}

		console.log(`[GEMINI:TTS] Generating voice summary for ${submissionId}...`);

		const ai = new GoogleGenAI({ apiKey });

		const response = await withRetry(
			() =>
				ai.models.generateContent({
					model: GEMINI_TTS_MODEL,
					contents: `Read the following startup pitch summary aloud in a clear, professional, and engaging tone suitable for investors reviewing the pitch:\n\n"${executiveSummary}"`,
					config: {
						responseModalities: ["AUDIO"],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: {
									voiceName: "Kore",
								},
							},
						},
					},
				}),
			"GEMINI:TTS",
		);

		// Extract inline audio data from Gemini response
		const parts = response.candidates?.[0]?.content?.parts;
		if (!parts || parts.length === 0) {
			console.warn(
				`[GEMINI:TTS] No audio parts in response for ${submissionId}`,
			);
			return;
		}

		const audioPart = parts.find((p) => "inlineData" in p && p.inlineData);
		if (!audioPart || !("inlineData" in audioPart) || !audioPart.inlineData) {
			console.warn(`[GEMINI:TTS] No inline audio data for ${submissionId}`);
			return;
		}

		const { data, mimeType } = audioPart.inlineData as {
			data: string;
			mimeType: string;
		};

		// Gemini TTS typically returns raw PCM as audio/L16;rate=24000
		const isRawPcm =
			!mimeType ||
			mimeType.includes("L16") ||
			mimeType.includes("pcm") ||
			mimeType.includes("raw");

		// Parse sample rate from mimeType if present (e.g. "audio/L16;rate=24000")
		let sampleRate = 24000;
		const rateMatch = mimeType?.match(/rate=(\d+)/);
		if (rateMatch) {
			sampleRate = Number.parseInt(rateMatch[1], 10);
		}

		const rawBuffer = Buffer.from(data, "base64");

		// Convert raw PCM to WAV so browsers and Cloudinary can handle it
		const wavBuffer = isRawPcm
			? GeminiSummaryService.pcmToWav(rawBuffer, sampleRate)
			: rawBuffer;

		let voiceUrl: string;

		// Upload to Cloudinary if configured, otherwise fallback to base64 data URL
		if (isCloudinaryConfigured) {
			try {
				const uploadResult = await new Promise<{ secure_url: string }>(
					(resolve, reject) => {
						const stream = cloudinary.uploader.upload_stream(
							{
								resource_type: "video", // Cloudinary uses "video" for audio
								folder: "sepms/voice-summaries",
								public_id: `voice_${submissionId}`,
								format: "wav",
								overwrite: true,
							},
							(error, result) => {
								if (error) reject(error);
								else resolve(result as { secure_url: string });
							},
						);
						stream.end(wavBuffer);
					},
				);
				voiceUrl = uploadResult.secure_url;
				console.log(
					`[GEMINI:TTS] ✅ Voice uploaded to Cloudinary for ${submissionId}`,
				);
			} catch (uploadErr) {
				console.warn(
					`[GEMINI:TTS] Cloudinary upload failed, falling back to data URL:`,
					(uploadErr as Error).message,
				);
				// Fallback: store as base64 data URL with correct WAV mime
				voiceUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
			}
		} else {
			// Fallback: store as data URL
			voiceUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
		}

		await Submission.findByIdAndUpdate(submissionId, {
			voiceSummaryUrl: voiceUrl,
		});

		console.log(`[GEMINI:TTS] ✅ Voice summary saved for ${submissionId}`);
	}

	/**
	 * Build a text representation of the pitch for Gemini's context.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Mongoose document type
	private static buildPitchContext(submission: any): string {
		const sections: string[] = [];

		if (submission.title) sections.push(`TITLE: ${submission.title}`);
		if (submission.summary)
			sections.push(`EXECUTIVE SUMMARY: ${submission.summary}`);
		if (submission.sector) sections.push(`SECTOR: ${submission.sector}`);
		if (submission.stage) sections.push(`STAGE: ${submission.stage}`);
		if (submission.targetAmount)
			sections.push(
				`TARGET FUNDING: $${submission.targetAmount.toLocaleString()} ${submission.currency || "USD"}`,
			);
		if (submission.problem?.statement)
			sections.push(`PROBLEM STATEMENT: ${submission.problem.statement}`);
		if (submission.problem?.targetMarket)
			sections.push(`TARGET MARKET: ${submission.problem.targetMarket}`);
		if (submission.problem?.marketSize)
			sections.push(`MARKET SIZE: ${submission.problem.marketSize}`);
		if (submission.solution?.description)
			sections.push(`SOLUTION: ${submission.solution.description}`);
		if (submission.solution?.uniqueValue)
			sections.push(
				`UNIQUE VALUE PROPOSITION: ${submission.solution.uniqueValue}`,
			);
		if (submission.solution?.competitiveAdvantage)
			sections.push(
				`COMPETITIVE ADVANTAGE: ${submission.solution.competitiveAdvantage}`,
			);
		if (submission.businessModel?.revenueStreams)
			sections.push(
				`REVENUE STREAMS: ${submission.businessModel.revenueStreams}`,
			);
		if (submission.businessModel?.pricingStrategy)
			sections.push(
				`PRICING STRATEGY: ${submission.businessModel.pricingStrategy}`,
			);
		if (submission.businessModel?.customerAcquisition)
			sections.push(
				`CUSTOMER ACQUISITION: ${submission.businessModel.customerAcquisition}`,
			);
		if (submission.financials?.currentRevenue)
			sections.push(`CURRENT REVENUE: ${submission.financials.currentRevenue}`);
		if (submission.financials?.projectedRevenue)
			sections.push(
				`PROJECTED REVENUE: ${submission.financials.projectedRevenue}`,
			);
		if (submission.financials?.burnRate)
			sections.push(`BURN RATE: ${submission.financials.burnRate}`);
		if (submission.financials?.runway)
			sections.push(`RUNWAY: ${submission.financials.runway}`);

		// Truncate to avoid token limits
		return sections.join("\n").slice(0, 4000);
	}
}
