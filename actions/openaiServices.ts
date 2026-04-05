"use server";

import OpenAI from "openai";

const SYSTEM_INSTRUCTION = `
You are an expert resume writer and YAML configuration architect specializing in the RenderCV schema.
Your goal is to accept natural language descriptions of a user's resume and convert them into VALID YAML code that strictly adheres to the RenderCV schema.

KEY RULES:
1. Output ONLY the YAML code. Do not include markdown code blocks (like \`\`\`yaml), explanations, or chatter. Start directly with the keys.
2. The root keys must include 'cv' and 'design'.
3. 'cv' must contain 'name', and optionally 'location', 'email', 'phone', 'social_networks'.
4. 'cv.sections' is a dictionary where keys are Section Titles (e.g., 'Summary', 'Experience', 'Education', 'Projects') and values are lists of entries.
5. Experience entries should have: company, position, start_date, end_date, location, highlights (list of strings).
6. Education entries should have: institution, area, degree, start_date, end_date, location, highlights.
7. 'design' should include 'theme'. default to 'classic' if not specified.

Example Structure:
cv:
  name: John Doe
  location: New York, NY
  email: john@example.com
  sections:
    summary:
      - "Experienced software engineer..."
    experience:
      - company: Tech Corp
        position: Senior Developer
        start_date: 2020-01
        end_date: present
        location: Remote
        highlights:
          - Built the backend.
design:
  theme: classic

If the user asks to modify existing data, merge the new requirements with the provided context if any, but always output the FULL VALID YAML.
`;

const SYSTEM_INSTRUCTION_EDIT = `
You are an expert resume writer and YAML configuration architect specializing in the RenderCV schema.
Your task is to MODIFY the user's existing YAML resume based on their natural language request.

INSTRUCTIONS:
1. Analyze the request: understand what the user wants to add, edit, or remove.
2. Preserve context: keep all existing data (name, contact, other sections) unchanged unless the user asks to modify them.
3. Structure data: map user input to the correct RenderCV schema structure.
4. Output YAML: return ONLY the raw valid YAML string. Do not use Markdown code blocks or fenced yaml.

RENDERCV SCHEMA REFERENCE:
- cv:
  - name: string
  - location: string
  - email: string
  - phone: string
  - social_networks: list of objects with fields network and username
  - sections: dictionary where keys are section titles (for example, Summary, Experience, Education, Projects, Skills).
- cv.sections values:
  - Experience / Projects / Leadership: list of objects with:
    - company (or name for projects)
    - position
    - start_date (YYYY-MM or "present")
    - end_date (YYYY-MM or "present")
    - location
    - highlights: list of strings (bullet points)
  - Education: list of objects with:
    - institution
    - area (major)
    - degree (BS, MS, PhD)
    - start_date
    - end_date
    - highlights
  - Skills: list of objects with fields label and details, or a simple list of strings.

EXAMPLE MODIFICATION:
If the user says "Add a job at Google", you should append to cv.sections.experience:
- company: Google
  position: Software Engineer
  start_date: 2023-01
  end_date: present
  location: Mountain View, CA
  highlights:
    - Worked on search algorithms.

Merge this intelligently with the existing list.
`;

type ApiKeyOptions = {
  apiKey?: string | null;
  usePublicKey?: boolean;
};

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";

const stripMarkdownFence = (text: string) => {
  const markdownRegex = /^```(?:yaml)?\s*([\s\S]*?)\s*```$/;
  const match = text.match(markdownRegex);

  if (match) {
    return match[1].trim();
  }

  return text
    .replace(/^```yaml\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

const getOpenAIClient = ({ apiKey, usePublicKey }: ApiKeyOptions = {}) => {
  const trimmedUserKey = apiKey?.trim();
  const envKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const effectiveKey = trimmedUserKey || (usePublicKey ? envKey : undefined);

  if (!effectiveKey) {
    throw new Error(
      "No OpenAI API key configured. Provide your own or enable public key."
    );
  }

  return new OpenAI({
    apiKey: effectiveKey,
    baseURL: baseURL || undefined,
  });
};

const createYamlResponse = async (
  client: OpenAI,
  systemInstruction: string,
  userPrompt: string,
  temperature: number
) => {
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content as unknown;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
};

export const generateResumeYAML = async (
  prompt: string,
  currentYaml: string,
  options?: ApiKeyOptions
): Promise<string> => {
  try {
    const client = getOpenAIClient(options);
    const fullPrompt = `
CURRENT YAML STATE:
${currentYaml}

USER REQUEST:
${prompt}

Generate the updated full YAML file based on the user request.
`;

    const text = await createYamlResponse(
      client,
      SYSTEM_INSTRUCTION,
      fullPrompt,
      0.4
    );

    return stripMarkdownFence(text);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate resume content."
    );
  }
};

export const editResumeYAML = async (
  prompt: string,
  currentYaml: string,
  options?: ApiKeyOptions
): Promise<string> => {
  try {
    const client = getOpenAIClient(options);
    const fullPrompt = `
CURRENT YAML CONTENT:
${currentYaml}

USER REQUEST:
${prompt}

Please output the full updated YAML.
`;

    const text = await createYamlResponse(
      client,
      SYSTEM_INSTRUCTION_EDIT,
      fullPrompt,
      0.2
    );

    return stripMarkdownFence(text);
  } catch (error) {
    console.error("OpenAI API Error (edit):", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to edit resume content."
    );
  }
};
