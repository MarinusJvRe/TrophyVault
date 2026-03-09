import OpenAI from "openai";
import { getThreshold, findClosestSpecies } from "@shared/scoring-thresholds";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are TrophyVault's trophy photo analyzer. Return ONLY valid JSON. No markdown, no code fences.`;

function buildUserPrompt(units: string, scoringSystem: string): string {
  const unitLabel = units === "metric" ? "cm" : "inches";

  return `Analyze this hunting trophy photo. Focus on the most prominent game animal. Measurements in ${unitLabel}. Evaluate against ${scoringSystem}.

JSON schema:
{
  "animal_detected": boolean,
  "species": {
    "common_name": string,
    "scientific_name": string,
    "category": "antelope"|"deer"|"buffalo"|"big_cat"|"pig"|"bird"|"fish"|"other",
    "confidence": number (0-1)
  },
  "gender": {
    "estimated": "male"|"female"|"unknown",
    "confidence": number (0-1),
    "indicators": string
  },
  "photo_quality": {
    "score": number (1-10),
    "issues": string[],
    "suitable_for_3d": boolean
  },
  "mount_recommendation": {
    "best": "shoulder"|"horns"|"full_body",
    "reason": string
  },
  "horn_details": {
    "has_horns": boolean,
    "horn_type": "spiral"|"lyre"|"straight"|"curved"|"antler"|"boss"|null,
    "estimated_length_inches": number|null,
    "estimated_length_cm": number|null,
    "length_range_low": number|null (in ${unitLabel}),
    "length_range_high": number|null (in ${unitLabel}),
    "notable_features": string|null
  },
  "trophy_qualification": {
    "scoring_system": "${scoringSystem}",
    "minimum_qualifying_score": string|null,
    "estimated_score": string|null,
    "likely_qualifies": boolean|null,
    "confidence": number (0-1),
    "notes": string|null
  },
  "trophy_vault_score": number (1-10, overall impressiveness),
  "render_prompt": string (DALL-E prompt for photorealistic 3D taxidermy shoulder mount render of this animal, include species details, horn/antler description, coloring, dark wooden plaque, studio lighting, isolated on transparent background)
}`;
}

export interface TrophyAnalysis {
  animal_detected: boolean;
  species: {
    common_name: string;
    scientific_name: string;
    category: string;
    confidence: number;
  };
  gender: {
    estimated: "male" | "female" | "unknown";
    confidence: number;
    indicators: string;
  };
  photo_quality: {
    score: number;
    issues: string[];
    suitable_for_3d: boolean;
  };
  mount_recommendation: {
    best: string;
    reason: string;
  };
  horn_details: {
    has_horns: boolean;
    horn_type: string | null;
    estimated_length_inches: number | null;
    estimated_length_cm: number | null;
    length_range_low: number | null;
    length_range_high: number | null;
    notable_features: string | null;
  };
  trophy_qualification: {
    scoring_system: string;
    minimum_qualifying_score: string | null;
    estimated_score: string | null;
    likely_qualifies: boolean | null;
    confidence: number;
    notes: string | null;
  };
  trophy_vault_score: number;
  render_prompt: string;
}

export async function analyzeTrophyImage(
  base64Image: string,
  mimeType: string,
  units: string = "imperial",
  scoringSystem: string = "SCI"
): Promise<TrophyAnalysis> {
  const userPrompt = buildUserPrompt(units, scoringSystem);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 1500,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content || "";
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (parsed.horn_details) {
    const hd = parsed.horn_details;
    const lowKey = Object.keys(hd).find(k => k.startsWith("length_range_low"));
    const highKey = Object.keys(hd).find(k => k.startsWith("length_range_high"));
    if (lowKey && lowKey !== "length_range_low") {
      hd.length_range_low = hd[lowKey];
      delete hd[lowKey];
    }
    if (highKey && highKey !== "length_range_high") {
      hd.length_range_high = hd[highKey];
      delete hd[highKey];
    }
  }

  if (parsed.species?.common_name && parsed.trophy_qualification) {
    const officialThreshold = getThreshold(parsed.species.common_name, scoringSystem);
    if (officialThreshold && officialThreshold !== "n/a") {
      parsed.trophy_qualification.minimum_qualifying_score = officialThreshold;
    }
  }

  return parsed;
}

export async function generateTrophyRender(renderPrompt: string): Promise<Buffer | null> {
  try {
    const { generateImageBuffer } = await import("./replit_integrations/image/client");
    const buffer = await generateImageBuffer(renderPrompt, "1024x1024");
    if (!buffer || buffer.length === 0) {
      console.error("Render generation returned empty image data");
      return null;
    }
    return buffer;
  } catch (error) {
    console.error("Render generation failed:", error);
    return null;
  }
}
