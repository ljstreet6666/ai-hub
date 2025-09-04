const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log("Loaded key?", process.env.OPENAI_API_KEY ? "Yes" : "No");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello from CommonJS test!" }],
  });

  console.log("Response:", completion.choices[0].message.content);
}

main().catch(console.error);
