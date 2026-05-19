import type { Food } from "@/features/food/food.types";
import type { Order, OrderItem, OrderStatus, TrackingStatus } from "@/features/order/order.types";

export type DashboardCategory = {
  label: string;
  subtitle: string;
  category: string;
  count: number;
  image: string;
};

export type DashboardCombo = {
  name: string;
  image: string;
};

export type DashboardMessage = {
  role: "assistant" | "user";
  sender?: string;
  message: string;
  time: string;
};

export type DashboardThread = {
  id: string;
  title: string;
  preview: string;
  time: string;
  accent: "orange" | "blue" | "amber";
  messages: DashboardMessage[];
};

export type DashboardProfileRow = {
  label: string;
  value: string;
};

type FoodBlueprint = {
  category: string;
  description: string;
  image: string;
  name: string;
  price: number;
  keywords: string[];
};

const FEATURED_FOOD_BLUEPRINTS: FoodBlueprint[] = [
  {
    category: "Burger",
    description: "Juicy beef, melted cheddar, lettuce, and signature sauce.",
    image: "/home-crops/burger1-clean-v2.png",
    name: "Classic Cheese Burger",
    price: 14500,
    keywords: ["classic", "cheese", "smash", "big"],
  },
  {
    category: "Chicken",
    description: "Crispy chicken, pickles, greens, and a spicy house glaze.",
    image: "/home-crops/burger2-clean-v2.png",
    name: "Spicy Chicken Burger",
    price: 14500,
    keywords: ["spicy", "chicken"],
  },
  {
    category: "Burger",
    description: "Stacked beef, bacon, cheese, and a richer premium bite.",
    image: "/home-crops/burger3-clean-v2.png",
    name: "Bacon Deluxe Burger",
    price: 16500,
    keywords: ["bacon", "deluxe"],
  },
  {
    category: "Burger",
    description: "Double beef patties, cheddar, lettuce, and bold sauce.",
    image: "/home-crops/burger1-clean-v2.png",
    name: "Double Beef Burger",
    price: 18500,
    keywords: ["double", "beef"],
  },
  {
    category: "Fries",
    description: "Golden fries with a crunchy finish and warm seasoning.",
    image: "/home-crops/fries-clean-v2.png",
    name: "French Fries",
    price: 4000,
    keywords: ["fries", "fried"],
  },
  {
    category: "Drink",
    description: "Cold and fizzy Coca Cola, perfect with burgers and fries.",
    image: "/home-crops/cola-clean-v2.png",
    name: "Coca Cola",
    price: 2500,
    keywords: ["cola", "coca", "drink"],
  },
];

export const dashboardCategories: DashboardCategory[] = [
  {
    category: "Burger",
    count: 12,
    image: "/home-crops/burger1-clean-v2.png",
    label: "Бургер",
    subtitle: "12 сонголт",
  },
  {
    category: "Combo",
    count: 8,
    image: "/home-crops/combo-clean-v2.png",
    label: "Комбо багц",
    subtitle: "8 сонголт",
  },
  {
    category: "Chicken",
    count: 6,
    image: "/home-crops/burger3-clean-v2.png",
    label: "Тахианы мах",
    subtitle: "6 сонголт",
  },
  {
    category: "Sides",
    count: 10,
    image: "/home-crops/fries-clean-v2.png",
    label: "Хачир",
    subtitle: "10 сонголт",
  },
  {
    category: "Drink",
    count: 9,
    image: "/home-crops/cola-clean-v2.png",
    label: "Ундаа",
    subtitle: "9 сонголт",
  },
  {
    category: "Dessert",
    count: 6,
    image: "/home-crops/burger2-clean-v2.png",
    label: "Амттан",
    subtitle: "6 сонголт",
  },
];

export const dashboardCombos: DashboardCombo[] = [
  { image: "/home-crops/combo-clean-v2.png", name: "Combo 1" },
  { image: "/home-crops/combo-clean-v2.png", name: "Combo 2" },
  { image: "/home-crops/combo-clean-v2.png", name: "Combo 3" },
];

export const dashboardCoupons = [
  {
    detail: "Get free delivery on your next order over 25,000₮.",
    points: "600 P",
    title: "Free Delivery",
  },
  {
    detail: "Save 15% on any burger combo this week.",
    points: "900 P",
    title: "Combo Discount",
  },
  {
    detail: "Add a drink and redeem a premium late-night perk.",
    points: "1,200 P",
    title: "Night Owl Deal",
  },
];

export const dashboardThreads: DashboardThread[] = [
  {
    accent: "orange",
    id: "support",
    preview: "Thank you for reaching out.",
    time: "19:45",
    title: "Burger Support",
    messages: [
      {
        message: "Hello! How can we help you today?",
        role: "assistant",
        sender: "Burger Support",
        time: "19:40",
      },
      {
        message: "I have an issue with my order.",
        role: "user",
        time: "19:41",
      },
      {
        message: "I'm sorry to hear that. Can you share your order number?",
        role: "assistant",
        sender: "Burger Support",
        time: "19:42",
      },
      {
        message: "Sure, it's #BUR12345",
        role: "user",
        time: "19:43",
      },
      {
        message: "Thank you! Let me check that for you.",
        role: "assistant",
        sender: "Burger Support",
        time: "19:44",
      },
    ],
  },
  {
    accent: "orange",
    id: "delivery",
    preview: "Where are you?",
    time: "19:42",
    title: "Bat-Delivery",
    messages: [
      {
        message: "Where are you?",
        role: "assistant",
        sender: "Bat-Delivery",
        time: "19:42",
      },
    ],
  },
  {
    accent: "blue",
    id: "promotions",
    preview: "Special offer just for you!",
    time: "May 14",
    title: "Promotions",
    messages: [
      {
        message: "Special offer just for you! Try a combo and save 20%.",
        role: "assistant",
        sender: "Promotions",
        time: "May 14",
      },
    ],
  },
  {
    accent: "orange",
    id: "system",
    preview: "Your order #BUR12344 is ready.",
    time: "May 14",
    title: "System",
    messages: [
      {
        message: "Your order #BUR12344 is ready for delivery.",
        role: "assistant",
        sender: "System",
        time: "May 14",
      },
    ],
  },
];

export const dashboardAssistantPrompts = [
  "Надад бургер санал болго",
  "Миний захиалгыг шалга",
  "Өнөөдрийн хямдрал",
  "Захиалгад туслаач",
] as const;

export const dashboardAssistantMessages: DashboardMessage[] = [
  {
    message: "Хамгийн гоё бургер аль нь вэ?",
    role: "user",
    time: "19:48",
  },
  {
    message:
      "Манай хэрэглэгчид Classic Cheese Burger-ийг их сонгодог. Шүүслэг мах, бяслагтай болохоор амттай сонголт шүү.",
    role: "assistant",
    sender: "AI Туслах",
    time: "19:49",
  },
  {
    message: "Өнөөдөр хямдрал байна уу?",
    role: "user",
    time: "19:50",
  },
  {
    message: "Тийм ээ. Баасан гараг бүр бүх комбо захиалгад хямдралтай байдаг. Бүү алдаарай.",
    role: "assistant",
    sender: "AI Туслах",
    time: "19:50",
  },
];

export const dashboardProfileRows: DashboardProfileRow[] = [
  { label: "Membership", value: "Premium" },
  { label: "Points", value: "2,350 P" },
  { label: "Member Since", value: "Jan 15, 2024" },
  { label: "Order History", value: "" },
  { label: "Payment Methods", value: "" },
  { label: "Addresses", value: "" },
];

function createFoodFromBlueprint(blueprint: FoodBlueprint, index: number): Food {
  return {
    category: blueprint.category,
    createdAt: "2024-05-01T10:00:00.000Z",
    description: blueprint.description,
    id: `dashboard-food-${index + 1}`,
    image: blueprint.image,
    isAvailable: true,
    name: blueprint.name,
    price: blueprint.price,
    restaurant: null,
    restaurantId: null,
  };
}

function matchFoodBlueprint(food: Food, blueprint: FoodBlueprint) {
  const name = food.name.toLowerCase();
  const category = food.category.toLowerCase();

  if (category.includes(blueprint.category.toLowerCase())) {
    return true;
  }

  return blueprint.keywords.some((keyword) => name.includes(keyword));
}

export const dashboardDemoFoods = FEATURED_FOOD_BLUEPRINTS.map(createFoodFromBlueprint);

export function buildDashboardShowcaseFoods(catalogFoods: Food[]) {
  const usedIds = new Set<string>();

  return FEATURED_FOOD_BLUEPRINTS.map((blueprint, index) => {
    const match = catalogFoods.find((food) => {
      if (usedIds.has(food.id)) {
        return false;
      }

      return matchFoodBlueprint(food, blueprint);
    });

    if (!match) {
      return createFoodFromBlueprint(blueprint, index);
    }

    usedIds.add(match.id);

    return {
      ...match,
      category: blueprint.category,
      description: blueprint.description,
      image: blueprint.image,
      name: blueprint.name,
      price: blueprint.price,
    };
  });
}

function createOrderItem(food: Food, quantity: number, index: number): OrderItem {
  return {
    food,
    foodCategory: food.category,
    foodId: food.id,
    foodImage: food.image,
    foodName: food.name,
    id: `dashboard-order-item-${food.id}-${index}`,
    orderId: "",
    price: food.price,
    quantity,
  };
}

function createDashboardOrder(options: {
  address: string;
  createdAt: string;
  id: string;
  items: Array<{ food: Food; quantity: number }>;
  status: OrderStatus;
  trackingStatus: TrackingStatus;
}) {
  const items = options.items.map((item, index) => {
    const orderItem = createOrderItem(item.food, item.quantity, index + 1);
    orderItem.orderId = options.id;
    return orderItem;
  });

  return {
    address: options.address,
    createdAt: options.createdAt,
    id: options.id,
    items,
    payment: null,
    status: options.status,
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tracking: {
      id: `tracking-${options.id}`,
      latitude: 47.9184,
      longitude: 106.9177,
      orderId: options.id,
      status: options.trackingStatus,
      updatedAt: "2024-05-15T19:45:00.000Z",
    },
    userId: "dashboard-demo-user",
  } satisfies Order;
}

export const dashboardOrders = [
  createDashboardOrder({
    address: "Peace Avenue 99, Ulaanbaatar",
    createdAt: "2024-05-15T19:30:00.000Z",
    id: "BUR12345",
    items: [
      { food: dashboardDemoFoods[0], quantity: 1 },
      { food: dashboardDemoFoods[4], quantity: 1 },
      { food: dashboardDemoFoods[5], quantity: 1 },
    ],
    status: "DELIVERING",
    trackingStatus: "ON_THE_WAY",
  }),
  createDashboardOrder({
    address: "Olympic Street 14, Ulaanbaatar",
    createdAt: "2024-05-14T14:20:00.000Z",
    id: "BUR12344",
    items: [
      { food: dashboardDemoFoods[1], quantity: 1 },
      { food: dashboardDemoFoods[5], quantity: 1 },
    ],
    status: "DELIVERED",
    trackingStatus: "DELIVERED",
  }),
  createDashboardOrder({
    address: "Seoul Street 11, Ulaanbaatar",
    createdAt: "2024-05-13T18:10:00.000Z",
    id: "BUR12343",
    items: [
      { food: dashboardDemoFoods[2], quantity: 1 },
      { food: dashboardDemoFoods[4], quantity: 1 },
      { food: dashboardDemoFoods[5], quantity: 1 },
    ],
    status: "DELIVERED",
    trackingStatus: "DELIVERED",
  }),
];

export const dashboardSummaryItems = [
  { food: dashboardDemoFoods[0], quantity: 1 },
  { food: dashboardDemoFoods[4], quantity: 1 },
  { food: dashboardDemoFoods[5], quantity: 1 },
];
