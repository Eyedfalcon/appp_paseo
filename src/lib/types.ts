export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "MERCHANT" | "ADMIN";
  active: boolean;
};
export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};
export type Page<T> = {
  data: T[];
  pagination: { page: number; totalPages: number; total: number };
};
export type Product = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  categoryName: string;
  name: string;
  description: string;
  priceCentavos: number;
  stock: number;
  imageUrl: string | null;
  available: boolean;
  features: string[];
};
export type Store = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  logoUrl: string | null;
  categoryName: string;
  directoryCategory: string;
  floor: string;
  hoursNote: string;
  phone: string | null;
  website: string | null;
  whatsappUrl: string | null;
  active: boolean;
};
export type Balance = { balance: number; tier: string };
export type Rule = { rate: number; multiplier: number; bonus: number };
export type Movement = {
  id: string;
  points: number;
  description: string;
  type: string;
  createdAt: string;
};
export type Reward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  expiresAt: string | null;
};
export type Redemption = {
  id: string;
  rewardName: string;
  code: string;
  pointsSpent: number;
  status: string;
};
export type Order = {
  id: string;
  orderNumber: string;
  establishmentId: string;
  establishmentName: string;
  totalCentavos: number;
  orderStatus: string;
  paymentStatus: string;
  pickupCode: string;
  pickupPin: string;
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCentavos: number;
  }[];
};
export type Promotion = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  name: string;
  description: string;
  imageUrl: string | null;
  discountLabel: string;
  active: boolean;
  endsAt: string;
};
export type Event = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  location: string;
  active: boolean;
};
export type Visit = {
  id: string;
  code: string;
  establishmentName: string;
  status: "PENDING" | "CONFIRMED" | "EXPIRED";
  expiresAt: string;
  credit: { balance: number; alreadyProcessed: boolean } | null;
};
export type Receipt = {
  id: string;
  storeName: string;
  receiptNumber: string;
  amountCentavos: number;
  points: number;
  status: string;
};
export type Notice = {
  id: string;
  title: string;
  description: string;
  read: boolean;
  date: string;
};
export type Conversation = {
  id: string;
  title: string;
  messages: { id: string; role: string; content: string }[];
};
