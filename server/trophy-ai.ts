import OpenAI from "openai";
import { getThreshold, findClosestSpecies, parseScoreNumeric } from "@shared/scoring-thresholds";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are TrophyVault's trophy photo analyzer. Return ONLY valid JSON. No markdown, no code fences. Use your species knowledge to assess trophy qualification accurately.`;

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
    "confidence": number (0-1)
  },
  "photo_quality": {
    "score": number (1-10),
    "issues": string[],
    "suitable_for_3d": boolean
  },
  "mount_recommendation": {
    "best": "shoulder"|"horns"|"full_body"
  },
  "horn_details": {
    "has_horns": boolean,
    "horn_type": "spiral"|"lyre"|"straight"|"curved"|"antler"|"boss"|null,
    "estimated_length_inches": number|null,
    "estimated_length_cm": number|null,
    "length_range_low": number|null (in ${unitLabel}),
    "length_range_high": number|null (in ${unitLabel}),
    "notable_features": string|null,
    "coloring": string|null
  },
  "trophy_qualification": {
    "scoring_system": "${scoringSystem}",
    "estimated_score": string|null,
    "likely_qualifies": boolean|null,
    "confidence": number (0-1),
    "notes": string|null
  }
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
  };
  photo_quality: {
    score: number;
    issues: string[];
    suitable_for_3d: boolean;
  };
  mount_recommendation: {
    best: string;
  };
  horn_details: {
    has_horns: boolean;
    horn_type: string | null;
    estimated_length_inches: number | null;
    estimated_length_cm: number | null;
    length_range_low: number | null;
    length_range_high: number | null;
    notable_features: string | null;
    coloring: string | null;
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
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  buffalo: 1.3,
  big_cat: 1.3,
  deer: 1.1,
  antelope: 1.0,
  pig: 0.9,
  bird: 0.7,
  fish: 0.7,
  other: 0.8,
};

export function calculateTrophyVaultScore(analysis: TrophyAnalysis): number {
  const categoryWeight = CATEGORY_WEIGHTS[analysis.species?.category] || 1.0;

  let thresholdRatio = 0.5;
  if (analysis.horn_details?.has_horns && analysis.species?.common_name) {
    const low = analysis.horn_details.length_range_low;
    const high = analysis.horn_details.length_range_high;
    const estimatedLength = low != null && high != null ? (low + high) / 2 : null;

    if (estimatedLength != null) {
      const threshold = findClosestSpecies(analysis.species.common_name);
      if (threshold) {
        const sci = threshold.sci;
        const rw = threshold.rowlandWard;
        const thresholdVal = parseScoreNumeric(sci || "") || parseScoreNumeric(rw || "");
        if (thresholdVal && thresholdVal > 0) {
          thresholdRatio = Math.min(estimatedLength / thresholdVal, 1.5);
        }
      }
    }
  }

  const photoQuality = (analysis.photo_quality?.score || 5) / 10;
  const qualifiesBonus = analysis.trophy_qualification?.likely_qualifies ? 1.5 : 0;

  const rawScore = (thresholdRatio * 4 + photoQuality * 2 + qualifiesBonus + categoryWeight) * 1.1;
  return Math.max(1, Math.min(10, Math.round(rawScore * 10) / 10));
}

export function buildRenderPrompt(analysis: TrophyAnalysis, theme: string): string {
  const species = analysis.species?.common_name || "trophy animal";
  const gender = analysis.gender?.estimated || "unknown";
  const hornType = analysis.horn_details?.horn_type || "";
  const hornLength = analysis.horn_details?.estimated_length_inches
    ? `approximately ${analysis.horn_details.estimated_length_inches} inches`
    : "";
  const features = analysis.horn_details?.notable_features || "";
  const coloring = analysis.horn_details?.coloring || "";

  const themeBackgrounds: Record<string, string> = {
    lodge: "mounted on a dark rustic wooden plaque, warm cabin lighting, dark wood-paneled wall background",
    manor: "mounted on a rich mahogany plaque, warm golden ambient lighting, dark safari-themed wall background with warm earth tones",
    minimal: "mounted on a clean light oak plaque, bright studio lighting, clean white wall background",
  };

  const bg = themeBackgrounds[theme] || themeBackgrounds.lodge;

  const parts = [
    `Photorealistic 3D taxidermy shoulder mount render of a ${gender} ${species}`,
    hornType ? `with ${hornType} horns` : "",
    hornLength ? `(${hornLength})` : "",
    coloring ? `, ${coloring} coloring` : "",
    features ? `, ${features}` : "",
    `, ${bg}`,
    ", studio lighting, isolated on transparent background",
  ];

  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
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
              detail: "auto",
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

  parsed.trophy_vault_score = calculateTrophyVaultScore(parsed);

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
