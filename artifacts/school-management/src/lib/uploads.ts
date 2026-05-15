export type UploadFolder = "profiles" | "records";

export type UploadResult = {
  url: string;
  fileName: string;
  contentType: string;
  size: number;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file: File, folder: UploadFolder): Promise<UploadResult> {
  const data = await readFileAsDataUrl(file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      data,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Upload failed with status ${response.status}`);
  }

  return response.json();
}
