import { generateAssistantReply as generateLocalAssistantReply } from "@/features/ai/ai.server";
import type {
  AIConversationMessage,
  AIResponseMode,
} from "@/features/ai/ai.types";
import { APP_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type AssistantUser = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
} | null;

type AssistantRequest = {
  history: AIConversationMessage[];
  message: string;
  user: AssistantUser;
};

type AssistantFood = {
  category: string;
  description: string | null;
  name: string;
  price: number;
  restaurantName: string | null;
};

type AssistantOrder = {
  address: string;
  courierName: string | null;
  id: string;
  items: Array<{
    foodName: string;
    quantity: number;
  }>;
  status: string;
  totalPrice: number;
  trackingStatus: string | null;
};

type AssistantContext = {
  foods: AssistantFood[];
  orders: AssistantOrder[];
  user: AssistantUser;
};

type SmartProvider = Exclude<AIResponseMode, "local">;

type AssistantReplyResult = {
  mode: AIResponseMode;
  model: string | null;
  reply: string;
};

type OpenAIResponsePayload = {
  error?: {
    message?: string;
  };
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  output_text?: string;
};

type GeminiResponsePayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
  };
  promptFeedback?: {
    blockReason?: string;
  };
};

type SmartReply = {
  model: string;
  reply: string;
};

async function loadAssistantContext(user: AssistantUser): Promise<AssistantContext> {
  const [foods, orders] = await Promise.all([
    prisma.food.findMany({
      where: {
        isAvailable: true,
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          price: "asc",
        },
      ],
      take: 40,
    }),
    user
      ? prisma.order.findMany({
          where: {
            userId: user.id,
          },
          include: {
            courier: {
              select: {
                name: true,
              },
            },
            items: {
              include: {
                food: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            tracking: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return {
    foods: foods.map((food) => ({
      category: food.category,
      description: food.description,
      name: food.name,
      price: food.price,
      restaurantName: food.restaurant?.name ?? null,
    })),
    orders: orders.map((order) => ({
      address: order.address,
      courierName: order.courier?.name ?? null,
      id: order.id,
      items: order.items.map((item) => ({
        foodName: item.food?.name ?? item.foodName,
        quantity: item.quantity,
      })),
      status: order.status,
      totalPrice: order.totalPrice,
      trackingStatus: order.tracking?.status ?? null,
    })),
    user,
  };
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5.2-chat-latest";
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function getPreferredAIProvider() {
  const value = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (
    value === "gemini" ||
    value === "openai" ||
    value === "local" ||
    value === "auto"
  ) {
    return value;
  }

  return "auto";
}

function getSmartProviderOrder(): SmartProvider[] {
  const providers: SmartProvider[] = [];
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const preferredProvider = getPreferredAIProvider();

  if (preferredProvider === "local") {
    return providers;
  }

  if (preferredProvider === "openai") {
    if (hasOpenAI) {
      providers.push("openai");
    }

    if (hasGemini) {
      providers.push("gemini");
    }

    return providers;
  }

  if (preferredProvider === "gemini") {
    if (hasGemini) {
      providers.push("gemini");
    }

    if (hasOpenAI) {
      providers.push("openai");
    }

    return providers;
  }

  if (hasGemini) {
    providers.push("gemini");
  }

  if (hasOpenAI) {
    providers.push("openai");
  }

  return providers;
}

function formatFoodsForPrompt(foods: AssistantFood[]) {
  if (!foods.length) {
    return "No foods are currently available in context.";
  }

  return foods
    .slice(0, 28)
    .map((food) => {
      const restaurant = food.restaurantName
        ? ` | restaurant: ${food.restaurantName}`
        : "";

      return `- ${food.name} | category: ${food.category} | price: ${food.price} MNT${restaurant} | description: ${food.description ?? "No description"}`;
    })
    .join("\n");
}

function formatOrdersForPrompt(orders: AssistantOrder[]) {
  if (!orders.length) {
    return "No orders found for this user.";
  }

  return orders
    .slice(0, 4)
    .map((order) => {
      const items = order.items
        .map((item) => `${item.foodName} x${item.quantity}`)
        .join(", ");

      return `- #${order.id} | status: ${order.status} | tracking: ${order.trackingStatus ?? "NONE"} | total: ${order.totalPrice} MNT | courier: ${order.courierName ?? "Unassigned"} | address: ${order.address} | items: ${items}`;
    })
    .join("\n");
}

function buildDeveloperPrompt(context: AssistantContext) {
  const categories = [...new Set(context.foods.map((food) => food.category))]
    .sort((left, right) => left.localeCompare(right))
    .join(", ");

  return [
    `You are ${APP_NAME} AI, a smart in-app food delivery assistant.`,
    "Default to Mongolian unless the user clearly prefers another language.",
    "Your tone should feel natural, sharp, helpful, and proactive, more like ChatGPT than a scripted support bot.",
    "Ground every answer in the app context below. Never invent menu items, discounts, payment methods, couriers, order states, or policies that are not present in context.",
    "When recommending food, infer taste, spice, budget, portion size, and group-size preferences from the conversation. Explain the reasoning clearly and suggest one or two alternatives when useful.",
    "When answering order questions, use the exact order id, status, tracking state, total, and items from context.",
    "If context is missing, say that honestly and give the closest useful next step inside the app.",
    "Keep replies compact but insightful. Prefer short paragraphs. Use lists only when they genuinely improve clarity.",
    "Useful routes inside the app: /public/explore, /protected/cart, /protected/order, /protected/orders, /protected/tracking, /protected/order/track/{orderId}.",
    `Authenticated user: ${context.user ? `${context.user.name} (${context.user.email})` : "Guest user"}.`,
    `Visible categories: ${categories || "Unknown"}.`,
    "Menu snapshot:",
    formatFoodsForPrompt(context.foods),
    "Recent order snapshot:",
    formatOrdersForPrompt(context.orders),
  ].join("\n\n");
}

function buildConversationTurns(
  history: AIConversationMessage[],
  message: string
) {
  return [
    ...history.slice(-14),
    {
      content: message,
      role: "user",
    } satisfies AIConversationMessage,
  ];
}

function extractOpenAIReply(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find(
      (item) =>
        item.type === "output_text" && typeof item.text === "string"
    )
    ?.text;

  return text?.trim() || null;
}

function extractGeminiReply(payload: GeminiResponsePayload) {
  const parts =
    payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ??
    [];

  const reply = parts
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n\n");

  return reply || null;
}

async function parseOpenAIResponse(response: Response) {
  const rawBody = await response.text();

  try {
    return JSON.parse(rawBody) as OpenAIResponsePayload;
  } catch {
    if (!response.ok) {
      throw new Error(rawBody || `OpenAI request failed with status ${response.status}.`);
    }

    return {
      output_text: rawBody,
    } satisfies OpenAIResponsePayload;
  }
}

async function parseGeminiResponse(response: Response) {
  const rawBody = await response.text();

  try {
    return JSON.parse(rawBody) as GeminiResponsePayload;
  } catch {
    if (!response.ok) {
      throw new Error(rawBody || `Gemini request failed with status ${response.status}.`);
    }

    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text: rawBody,
              },
            ],
          },
        },
      ],
    } satisfies GeminiResponsePayload;
  }
}

async function generateOpenAIReply(
  context: AssistantContext,
  history: AIConversationMessage[],
  message: string
): Promise<SmartReply | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const model = getOpenAIModel();
  const turns = buildConversationTurns(history, message);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content: buildDeveloperPrompt(context),
        },
        ...turns.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const payload = await parseOpenAIResponse(response);

  if (!response.ok) {
    throw new Error(
      payload.error?.message || `OpenAI request failed with status ${response.status}.`
    );
  }

  const reply = extractOpenAIReply(payload);

  if (!reply) {
    throw new Error("OpenAI returned an empty response.");
  }

  return {
    model,
    reply,
  };
}

async function generateGeminiReply(
  context: AssistantContext,
  history: AIConversationMessage[],
  message: string
): Promise<SmartReply | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const model = getGeminiModel();
  const turns = buildConversationTurns(history, message);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: buildDeveloperPrompt(context),
            },
          ],
        },
        contents: turns.map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [
            {
              text: item.content,
            },
          ],
        })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  const payload = await parseGeminiResponse(response);

  if (!response.ok) {
    throw new Error(
      payload.error?.message || `Gemini request failed with status ${response.status}.`
    );
  }

  const reply = extractGeminiReply(payload);

  if (!reply) {
    if (payload.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the prompt: ${payload.promptFeedback.blockReason}.`
      );
    }

    const finishReason = payload.candidates?.find(
      (candidate) => typeof candidate.finishReason === "string"
    )?.finishReason;

    if (finishReason) {
      throw new Error(`Gemini returned no text. Finish reason: ${finishReason}.`);
    }

    throw new Error("Gemini returned an empty response.");
  }

  return {
    model,
    reply,
  };
}

async function generateSmartReply(
  provider: SmartProvider,
  context: AssistantContext,
  history: AIConversationMessage[],
  message: string
) {
  if (provider === "gemini") {
    return generateGeminiReply(context, history, message);
  }

  return generateOpenAIReply(context, history, message);
}

export async function generateAssistantReply({
  history,
  message,
  user,
}: AssistantRequest): Promise<AssistantReplyResult> {
  const rawText = message.trim();

  if (!rawText) {
    return {
      mode: "local",
      model: null,
      reply:
        "Асуултаа бичээрэй. Би цэс, захиалга, хүргэлт, QPay төлбөрийн талаар шууд тусалж чадна.",
    };
  }

  const providers = getSmartProviderOrder();

  if (!providers.length) {
    const reply = await generateLocalAssistantReply({
      history,
      message: rawText,
      user,
    });

    return {
      mode: "local",
      model: null,
      reply,
    };
  }

  try {
    const context = await loadAssistantContext(user);

    for (const provider of providers) {
      try {
        const smartReply = await generateSmartReply(
          provider,
          context,
          history,
          rawText
        );

        if (smartReply) {
          return {
            mode: provider,
            model: smartReply.model,
            reply: smartReply.reply,
          };
        }
      } catch (error) {
        console.error(
          `[features/ai/ai.smart.generateAssistantReply.${provider}]`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[features/ai/ai.smart.generateAssistantReply.context]", error);
  }

  const fallbackReply = await generateLocalAssistantReply({
    history,
    message: rawText,
    user,
  });

  return {
    mode: "local",
    model: null,
    reply: fallbackReply,
  };
}
