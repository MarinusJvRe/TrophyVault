import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are TrophyVault's image analysis assistant. Analyze hunting trophy photos and return structured JSON.

Your task:
1. Identify if there is a recognizable game animal
2. Identify the species (common + scientific name)
3. Determine the gender of the animal (male/female/unknown)
4. Assess photo quality for 3D model generation
5. Recommend the best mount type based on visibility
6. Extract any visible horn/antler characteristics with numeric length estimates
7. Estimate whether the trophy would qualify under a given scoring system
8. Assign a TrophyVault Score (1-10) rating the overall impressiveness of the trophy
9. Generate a DALL-E prompt for creating a 3D taxidermy-style render of this specific animal
10. Note any issues (occlusion, lighting, blur)

Return ONLY valid JSON matching the schema below. No markdown, no code fences, just raw JSON.`;

function buildUserPrompt(units: string, scoringSystem: string): string {
  const unitLabel = units === "metric" ? "centimeters (cm)" : "inches (in)";
  const unitAbbr = units === "metric" ? "cm" : "in";

  return `Analyze this hunting trophy photo.

Focus on the MOST PROMINENT game animal in the image.
Ignore any people, weapons, vehicles, or dogs.

IMPORTANT CONTEXT:
- Report all measurements in ${unitLabel}
- Evaluate trophy qualification against the ${scoringSystem} scoring system
- Identify the gender of the animal

Respond with JSON matching this exact schema:
{
  "animal_detected": boolean,
  "rejection_reason": string | null,
  "species": {
    "common_name": string,
    "scientific_name": string,
    "category": "antelope"|"deer"|"buffalo"|"big_cat"|"pig"|"bird"|"fish"|"other",
    "confidence": number (0-1)
  },
  "gender": {
    "estimated": "male"|"female"|"unknown",
    "confidence": number (0-1),
    "indicators": string (brief explanation of how gender was determined, e.g. "prominent horns indicate male")
  },
  "photo_quality": {
    "score": number (1-10),
    "issues": string[],
    "suitable_for_3d": boolean,
    "suggestion": string | null
  },
  "animal_pose": "standing"|"lying"|"mounted"|"held_up"|"partial",
  "visibility": {
    "head_visible": boolean,
    "horns_visible": boolean,
    "body_visible": boolean,
    "occlusion_percent": number (0-100),
    "occluded_by": string | null
  },
  "mount_recommendation": {
    "best": "shoulder"|"horns"|"full_body",
    "viable": ["shoulder","horns","full_body"],
    "reason": string
  },
  "horn_details": {
    "has_horns": boolean,
    "horn_type": "spiral"|"lyre"|"straight"|"curved"|"antler"|"boss"|null,
    "estimated_length_inches": number | null (estimated horn/antler length in inches, your best numeric estimate even if approximate),
    "estimated_length_cm": number | null (estimated horn/antler length in centimeters),
    "length_range_low_${unitAbbr}": number | null (lower bound of estimated length in ${unitLabel}),
    "length_range_high_${unitAbbr}": number | null (upper bound of estimated length in ${unitLabel}),
    "notable_features": string | null
  },
  "trophy_qualification": {
    "scoring_system": "${scoringSystem}",
    "minimum_qualifying_score": string | null (the minimum score for this species under ${scoringSystem}, e.g. "52 inches" or "132 cm"),
    "estimated_score": string | null (your estimated score based on visible horn/antler measurements, in ${unitLabel}),
    "likely_qualifies": boolean | null (whether the trophy likely meets the minimum qualifying score),
    "confidence": number (0-1, how confident you are in this qualification assessment),
    "notes": string | null (any caveats or additional context about the qualification estimate)
  },
  "trophy_vault_score": number (1-10, overall impressiveness rating considering horn/antler size relative to species, symmetry, uniqueness, and trophy quality. 10 = exceptional world-class trophy, 5 = average representative, 1 = poor/damaged),
  "render_prompt": string (a detailed DALL-E prompt to generate a photorealistic 3D taxidermy shoulder mount render of this specific animal species. Include species name, horn/antler details, coloring, and specify: "photorealistic 3D render, taxidermy shoulder mount, dark wooden plaque background, museum quality, dramatic studio lighting, no background, isolated on transparent background"),
  "additional_animals": number,
  "exif_hints": {
    "location_visible": string | null,
    "time_of_day": "morning"|"midday"|"afternoon"|"evening"|"night"|null
  }
}`;
}

export interface TrophyAnalysis {
  animal_detected: boolean;
  rejection_reason: string | null;
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
    suggestion: string | null;
  };
  animal_pose: string;
  visibility: {
    head_visible: boolean;
    horns_visible: boolean;
    body_visible: boolean;
    occlusion_percent: number;
    occluded_by: string | null;
  };
  mount_recommendation: {
    best: string;
    viable: string[];
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
  additional_animals: number;
  exif_hints: {
    location_visible: string | null;
    time_of_day: string | null;
  };
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
    max_tokens: 2500,
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
