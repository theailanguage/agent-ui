import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { Message, Role } from '../types';

// Initialize the client
// NOTE: We assume process.env.API_KEY is available as per instructions.
// However, for image generation with specific models, we might need to re-init.
let ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' },
];

export const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Fast)', isPaid: false },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro (High Quality)', isPaid: true },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;
// Default to Flash for free/fast usage
export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].id;

/**
 * Converts internal Message format to the SDK's Content format.
 */
const formatHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => {
    const parts: any[] = [];
    
    // Add text part
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Add attachment parts
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });
    }

    if (msg.role === Role.MODEL && msg.thought) {
       // Logic to handle thoughts in history if needed
    }

    return {
      role: msg.role,
      parts: parts,
    };
  });
};

export const streamChatResponse = async (
  history: Message[],
  newMessageText: string,
  attachments: { mimeType: string; data: string }[],
  modelName: string,
  onChunk: (text: string) => void
) => {
  // Always ensure AI client uses the latest key if environment changed or for safety
  const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const previousHistory = formatHistory(history);

  const currentMessageParts: any[] = [];
  
  if (attachments.length > 0) {
    attachments.forEach(att => {
      currentMessageParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }
  
  if (newMessageText) {
    currentMessageParts.push({ text: newMessageText });
  }

  const contents = [
    ...previousHistory,
    {
      role: Role.USER,
      parts: currentMessageParts
    }
  ];

  try {
    const responseStream = await currentAi.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, 
      },
    });

    for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            onChunk(c.text);
        }
    }
  } catch (error) {
    console.error("Error streaming response:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, modelId: string = DEFAULT_IMAGE_MODEL): Promise<string | null> => {
  const selectedModelInfo = IMAGE_MODELS.find(m => m.id === modelId) || IMAGE_MODELS[0];

  // Check for API Key selection requirement ONLY for Veo/High-Quality Images (Paid models)
  if (selectedModelInfo.isPaid && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        console.error("Error selecting key:", e);
        throw new Error("API Key selection failed or was cancelled.");
      }
    }
  }

  // Create a new instance right before call to ensure we have the selected key
  const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Config construction
  // gemini-3-pro-image-preview supports imageSize.
  // gemini-2.5-flash-image does NOT support imageSize, but supports aspectRatio.
  const config: any = {
    imageConfig: {
      aspectRatio: "1:1",
    }
  };

  if (modelId === 'gemini-3-pro-image-preview') {
    config.imageConfig.imageSize = "1K";
  }

  try {
    const response = await imageAi.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: prompt }],
      },
      config: config,
    });

    // Iterate parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};