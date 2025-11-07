/**
 * Azure AI Foundry API integrations
 * Handles Speech Recognition, Translation, and OpenAI services
 */

import axios from "axios";

// Environment variables for Azure services
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || "";
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "";
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY || "";
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || "";
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION || "";
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY || "";
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "";
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "";

/**
 * Get Azure Speech Service token for client-side SDK
 */
export async function getSpeechToken(): Promise<{ token: string; region: string }> {
  // Validate environment variables
  if (!AZURE_SPEECH_KEY) {
    console.error("AZURE_SPEECH_KEY is not set");
    throw new Error("Azure Speech Service is not configured");
  }
  if (!AZURE_SPEECH_REGION) {
    console.error("AZURE_SPEECH_REGION is not set");
    throw new Error("Azure Speech Service region is not configured");
  }

  try {
    const tokenEndpoint = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    console.log("Requesting speech token from:", tokenEndpoint);
    
    const response = await axios.post(
      tokenEndpoint,
      null,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return {
      token: response.data,
      region: AZURE_SPEECH_REGION,
    };
  } catch (error: any) {
    console.error("Failed to get speech token:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    if (error.response?.status === 401) {
      throw new Error("Invalid Azure Speech Service API key");
    } else if (error.response?.status === 403) {
      throw new Error("Azure Speech Service access denied");
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`Invalid Azure region: ${AZURE_SPEECH_REGION}`);
    }
    
    throw new Error("Failed to get speech token");
  }
}

/**
 * Translate text using Azure Translator
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
  scenario?: string
): Promise<{ translatedText: string; confidence?: number }> {
  try {
    const response = await axios.post(
      `${AZURE_TRANSLATOR_ENDPOINT}/translate`,
      [{ text }],
      {
        params: {
          "api-version": "3.0",
          from,
          to,
          ...(scenario && { category: scenario }), // Use scenario as category for domain-specific translation
        },
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
          "Content-Type": "application/json",
        },
      }
    );

    const translation = response.data[0]?.translations[0];
    return {
      translatedText: translation?.text || "",
      confidence: translation?.confidence,
    };
  } catch (error) {
    console.error("Translation failed:", error);
    throw new Error("Translation failed");
  }
}

/**
 * Generate summary using built-in LLM
 */
export async function generateSummary(transcripts: string[]): Promise<string> {
  try {
    const fullText = transcripts.join("\n");
    console.log(`Generating summary for ${transcripts.length} transcripts`);
    
    // Use the built-in invokeLLM helper from the template
    const { invokeLLM } = await import("./_core/llm");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一個專業的會議摘要助手。請根據提供的逐字稿內容,生成一份簡潔且結構化的摘要,包含主要討論點、重要決策和行動項目。使用繁體中文回應。",
        },
        {
          role: "user",
          content: `請為以下內容生成摘要:\n\n${fullText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const summary = typeof content === 'string' ? content : "";
    console.log("Summary generated successfully using built-in LLM");
    return summary;
  } catch (error: any) {
    console.error("Summary generation failed:", {
      message: error.message,
      stack: error.stack,
    });
    
    throw new Error("Summary generation failed");
  }
}

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES = [
  { code: "zh-Hant", name: "繁體中文" },
  { code: "zh-Hans", name: "简体中文" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
];

/**
 * Supported scenarios for domain-specific translation
 */
export const SUPPORTED_SCENARIOS = [
  { code: "general", name: "一般對話" },
  { code: "medical", name: "醫療" },
  { code: "legal", name: "法律" },
  { code: "business", name: "商務" },
  { code: "education", name: "教育" },
  { code: "technology", name: "科技" },
  { code: "finance", name: "金融" },
];
