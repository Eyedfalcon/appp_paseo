import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { currentSession, onSession, restoreSession } from "../lib/api";
import type { Product, Session } from "../lib/types";
export type CartLine = { product: Product; quantity: number };
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: false },
  },
});
const Context = createContext<{
  session: Session | null;
  ready: boolean;
  cart: CartLine[];
  setCart: React.Dispatch<React.SetStateAction<CartLine[]>>;
  uncertain: boolean;
  setUncertain: React.Dispatch<React.SetStateAction<boolean>>;
  add: (p: Product) => string | null;
}>({
  session: null,
  ready: false,
  cart: [],
  setCart: () => {},
  uncertain: false,
  setUncertain: () => {},
  add: () => null,
});
export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setCurrent] = useState(currentSession);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [uncertain, setUncertain] = useState(false);
  const account = useRef<string | undefined>(undefined);
  useEffect(() => {
    const unsub = onSession((next) => {
      if (next?.user.id !== account.current) {
        if (account.current) {
          const previousUserId = account.current;
          client.removeQueries({
            predicate: (query) => query.queryKey.includes(previousUserId),
          });
          setCart([]);
          setUncertain(false);
        }
      }
      account.current = next?.user.id;
      setCurrent(next);
    });
    restoreSession().finally(() => setReady(true));
    return unsub;
  }, []);
  const add = (p: Product) => {
    if (uncertain)
      return "Revisa tus pedidos y vacía la bolsa pendiente antes de añadir productos.";
    if (!p.available || p.stock < 1)
      return "Este producto no tiene existencias disponibles.";
    if (cart.length && cart[0].product.establishmentId !== p.establishmentId)
      return "Completa o vacía tu bolsa antes de comprar en otra tienda.";
    const quantity = cart.find((l) => l.product.id === p.id)?.quantity || 0;
    if (quantity >= p.stock) return "Ya añadiste las unidades disponibles.";
    setCart((prev) =>
      prev.some((l) => l.product.id === p.id)
        ? prev.map((l) =>
            l.product.id === p.id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [...prev, { product: p, quantity: 1 }],
    );
    return null;
  };
  return (
    <QueryClientProvider client={client}>
      <Context.Provider
        value={{ session, ready, cart, setCart, uncertain, setUncertain, add }}
      >
        {children}
      </Context.Provider>
    </QueryClientProvider>
  );
}
export const useApp = () => useContext(Context);
