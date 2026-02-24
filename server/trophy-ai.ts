import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are TrophyVault's image analysis assistant. Analyze hunting trophy photos and return structured JSON.

Your task:
1. Identify if there is a recognizable game animal
2. Identify the species (common + scientific name)
3. Assess photo quality for 3D model generation
4. Locate the animal in the image (bounding box)
5. Recommend the best mount type based on visibility
6. Extract any visible horn/antler characteristics
7. Note any issues (occlusion, lighting, blur)

Return ONLY valid JSON matching the schema below. No markdown, no code fences, just raw JSON.`;

const USER_PROMPT = `Analyze this hunting trophy photo.

Focus on the MOST PROMINENT game animal in the image.
Ignore any people, weapons, vehicles, or dogs.

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
    "estimated_length_description": string | null,
    "notable_features": string | null
  },
  "additional_animals": number,
  "exif_hints": {
    "location_visible": string | null,
    "time_of_day": "morning"|"midday"|"afternoon"|"evening"|"night"|null
  }
}`;

export interface TrophyAnalysis {
  animal_detected: boolean;
  rejection_reason: string | null;
  species: {
    common_name: string;
    scientific_name: string;
    category: string;
    confidence: number;
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
    estimated_length_description: string | null;
    notable_features: string | null;
  };
  additional_animals: number;
  exif_hints: {
    location_visible: string | null;
    time_of_day: string | null;
  };
}

export async function analyzeTrophyImage(base64Image: string, mimeType: string): Promise<TrophyAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: USER_PROMPT },
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
  return JSON.parse(cleaned);
}
