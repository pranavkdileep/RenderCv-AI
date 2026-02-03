"use server";

const RENDERCV_BACKEND_URL = process.env.RENDERCV_BACKEND_URL || "http://localhost:5000";

export interface RenderPdfResult {
  pdfBase64?: string;
  error?: string;
}

export async function renderPdfFromYaml(yamlCode: string): Promise<RenderPdfResult> {
  try {
    const endpoint = `${RENDERCV_BACKEND_URL}/rendercv`;

    const formData = new FormData();
    const yamlBlob = new Blob([yamlCode], { type: "text/yaml" });
    formData.append("file", yamlBlob, "cv.yaml");

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let message = `Backend error: ${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && typeof (data as any).error === "string") {
          message = (data as any).error;
        }
      } catch {
        // ignore JSON parse errors
      }
      return { error: message };
    }

    const arrayBuffer = await res.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const pdfBase64 = bytes.toString("base64");

    return { pdfBase64 };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while contacting backend";
    return { error: message };
  }
}
