"use server";

const RENDERCV_BACKEND_URL = process.env.RENDERCV_BACKEND_URL || "http://localhost:5000";

export interface RenderSvgResult {
  svgs: string[];
  error?: string;
}

export async function renderSvgFromYaml(yamlCode: string): Promise<RenderSvgResult> {
  try {
    const endpoint = `${RENDERCV_BACKEND_URL}/rendersvg`;

    const formData = new FormData();
    const blob = new Blob([yamlCode], { type: "text/yaml" });
    // The Flask backend expects a file field named "file"
    formData.append("file", blob, "cv.yaml");

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let message = `Backend error: ${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && typeof data.error === "string") {
          message = data.error;
        }
      } catch {
        // ignore JSON parse errors and use default message
      }
      return { svgs: [], error: message };
    }

    const data = (await res.json()) as {
      svgs?: { filename: string; content: string }[];
    };

    const svgs = (data.svgs || []).map((item) => item.content || "").filter(Boolean);

    if (!svgs.length) {
      return { svgs: [], error: "Backend returned no SVG content" };
    }

    return { svgs };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while contacting backend";
    return { svgs: [], error: message };
  }
}
