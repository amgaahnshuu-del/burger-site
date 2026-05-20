import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/helpers";

import type { ChatRole } from "@/features/ai/ai.types";

type AssistantUser = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
} | null;

type AssistantConversationMessage = {
  content: string;
  role: ChatRole;
};

type AssistantFood = {
  category: string;
  description: string | null;
  id: string;
  name: string;
  price: number;
  restaurantName: string | null;
};

type AssistantOrder = {
  address: string;
  contactPhone: string | null;
  courierName: string | null;
  createdAt: Date | string;
  id: string;
  items: Array<{
    foodName: string;
    quantity: number;
  }>;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "COOKING"
    | "DELIVERING"
    | "DELIVERED"
    | "CANCELLED";
  totalPrice: number;
  trackingStatus: "PREPARING" | "ON_THE_WAY" | "DELIVERED" | null;
};

type AssistantContext = {
  foods: AssistantFood[];
  orders: AssistantOrder[];
  user: AssistantUser;
};

type AssistantRequest = {
  history: AssistantConversationMessage[];
  message: string;
  user: AssistantUser;
};

type RecommendationPreferences = {
  budget: boolean;
  category: string | null;
  drink: boolean;
  maxPrice: number | null;
  premium: boolean;
  spicy: boolean;
  tokens: string[];
};

type AssistantIntent =
  | "comparison"
  | "deals"
  | "fallback"
  | "farewell"
  | "food_detail"
  | "greeting"
  | "help"
  | "menu"
  | "order"
  | "recommendation"
  | "thanks";

type ConversationInsights = {
  budget: number | null;
  category: string | null;
  contextualText: string;
  foodsFromRecentContext: AssistantFood[];
  foodsMentionedNow: AssistantFood[];
  normalizedMessage: string;
  peopleCount: number | null;
  recentAssistantText: string;
  recentUserText: string;
  referencedFoods: AssistantFood[];
  wantsAlternative: boolean;
  wantsCheapest: boolean;
  wantsComparison: boolean;
  wantsCombo: boolean;
  wantsDetails: boolean;
  wantsDrink: boolean;
  wantsPremium: boolean;
  wantsPrice: boolean;
  wantsSpicy: boolean;
};

const FALLBACK_FOODS: AssistantFood[] = [
  {
    category: "Burger",
    description: "Шүүслэг үхрийн мах, чеддар бяслаг, салат, соустай.",
    id: "fallback-classic-cheese-burger",
    name: "Classic Cheese Burger",
    price: 14500,
    restaurantName: null,
  },
  {
    category: "Chicken",
    description: "Шаржигнуур тахиа, ногоо, даршилсан өргөст хэмх, халуун соустай.",
    id: "fallback-spicy-chicken-burger",
    name: "Spicy Chicken Burger",
    price: 14500,
    restaurantName: null,
  },
  {
    category: "Burger",
    description: "Үхрийн мах, бекон, бяслагтай арай баялаг амттай сонголт.",
    id: "fallback-bacon-deluxe-burger",
    name: "Bacon Deluxe Burger",
    price: 16500,
    restaurantName: null,
  },
  {
    category: "Burger",
    description: "Давхар үхрийн мах, чеддар, өтгөн соустай илүү цатгалан хувилбар.",
    id: "fallback-double-beef-burger",
    name: "Double Beef Burger",
    price: 18500,
    restaurantName: null,
  },
  {
    category: "Fries",
    description: "Алтан шаргал, гаднаа шаржигнуур шарсан төмс.",
    id: "fallback-french-fries",
    name: "French Fries",
    price: 4000,
    restaurantName: null,
  },
  {
    category: "Drink",
    description: "Хүйтэн, хийжүүлсэн Coca Cola.",
    id: "fallback-coca-cola",
    name: "Coca Cola",
    price: 2500,
    restaurantName: null,
  },
];

const DEAL_LINES = [
  "25,000₮-өөс дээш захиалгад хүргэлт үнэгүй.",
  "Энэ долоо хоногт зарим комбоноос хямдралтай санал идэвхтэй байна.",
  "Ундаатай хамт авахад оройн цагаар илүү ашигтай сонголтууд гардаг.",
] as const;

const GREETING_KEYWORDS = [
  "hello",
  "hey",
  "hi",
  "байна уу",
  "мэнд",
  "сайн байна уу",
  "сайн уу",
  "sain uu",
  "yo",
] as const;

const THANKS_KEYWORDS = [
  "thanks",
  "thank you",
  "thx",
  "ty",
  "bayarlalaa",
  "баярлалаа",
  "гоё",
  "сайн байна",
] as const;

const FAREWELL_KEYWORDS = [
  "bye",
  "goodbye",
  "see you",
  "bayartai",
  "дараа уулзъя",
  "баяртай",
] as const;

const DEAL_KEYWORDS = [
  "coupon",
  "deal",
  "discount",
  "offer",
  "promo",
  "sale",
  "хямд",
  "хямдрал",
  "купон",
  "оффер",
  "урамшуулал",
  "хөнгөлөлт",
  "hyamdral",
  "uramshuul",
] as const;

const HELP_KEYWORDS = [
  "cancel",
  "checkout",
  "complaint",
  "help",
  "issue",
  "payment",
  "problem",
  "qpay",
  "refund",
  "support",
  "асуудал",
  "буцаалт",
  "захиалах",
  "тусла",
  "тусламж",
  "төлбөр",
  "цуцлах",
  "tolbor",
  "tulbur",
  "zahialah",
] as const;

const MENU_KEYWORDS = [
  "available",
  "catalog",
  "foods",
  "menu",
  "restaurant",
  "цэс",
  "меню",
  "хоол",
  "хоолнууд",
  "ямар хоол",
  "юу байна",
  "what do you have",
] as const;

const ORDER_KEYWORDS = [
  "courier",
  "delivery",
  "haana",
  "hurelt",
  "minii order",
  "minii zahialga",
  "my order",
  "order",
  "status",
  "track",
  "where is",
  "zahialga",
  "захиалга",
  "захиалгаа",
  "курьер",
  "хаана явна",
  "хүргэлт",
  "төлөв",
  "явж байна",
] as const;

const FOOD_CATEGORY_KEYWORDS = [
  "bacon",
  "beef",
  "burger",
  "chicken",
  "cola",
  "combo",
  "dessert",
  "drink",
  "fries",
  "pizza",
  "salad",
  "sauce",
  "spicy",
  "бекон",
  "бургер",
  "комбо",
  "мах",
  "тахиа",
  "ундаа",
  "шарсан төмс",
  "салад",
  "соус",
  "халуун",
] as const;

const COMPARISON_KEYWORDS = [
  "compare",
  "difference",
  "vs",
  "versus",
  "аль нь",
  "ялгаа",
  "харьцуул",
] as const;

const PRICE_KEYWORDS = [
  "price",
  "how much",
  "une",
  "үнэ",
  "үнэтэй",
  "хэд",
  "яасан үнэтэй",
] as const;

const DETAIL_KEYWORDS = [
  "detail",
  "ingredients",
  "orц",
  "тайлбар",
  "дэлгэрэнгүй",
  "ямар амттай",
  "ямар вэ",
] as const;

const RECOMMENDATION_KEYWORDS = [
  "recommend",
  "suggest",
  "best",
  "popular",
  "sanal",
  "санал",
  "зөвлө",
  "юу авбал",
  "ямар авбал",
] as const;

const ALTERNATIVE_KEYWORDS = [
  "another",
  "else",
  "instead",
  "other",
  "өөр",
  "оронд",
] as const;

const REFERENCE_KEYWORDS = [
  "it",
  "that",
  "this",
  "тэр",
  "энэ",
  "үүний",
  "тэрний",
] as const;

const STOP_WORDS = new Set([
  "a",
  "and",
  "any",
  "are",
  "best",
  "for",
  "from",
  "give",
  "have",
  "hello",
  "help",
  "hi",
  "i",
  "me",
  "menu",
  "my",
  "need",
  "please",
  "recommend",
  "show",
  "something",
  "the",
  "today",
  "want",
  "what",
  "with",
  "yu",
  "yuu",
  "байна",
  "би",
  "бол",
  "надад",
  "нэг",
  "санал",
  "танд",
  "хамгийн",
  "хоол",
  "юу",
]);

const CATEGORY_LABELS_MN: Record<string, string> = {
  Burger: "бургер",
  Chicken: "тахиан бургер",
  Combo: "комбо",
  Dessert: "амттан",
  Drink: "ундаа",
  Fries: "шарсан төмс",
  Pizza: "пицца",
  Salad: "салад",
  Sauce: "соус",
};

const ORDER_STATUS_LABELS_MN: Record<AssistantOrder["status"], string> = {
  PENDING: "Хүлээгдэж байна",
  CONFIRMED: "Баталгаажсан",
  COOKING: "Бэлтгэж байна",
  DELIVERING: "Хүргэж байна",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
};

const TRACKING_STATUS_LABELS_MN: Record<
  NonNullable<AssistantOrder["trackingStatus"]>,
  string
> = {
  PREPARING: "Бэлтгэж байна",
  ON_THE_WAY: "Замдаа явж байна",
  DELIVERED: "Хүргэгдсэн",
};

const KNOWN_CATEGORIES = [
  "Burger",
  "Chicken",
  "Combo",
  "Dessert",
  "Drink",
  "Fries",
  "Pizza",
  "Salad",
  "Sauce",
] as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getCategoryLabelMn(category: string) {
  return CATEGORY_LABELS_MN[category] ?? category.toLowerCase();
}

function getOrderStatusLabelMn(status: AssistantOrder["status"]) {
  return ORDER_STATUS_LABELS_MN[status] ?? status;
}

function getTrackingStatusLabelMn(
  status: NonNullable<AssistantOrder["trackingStatus"]>
) {
  return TRACKING_STATUS_LABELS_MN[status] ?? status;
}

function buildConversationContext(
  history: AssistantConversationMessage[],
  message: string
) {
  return normalizeText(
    [...history.slice(-10).map((item) => item.content), message].join(" ")
  );
}

function getRecentMessagesText(
  history: AssistantConversationMessage[],
  role: ChatRole,
  limit = 4
) {
  return normalizeText(
    history
      .filter((item) => item.role === role)
      .slice(-limit)
      .map((item) => item.content)
      .join(" ")
  );
}

function getCategoryAliases(category: string) {
  switch (category) {
    case "Burger":
      return ["burger", "beef", "cheese", "double", "bacon", "бургер", "үхэр", "мах"];
    case "Chicken":
      return ["chicken", "tahia", "тахиа", "тахиан"];
    case "Combo":
      return ["combo", "set", "комбо"];
    case "Drink":
      return ["drink", "cola", "coke", "undaa", "ундаа", "кола", "кока"];
    case "Fries":
      return ["fries", "chips", "side", "sides", "шарсан", "төмс"];
    case "Dessert":
      return ["dessert", "sweet", "амттан"];
    case "Pizza":
      return ["pizza", "пицца"];
    case "Salad":
      return ["salad", "салад"];
    case "Sauce":
      return ["sauce", "соус"];
    default:
      return [category.toLowerCase()];
  }
}

function matchesCategory(food: AssistantFood, category: string) {
  const haystack = normalizeText(
    `${food.category} ${food.name} ${food.description ?? ""}`
  );

  return getCategoryAliases(category).some((alias) => haystack.includes(alias));
}

function parseBudget(rawText: string) {
  const lowerText = rawText.toLowerCase();
  const directKMatch = rawText.match(/(\d{1,3})(?:\s*)k\b/i);

  if (directKMatch) {
    return Number.parseInt(directKMatch[1], 10) * 1000;
  }

  const mongolianKMatch = lowerText.match(/(\d{1,3})(?:\s*)к\b/u);

  if (mongolianKMatch) {
    return Number.parseInt(mongolianKMatch[1], 10) * 1000;
  }

  const valueMatch = lowerText.match(/(\d{4,6})(?:\s*)(?:₮|төг|төгрөг)?/u);

  if (valueMatch) {
    return Number.parseInt(valueMatch[1], 10);
  }

  return null;
}

function parsePeopleCount(text: string) {
  const explicitMatch = text.match(/(\d{1,2})\s*(?:хүн|hun|хүнд|huntei|uulaa)/u);

  if (explicitMatch) {
    return Number.parseInt(explicitMatch[1], 10);
  }

  if (text.includes("ганцаараа")) {
    return 1;
  }

  if (text.includes("family") || text.includes("гэр бүл")) {
    return 3;
  }

  return null;
}

function inferCategoryFromText(text: string) {
  for (const category of KNOWN_CATEGORIES) {
    if (getCategoryAliases(category).some((alias) => text.includes(alias))) {
      return category;
    }
  }

  return null;
}

function extractPreferences(
  rawText: string,
  contextualText: string
): RecommendationPreferences {
  const category =
    inferCategoryFromText(contextualText);

  const tokens = Array.from(
    new Set(
      normalizeText(rawText)
        .split(" ")
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    )
  );

  return {
    budget:
      contextualText.includes("budget") ||
      contextualText.includes("cheap") ||
      contextualText.includes("hyamdral") ||
      contextualText.includes("бага төсөв") ||
      contextualText.includes("хямд") ||
      contextualText.includes("төсөв") ||
      contextualText.includes("hyamd") ||
      contextualText.includes("affordable"),
    category,
    drink:
      contextualText.includes("drink") ||
      contextualText.includes("cola") ||
      contextualText.includes("coke") ||
      contextualText.includes("ундаа") ||
      contextualText.includes("undaa"),
    maxPrice: parseBudget(rawText),
    premium:
      contextualText.includes("premium") ||
      contextualText.includes("big") ||
      contextualText.includes("deluxe") ||
      contextualText.includes("том") ||
      contextualText.includes("дээд") ||
      contextualText.includes("double"),
    spicy:
      contextualText.includes("spicy") ||
      contextualText.includes("hot") ||
      contextualText.includes("халуун") ||
      contextualText.includes("haluun"),
    tokens,
  };
}

function scoreFood(food: AssistantFood, preferences: RecommendationPreferences) {
  const haystack = normalizeText(
    `${food.category} ${food.name} ${food.description ?? ""}`
  );
  let score = 0;

  if (preferences.category) {
    score += matchesCategory(food, preferences.category) ? 6 : -3;
  }

  if (preferences.spicy) {
    score += containsAny(haystack, ["spicy", "hot", "pepper", "халуун"]) ? 4 : -1;
  }

  if (preferences.drink) {
    score += matchesCategory(food, "Drink") ? 5 : -2;
  }

  if (preferences.maxPrice !== null) {
    score += food.price <= preferences.maxPrice ? 4 : -5;
  }

  if (preferences.budget) {
    score += Math.max(0, 4 - Math.floor(food.price / 5000));
  }

  if (preferences.premium) {
    score += food.price >= 15000 ? 3 : 0;
  }

  for (const token of preferences.tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  score += preferences.budget ? 0 : Math.max(0, 3 - Math.floor(food.price / 7000));

  return score;
}

function getUniqueFoods(foods: AssistantFood[]) {
  const seen = new Set<string>();

  return foods.filter((food) => {
    if (seen.has(food.id)) {
      return false;
    }

    seen.add(food.id);
    return true;
  });
}

function pickRecommendations(
  foods: AssistantFood[],
  preferences: RecommendationPreferences
) {
  return getUniqueFoods(foods)
    .map((food) => ({
      food,
      score: scoreFood(food, preferences),
    }))
    .filter(({ score }) => score > -2)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (preferences.budget) {
        return left.food.price - right.food.price;
      }

      if (preferences.premium) {
        return right.food.price - left.food.price;
      }

      return left.food.price - right.food.price;
    })
    .map(({ food }) => food)
    .slice(0, 3);
}

function buildFoodTokenSet(food: AssistantFood) {
  return Array.from(
    new Set(
      normalizeText(food.name)
        .split(" ")
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    )
  );
}

function findSpecificFoods(foods: AssistantFood[], text: string) {
  if (!text) {
    return [];
  }

  return foods
    .map((food) => {
      const normalizedName = normalizeText(food.name);
      const nameTokens = buildFoodTokenSet(food);
      const matchedTokens = nameTokens.filter((token) => text.includes(token));
      const score =
        text.includes(normalizedName)
          ? 10
          : matchedTokens.length >= Math.min(2, nameTokens.length)
            ? matchedTokens.length * 2
            : 0;

      return {
        food,
        score,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ food }) => food)
    .slice(0, 3);
}

function getRecentReferencedFoods(
  context: AssistantContext,
  history: AssistantConversationMessage[]
) {
  for (const item of [...history].reverse()) {
    const matches = findSpecificFoods(context.foods, normalizeText(item.content));

    if (matches.length) {
      return matches;
    }
  }

  return [];
}

function mentionsReference(text: string) {
  return containsAny(text, REFERENCE_KEYWORDS);
}

function collectConversationInsights(
  context: AssistantContext,
  history: AssistantConversationMessage[],
  rawText: string
): ConversationInsights {
  const normalizedMessage = normalizeText(rawText);
  const contextualText = buildConversationContext(history, rawText);
  const foodsMentionedNow = findSpecificFoods(context.foods, normalizedMessage);
  const foodsFromRecentContext = getRecentReferencedFoods(context, history);
  const referencedFoods = foodsMentionedNow.length
    ? foodsMentionedNow
    : mentionsReference(normalizedMessage) || containsAny(normalizedMessage, ALTERNATIVE_KEYWORDS)
      ? foodsFromRecentContext
      : [];

  return {
    budget: parseBudget(rawText),
    category: inferCategoryFromText(contextualText),
    contextualText,
    foodsFromRecentContext,
    foodsMentionedNow,
    normalizedMessage,
    peopleCount: parsePeopleCount(contextualText),
    recentAssistantText: getRecentMessagesText(history, "assistant"),
    recentUserText: getRecentMessagesText(history, "user"),
    referencedFoods,
    wantsAlternative: containsAny(normalizedMessage, ALTERNATIVE_KEYWORDS),
    wantsCheapest:
      contextualText.includes("cheap") ||
      contextualText.includes("хамгийн хямд") ||
      contextualText.includes("hyamd") ||
      contextualText.includes("budget"),
    wantsCombo: contextualText.includes("combo") || contextualText.includes("комбо"),
    wantsComparison: containsAny(normalizedMessage, COMPARISON_KEYWORDS),
    wantsDetails: containsAny(normalizedMessage, DETAIL_KEYWORDS),
    wantsDrink: contextualText.includes("drink") || contextualText.includes("ундаа"),
    wantsPremium:
      contextualText.includes("premium") ||
      contextualText.includes("том") ||
      contextualText.includes("deluxe"),
    wantsPrice: containsAny(normalizedMessage, PRICE_KEYWORDS),
    wantsSpicy:
      contextualText.includes("spicy") ||
      contextualText.includes("халуун") ||
      contextualText.includes("haluun"),
  };
}

function detectAssistantIntent(
  context: AssistantContext,
  insights: ConversationInsights
): AssistantIntent {
  const wordCount = insights.normalizedMessage.split(" ").filter(Boolean).length;

  if (containsAny(insights.normalizedMessage, THANKS_KEYWORDS)) {
    return "thanks";
  }

  if (containsAny(insights.normalizedMessage, FAREWELL_KEYWORDS)) {
    return "farewell";
  }

  if (
    containsAny(insights.normalizedMessage, GREETING_KEYWORDS) &&
    wordCount <= 6 &&
    !containsAny(insights.contextualText, ORDER_KEYWORDS) &&
    !containsAny(insights.contextualText, DEAL_KEYWORDS) &&
    !containsAny(insights.contextualText, HELP_KEYWORDS)
  ) {
    return "greeting";
  }

  if (containsAny(insights.contextualText, ORDER_KEYWORDS)) {
    return "order";
  }

  if (insights.wantsComparison && insights.referencedFoods.length >= 2) {
    return "comparison";
  }

  if (containsAny(insights.contextualText, DEAL_KEYWORDS)) {
    return "deals";
  }

  if (containsAny(insights.contextualText, HELP_KEYWORDS)) {
    return "help";
  }

  if (containsAny(insights.contextualText, MENU_KEYWORDS)) {
    return "menu";
  }

  if ((insights.wantsPrice || insights.wantsDetails) && insights.referencedFoods.length) {
    return "food_detail";
  }

  if (
    containsAny(insights.contextualText, RECOMMENDATION_KEYWORDS) ||
    containsAny(insights.contextualText, FOOD_CATEGORY_KEYWORDS) ||
    insights.category !== null ||
    insights.budget !== null ||
    insights.peopleCount !== null ||
    insights.wantsAlternative ||
    insights.wantsCombo ||
    insights.wantsDrink ||
    insights.wantsPremium ||
    insights.wantsSpicy
  ) {
    return "recommendation";
  }

  if (insights.referencedFoods.length || findSpecificFoods(context.foods, insights.normalizedMessage).length) {
    return "food_detail";
  }

  return "fallback";
}

function formatFoodShort(food: AssistantFood) {
  return `${food.name} (${formatCurrency(food.price)})`;
}

function joinWithAnd(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} болон ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, мөн ${values[values.length - 1]}`;
}

function getFoodMood(food: AssistantFood) {
  const haystack = normalizeText(`${food.name} ${food.description ?? ""}`);

  if (containsAny(haystack, ["spicy", "hot", "pepper", "халуун"])) {
    return "халуун ногоотой, арай хурц амттай";
  }

  if (containsAny(haystack, ["bacon", "double", "deluxe", "бекон", "давхар"])) {
    return "илүү баялаг, цатгалан мэдрэмжтэй";
  }

  if (containsAny(haystack, ["cheese", "classic", "ched"])) {
    return "сонгодог, тэнцвэртэй амттай";
  }

  if (matchesCategory(food, "Drink")) {
    return "ундааны хувьд хөнгөн, даруулгатай";
  }

  if (matchesCategory(food, "Fries")) {
    return "хажуугийн хачирт маш амархан зохицдог";
  }

  if (matchesCategory(food, "Combo")) {
    return "нэг дороос цатгалан авахад тохиромжтой";
  }

  return "амтны хувьд тэнцвэртэй, ихэнх хүнд таалагддаг";
}

function findPairingSuggestion(context: AssistantContext, food: AssistantFood) {
  const fries = context.foods.find((item) => matchesCategory(item, "Fries"));
  const drink = context.foods.find((item) => matchesCategory(item, "Drink"));
  const burger = context.foods.find((item) => matchesCategory(item, "Burger"));

  if (matchesCategory(food, "Drink")) {
    return burger?.name ?? null;
  }

  if (matchesCategory(food, "Fries")) {
    return drink?.name ?? null;
  }

  if (fries && drink) {
    return `${fries.name} + ${drink.name}`;
  }

  return fries?.name ?? drink?.name ?? null;
}

function getPersonalizationLine(context: AssistantContext) {
  if (!context.user || !context.orders.length) {
    return null;
  }

  const latestItems = context.orders[0].items
    .slice(0, 2)
    .map((item) => item.foodName);

  if (!latestItems.length) {
    return null;
  }

  return `Таны сүүлийн захиалгад ${joinWithAnd(latestItems)} байсан тул ойролцоо амтны сонголтыг давхар бодож хариулж байна.`;
}

function findRequestedOrder(
  orders: AssistantOrder[],
  contextualText: string
) {
  const directMatch = orders.find((order) => {
    const id = order.id.toLowerCase();
    return contextualText.includes(id) || contextualText.includes(`#${id}`);
  });

  if (directMatch) {
    return directMatch;
  }

  if (
    contextualText.includes("latest") ||
    contextualText.includes("recent") ||
    contextualText.includes("last") ||
    contextualText.includes("хамгийн сүүлд") ||
    contextualText.includes("сүүлийн")
  ) {
    return orders[0] ?? null;
  }

  return orders[0] ?? null;
}

function getOrderNarration(order: AssistantOrder) {
  if (order.status === "DELIVERED" || order.trackingStatus === "DELIVERED") {
    return "Захиалга амжилттай хүргэгдсэн байна.";
  }

  if (order.status === "DELIVERING" || order.trackingStatus === "ON_THE_WAY") {
    return "Курьер замдаа явж байна, ойрын хугацаанд очих төлөвтэй.";
  }

  if (order.status === "COOKING" || order.trackingStatus === "PREPARING") {
    return "Одоогоор гал тогоонд бэлтгэгдэж байна.";
  }

  if (order.status === "CONFIRMED") {
    return "Захиалга баталгаажсан, удахгүй бэлтгэгдэж эхэлнэ.";
  }

  if (order.status === "CANCELLED") {
    return "Энэ захиалга цуцлагдсан төлөвтэй байна.";
  }

  return "Захиалга хүлээгдэж байна.";
}

function buildGreetingReply(context: AssistantContext) {
  const name = context.user?.name ? ` ${context.user.name}` : "";
  const personalization = getPersonalizationLine(context);

  return [
    `Сайн байна уу${name}! Би таны Burger AI туслах байна.`,
    context.user
      ? "Би одоогийн цэс, таны сүүлийн захиалгууд, хүргэлтийн төлөв дээр тулгуурлаад шууд санал өгч чадна."
      : "Би одоогийн цэс, хямдрал, QPay төлбөрийн алхмууд, мөн захиалгын ерөнхий урсгал дээр тулгуурлаад тусалж чадна.",
    personalization,
    "Хэрэв хүсвэл шууд `20к дотор бургер санал болго`, `миний захиалга хаана байна`, эсвэл `тахиатай өөр 2 сонголт` гэж асуугаарай.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildThanksReply() {
  return [
    "Баярлалаа.",
    "Хэрэв хүсвэл одооноос шууд дараагийн алхмаар цэснээс сонголт гаргаж өгөх, захиалга шалгах, эсвэл QPay төлбөрийн талаар тайлбарлаж өгч чадна.",
  ].join("\n\n");
}

function buildFarewellReply() {
  return [
    "За тэгье, баяртай.",
    "Дараа нь хүсвэл цэс, захиалга, эсвэл хүргэлтийн талаар шууд асуугаарай.",
  ].join("\n\n");
}

function buildDealsReply(context: AssistantContext) {
  const budgetFoods = [...context.foods]
    .sort((left, right) => left.price - right.price)
    .slice(0, 3);
  const premiumFood = [...context.foods]
    .sort((left, right) => right.price - left.price)[0];

  return [
    "Одоогоор танд ашигтай санал болгож болох зүйлсийг нэгтгээд хэлбэл:",
    DEAL_LINES.map((line, index) => `${index + 1}. ${line}`).join("\n"),
    budgetFoods.length
      ? `Төсөв талдаа харвал ${budgetFoods.map((food) => formatFoodShort(food)).join(", ")} нь хамгийн ашигтай сонголтууд байна.`
      : null,
    premiumFood
      ? `Харин арай илүү цатгалан, баялаг амт хүсвэл ${premiumFood.name} (${formatCurrency(premiumFood.price)}) руу харахад болно.`
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildHelpReply(insights: ConversationInsights) {
  if (
    insights.contextualText.includes("qpay") ||
    insights.contextualText.includes("төлбөр") ||
    insights.contextualText.includes("payment")
  ) {
    return [
      "Одоогийн систем дээр төлбөр QPay-аар хийгдэнэ.",
      "Ерөнхийдөө дараалал нь: хоолоо сонгоно, `/protected/cart` дээр шалгана, дараа нь `/protected/order` дээр QPay-гаа сонгоод баталгаажуулна.",
      "Хэрэв QPay дээр алдаа гарч байвал яг ямар алхам дээр гацаж байгаагаа хэлбэл би дараагийн зөвлөгөөг нь өгье.",
    ].join("\n\n");
  }

  if (
    insights.contextualText.includes("cancel") ||
    insights.contextualText.includes("refund") ||
    insights.contextualText.includes("цуц") ||
    insights.contextualText.includes("буца")
  ) {
    return [
      "Цуцлалт эсвэл буцаалтын асуудал бол захиалгын одоогийн төлөвөөс их хамаарна.",
      "Хэрэв захиалга хараахан хүргэлтэд гараагүй бол support талаас шалгах боломж өндөр. Харин хүргэлтэд гарсан бол support-т захиалгын дугаар, асуудлаа дэлгэрэнгүй хэлж өгөх хэрэгтэй.",
      "Хэрэв хүсвэл захиалгын дугаараа явуулаад эхлээд одоогийн төлөвийг нь надаар шалгуулж болно.",
    ].join("\n\n");
  }

  return [
    "Би энэ апп дээр дараах зүйлсээр хамгийн сайн тусалж чадна:",
    "1. Танд тохирох хоол санал болгох",
    "2. Тодорхой хоолны үнэ, амт, ялгааг тайлбарлах",
    "3. Захиалгын явц болон tracking шалгах",
    "4. QPay төлбөр, checkout урсгалыг тайлбарлах",
    "Хэрэв шууд эхэлье гэвэл `20к дотор комбо`, `миний захиалга`, эсвэл `Classic Cheese Burger ямар вэ` гэж бичээрэй.",
  ].join("\n\n");
}

function buildMenuReply(
  context: AssistantContext,
  insights: ConversationInsights
) {
  if (!context.foods.length) {
    return "Одоогоор цэсийн мэдээлэл ачаалагдсангүй. Түр хүлээгээд дахин оролдоорой.";
  }

  if (insights.category) {
    const categoryFoods = context.foods
      .filter((food) => matchesCategory(food, insights.category as string))
      .sort((left, right) => left.price - right.price)
      .slice(0, 5);

    if (categoryFoods.length) {
      return [
        `${getCategoryLabelMn(insights.category)} төрлөөс одоогоор ${categoryFoods.length} сонирхолтой сонголт харагдаж байна.`,
        categoryFoods
          .map((food, index) => `${index + 1}. ${food.name} - ${formatCurrency(food.price)}`)
          .join("\n"),
        "Хэрэв хүсвэл эдгээрээс хамгийн хямд, хамгийн цатгалан, эсвэл хамгийн амттайг нь дахин шүүж өгч болно.",
      ].join("\n\n");
    }
  }

  const categoryCounts = new Map<string, number>();

  for (const food of context.foods) {
    categoryCounts.set(food.category, (categoryCounts.get(food.category) ?? 0) + 1);
  }

  const summary = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([category, count]) => `${getCategoryLabelMn(category)} ${count}`)
    .join(", ");

  const highlights = context.foods
    .slice(0, 4)
    .map((food) => formatFoodShort(food))
    .join(", ");

  return [
    `Одоогийн цэсний гол ангиллууд: ${summary}.`,
    `Хэрэв шууд харах 4 сонголт хэлбэл ${highlights}.`,
    "Та бургер, тахиа, комбо, ундаа, эсвэл төсвөөр нь нарийсгаад асууж болно.",
  ].join("\n\n");
}

function buildComparisonReply(
  context: AssistantContext,
  insights: ConversationInsights
) {
  const foods = insights.referencedFoods.slice(0, 3);

  if (foods.length < 2) {
    return buildMenuReply(context, insights);
  }

  const cheapest = [...foods].sort((left, right) => left.price - right.price)[0];
  const richest = [...foods].sort((left, right) => right.price - left.price)[0];
  const spicyFood = foods.find((food) =>
    containsAny(normalizeText(`${food.name} ${food.description ?? ""}`), [
      "spicy",
      "hot",
      "pepper",
      "халуун",
    ])
  );

  let recommendationLine = `${cheapest.name} нь үнэ талдаа хамгийн боломжийн.`;

  if (insights.wantsSpicy && spicyFood) {
    recommendationLine = `Хэрэв халуун ногоотой амт хүсэж байвал ${spicyFood.name} илүү тохирно.`;
  } else if (insights.wantsPremium) {
    recommendationLine = `Илүү баялаг, цатгалан сонголт гэвэл ${richest.name} талдаа очно.`;
  }

  return [
    `${joinWithAnd(foods.map((food) => food.name))}-ийг харьцуулбал:`,
    foods
      .map(
        (food) =>
          `- ${food.name}: ${formatCurrency(food.price)}, ${getFoodMood(food)}.`
      )
      .join("\n"),
    recommendationLine,
  ].join("\n\n");
}

function buildFoodDetailReply(
  context: AssistantContext,
  insights: ConversationInsights
) {
  const foods = insights.referencedFoods.length
    ? insights.referencedFoods
    : findSpecificFoods(context.foods, insights.normalizedMessage);

  if (!foods.length) {
    return buildMenuReply(context, insights);
  }

  if (foods.length >= 2 && insights.wantsComparison) {
    return buildComparisonReply(context, insights);
  }

  const food = foods[0];
  const pairing = findPairingSuggestion(context, food);
  const alternative = context.foods.find(
    (item) =>
      item.id !== food.id &&
      item.category === food.category &&
      Math.abs(item.price - food.price) <= 4000
  );

  return [
    `${food.name} бол ${getCategoryLabelMn(food.category)} ангиллын ${formatCurrency(food.price)} үнэтэй сонголт.`,
    food.description
      ? `${food.description} Ерөнхийдөө ${getFoodMood(food)} гэж ойлгож болно.`
      : `Энэ нь ${getFoodMood(food)} сонголт гэж хэлж болно.`,
    pairing ? `Хамт авахад ${pairing} сайн зохицно.` : null,
    alternative ? `Хэрэв ойролцоо өөр хувилбар харъя гэвэл ${alternative.name} бас боломжийн.` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildGroupRecommendationReply(
  context: AssistantContext,
  recommendations: AssistantFood[],
  peopleCount: number
) {
  const mains = recommendations
    .filter((food) => !matchesCategory(food, "Drink") && !matchesCategory(food, "Fries"))
    .slice(0, Math.min(peopleCount, 2));
  const side = context.foods.find((food) => matchesCategory(food, "Fries"));
  const drinks = context.foods
    .filter((food) => matchesCategory(food, "Drink"))
    .sort((left, right) => left.price - right.price)
    .slice(0, Math.min(peopleCount, 2));
  const bundle = [...mains, ...(side ? [side] : []), ...drinks].slice(
    0,
    Math.max(peopleCount + 1, 3)
  );
  const total = bundle.reduce((sum, food) => sum + food.price, 0);

  return [
    `${peopleCount} хүнд тохируулаад харвал би иймэрхүү багц санал болгоно:`,
    bundle
      .map((food, index) => `${index + 1}. ${food.name} - ${formatCurrency(food.price)}`)
      .join("\n"),
    `Нийтдээ ойролцоогоор ${formatCurrency(total)} болно. Хэрэв хүсвэл үүнийг арай хямд эсвэл арай цатгалан хувилбар руу шилжүүлж өгч чадна.`,
  ].join("\n\n");
}

function buildRecommendationReply(
  context: AssistantContext,
  insights: ConversationInsights,
  rawText: string
) {
  if (!context.foods.length) {
    return "Одоогоор цэсийн мэдээлэл дутуу байна. Түр хүлээгээд дахин асуугаарай.";
  }

  const preferences = extractPreferences(rawText, insights.contextualText);
  const excludedIds = insights.wantsAlternative
    ? new Set(insights.referencedFoods.map((food) => food.id))
    : new Set<string>();

  if (insights.category) {
    preferences.category = insights.category;
  }

  if (insights.budget !== null) {
    preferences.budget = true;
    preferences.maxPrice = insights.budget;
  }

  if (insights.wantsCombo) {
    preferences.category = "Combo";
  }

  if (insights.wantsDrink) {
    preferences.drink = true;
  }

  if (insights.wantsPremium) {
    preferences.premium = true;
  }

  if (insights.wantsSpicy) {
    preferences.spicy = true;
  }

  if (insights.wantsCheapest) {
    preferences.budget = true;
  }

  const recommendations = pickRecommendations(context.foods, preferences).filter(
    (food) => !excludedIds.has(food.id)
  );
  const selectedFoods = recommendations.length ? recommendations : context.foods.slice(0, 3);

  if (insights.peopleCount && insights.peopleCount > 1) {
    return buildGroupRecommendationReply(
      context,
      selectedFoods,
      insights.peopleCount
    );
  }

  const primary = selectedFoods[0];
  const alternatives = selectedFoods.slice(1, 3);
  const reasonBits = [
    preferences.category ? `${getCategoryLabelMn(preferences.category)} төрлийн` : null,
    preferences.spicy ? "халуун ногоотой" : null,
    preferences.budget || preferences.maxPrice !== null ? "төсөвт багтах" : null,
    preferences.premium ? "арай илүү баялаг" : null,
  ].filter((item): item is string => Boolean(item));

  return [
    insights.wantsAlternative && insights.referencedFoods[0]
      ? `${insights.referencedFoods[0].name}-ийн оронд бол ${primary.name} хамгийн ойр, илүү тохирох сонголт гэж харж байна.`
      : `Миний бодлоор яг одоо таны асуултад ${primary.name} хамгийн тохирох сонголт байна.`,
    reasonBits.length
      ? `Таны мессежээс ${reasonBits.join(", ")} зүйл хайж байна гэж ойлголоо.`
      : null,
    `${primary.name} нь ${formatCurrency(primary.price)} үнэтэй. ${primary.description ?? ""} ${getFoodMood(primary)} гэдэг талаараа ихэнх хүнд таардаг.`,
    alternatives.length
      ? `Хэрэв өөр 2 хувилбар давхар харъя гэвэл ${alternatives.map((food) => formatFoodShort(food)).join(", ")} байна.`
      : null,
    getPersonalizationLine(context),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildOrderReply(
  context: AssistantContext,
  insights: ConversationInsights
) {
  if (!context.user) {
    return [
      "Захиалгын мэдээлэл харахын тулд эхлээд нэвтрэх хэрэгтэй.",
      "Нэвтэрсний дараа `миний захиалга хаана байна` гэж асуувал би шууд шалгаж өгнө.",
    ].join("\n\n");
  }

  if (!context.orders.length) {
    return [
      "Таны бүртгэл дээр одоогоор захиалга олдсонгүй.",
      "`/public/explore` хэсгээс хоолоо сонгоод захиалга хийчихвэл дараа нь би явцыг нь хянаж өгч чадна.",
    ].join("\n\n");
  }

  const order = findRequestedOrder(context.orders, insights.contextualText);

  if (!order) {
    return "Тэр захиалгыг олж чадсангүй. Захиалгын дугаараа бүтнээр нь явуулбал илүү нарийн шалгаж өгье.";
  }

  const items = order.items.map((item) => `${item.foodName} x${item.quantity}`);
  const trackUrl = `/protected/order/track/${encodeURIComponent(order.id)}`;
  const trackingLabel = order.trackingStatus
    ? getTrackingStatusLabelMn(order.trackingStatus)
    : "Эхлээгүй";

  return [
    `Таны #${order.id} захиалга одоогоор ${getOrderStatusLabelMn(order.status)} төлөвтэй байна.`,
    `${getOrderNarration(order)} Tracking-ийн харагдаж буй шат нь ${trackingLabel}.`,
    `Захиалсан зүйлс: ${joinWithAnd(items)}. Нийт дүн нь ${formatCurrency(order.totalPrice)}.`,
    `Хүргэх хаяг: ${order.address}.${order.contactPhone ? ` Холбогдох утас: ${order.contactPhone}.` : ""}`,
    order.courierName ? `Хариуцаж байгаа курьер: ${order.courierName}.` : null,
    `Дэлгэрэнгүй tracking-ийг ${trackUrl} дээрээс харах боломжтой.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildFallbackReply(context: AssistantContext) {
  const topFoods = context.foods.slice(0, 3);

  return [
    "Би асуултыг тань нэг чиглэлд бүрэн оноож чадсангүй, гэхдээ шууд тусалж чадна.",
    topFoods.length
      ? `Хэрэв яг одооноос эхэлье гэвэл ${topFoods.map((food) => formatFoodShort(food)).join(", ")} дундаас сонголт хийж болно.`
      : null,
    "Та хүсвэл `20к дотор`, `тахиатай`, `өөр 2 санал`, `миний захиалга`, эсвэл `QPay яаж төлөх вэ` гэж илүү тодруулж бичээрэй.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

async function loadAssistantContext(user: AssistantUser): Promise<AssistantContext> {
  try {
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
        orderBy: {
          createdAt: "desc",
        },
        take: 60,
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
      foods: foods.length
        ? foods.map((food) => ({
            category: food.category,
            description: food.description,
            id: food.id,
            name: food.name,
            price: food.price,
            restaurantName: food.restaurant?.name ?? null,
          }))
        : FALLBACK_FOODS,
      orders: orders.map((order) => ({
        address: order.address,
        contactPhone: order.contactPhone ?? null,
        courierName: order.courier?.name ?? null,
        createdAt: order.createdAt,
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
  } catch {
    return {
      foods: FALLBACK_FOODS,
      orders: [],
      user,
    };
  }
}

export async function generateAssistantReply({
  history,
  message,
  user,
}: AssistantRequest) {
  const context = await loadAssistantContext(user);
  const rawText = message.trim();

  if (!rawText) {
    return "Асуултаа бичээрэй. Би цэс, захиалга, хүргэлт, QPay төлбөрийн талаар шууд тусалж чадна.";
  }

  const insights = collectConversationInsights(context, history, rawText);
  const intent = detectAssistantIntent(context, insights);

  switch (intent) {
    case "greeting":
      return buildGreetingReply(context);
    case "thanks":
      return buildThanksReply();
    case "farewell":
      return buildFarewellReply();
    case "order":
      return buildOrderReply(context, insights);
    case "deals":
      return buildDealsReply(context);
    case "help":
      return buildHelpReply(insights);
    case "menu":
      return buildMenuReply(context, insights);
    case "comparison":
      return buildComparisonReply(context, insights);
    case "food_detail":
      return buildFoodDetailReply(context, insights);
    case "recommendation":
      return buildRecommendationReply(context, insights, rawText);
    default:
      return buildFallbackReply(context);
  }
}
