
export async function gradeAnswer(answer: string) {
  const response = await fetch("/api/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answer }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to call Gemini API");
  }

  return response.json() as Promise<{ score: number; feedback: string }>;
}
