import OpenAI from "openai";

const llmConfig = {
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  model: String(process.env.LLM_MODEL),
  temperature: 0.7,
  maxTokens: 4000,
};

const client = new OpenAI({
  baseURL: llmConfig.baseURL,
  apiKey: llmConfig.apiKey,
});

export { llmConfig, client };
