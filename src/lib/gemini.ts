
export async function gradeAnswer(answer: string) {
  const response = await fetch("/api/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  });

  const contentType = response.headers.get("content-type");
  if (!response.ok) {
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to call Gemini API");
    } else {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
    }
  }

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server did not return JSON");
  }

  return response.json() as Promise<{ score: number; feedback: string }>;
}
