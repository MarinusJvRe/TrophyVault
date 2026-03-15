import OpenAI from "openai";
import { getThreshold, parseScoreNumeric } from "@shared/scoring-thresholds";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are TrophyVault's trophy photo analyzer. Return ONLY valid JSON. No markdown, no code fences. Use your species knowledge to assess trophy qualification accurately.`;

function buildUserPrompt(units: string, scoringSystem: string): string {
  const unitLabel = units === "metric" ? "cm" : "inches";

  return `Analyze this hunting trophy photo. Focus on the most prominent game animal. Measurements in ${unitLabel}. Evaluate against ${scoringSystem}.

IMPORTANT bounding_box rules:
- All coordinate boxes use normalized values (0-1) with x_min, y_min, x_max, y_max format.
- x_min/y_min is the top-left corner, x_max/y_max is the bottom-right corner.
- The bounding_box must tightly surround ONLY the trophy animal (or its head/horns/antlers).
- ALWAYS include the full top of the horns/antlers within the bounding_box — do not crop them off.
- NEVER include people, hunters, weapons, rifles, or any non-animal objects in the bounding_box.
- If the animal is partially obscured by a person, crop tightly to the visible animal parts only.

shoulder_crop rules:
- If the recommended mount is "shoulder", provide a tighter crop box around the animal's head, neck, and shoulder area using the same x_min/y_min/x_max/y_max format. Otherwise set to null.
- The shoulder_crop MUST include the full top of the horns/antlers — never clip them.
- The shoulder_crop MUST NOT include hunters, people, or non-animal objects.

animal_description rules:
- Describe this SPECIFIC animal in rich detail to enable accurate artistic reproduction.
- coat_color: exact color and pattern (e.g. "dark chocolate brown with lighter tan underbelly and black facial stripe")
- horn_description: shape, curve, length, texture, color of this animal's horns/antlers (null if none)
- distinctive_features: unique markings, scars, mane, beard, ear shape, body build
- face_details: eye color/shape, nose, mouth, facial hair, expression

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
  "bounding_box": {
    "x_min": number (0-1, normalized left edge),
    "y_min": number (0-1, normalized top edge),
    "x_max": number (0-1, normalized right edge),
    "y_max": number (0-1, normalized bottom edge)
  },
  "shoulder_crop": {
    "x_min": number (0-1),
    "y_min": number (0-1),
    "x_max": number (0-1),
    "y_max": number (0-1)
  } | null,
  "visibility": {
    "overall": "full"|"partial"|"obscured",
    "head_visible": boolean,
    "horns_visible": boolean,
    "body_visible": boolean,
    "occlusion_percent": number (0-100),
    "occluded_by": string|null
  },
  "animal_description": {
    "coat_color": string,
    "horn_description": string|null,
    "distinctive_features": string,
    "face_details": string
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

export interface CropBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface AnimalDescription {
  coat_color: string;
  horn_description: string | null;
  distinctive_features: string;
  face_details: string;
}

export interface VisibilityInfo {
  overall: "full" | "partial" | "obscured";
  head_visible: boolean;
  horns_visible: boolean;
  body_visible: boolean;
  occlusion_percent: number;
  occluded_by: string | null;
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
  bounding_box: CropBox;
  shoulder_crop: CropBox | null;
  visibility: VisibilityInfo;
  animal_description: AnimalDescription;
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
    const estimatedInches = analysis.horn_details.estimated_length_inches
      ?? (analysis.horn_details.estimated_length_cm != null
        ? analysis.horn_details.estimated_length_cm / 2.54
        : null);

    if (estimatedInches != null) {
      const scoringSystem = analysis.trophy_qualification?.scoring_system || "SCI";
      const systemThreshold = getThreshold(analysis.species.common_name, scoringSystem);
      const thresholdVal = systemThreshold ? parseScoreNumeric(systemThreshold) : null;
      if (thresholdVal && thresholdVal > 0) {
        thresholdRatio = Math.min(estimatedInches / thresholdVal, 1.5);
      }
    }
  }

  const photoQuality = (analysis.photo_quality?.score || 5) / 10;
  const qualifiesBonus = analysis.trophy_qualification?.likely_qualifies ? 1.5 : 0;

  const rawScore = (thresholdRatio * 4 + photoQuality * 2 + qualifiesBonus + categoryWeight) * 1.1;
  return Math.max(1, Math.min(10, Math.round(rawScore * 10) / 10));
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
    max_tokens: 2000,
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

  if (typeof parsed.visibility === "string") {
    parsed.visibility = {
      overall: parsed.visibility,
      head_visible: true,
      horns_visible: parsed.horn_details?.has_horns ?? false,
      body_visible: parsed.visibility === "full",
      occlusion_percent: parsed.visibility === "full" ? 0 : parsed.visibility === "partial" ? 30 : 60,
      occluded_by: null,
    };
  }

  if (!parsed.animal_description) {
    parsed.animal_description = {
      coat_color: parsed.horn_details?.coloring || "unknown",
      horn_description: parsed.horn_details?.notable_features || null,
      distinctive_features: "",
      face_details: "",
    };
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
