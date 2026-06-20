const AI_BASE_URL = "http://localhost:8000/api/v1";

export const aiService = {
    async recommendTaskComplexity(title: string, description: string): Promise<number> {
        const response = await fetch(`${AI_BASE_URL}/task/complexity-recommend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, description: description || "" }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch AI complexity recommendation");
        }

        const data = await response.json();
        return data.recommended_complexity;
    }
};
