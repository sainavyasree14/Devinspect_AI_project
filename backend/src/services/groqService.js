import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const groqService = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // use latest supported model
      messages: [
        {
          role: "system",
          content: "Return only strict JSON output.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return response.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("GROQ SERVICE ERROR:", error);
    return "";
  }
};

export default groqService;