export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  address: string | null;
  createdAt: string;
  foods?: Food[];
};

export type Food = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  restaurantId: string | null;
  createdAt: string;
  restaurant?: Restaurant | null;
};
