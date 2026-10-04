import { test, expect, type Page } from "@playwright/test";
const product = {
  id: "p1",
  establishmentId: "s1",
  establishmentName: "Tienda de prueba",
  categoryName: "Moda",
  name: "Camisa de prueba",
  description: "Producto solo del entorno de pruebas.",
  priceCentavos: 28900,
  stock: 3,
  imageUrl: null,
  available: true,
  features: [],
};
const pageOf = (data: unknown[]) => ({
  data,
  pagination: { page: 0, limit: 20, total: data.length, totalPages: 1 },
});
async function setup(page: Page) {
  const writes: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace("/api/v1", "");
    if (req.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
        },
      });
    if (req.method() !== "GET") writes.push(path);
    let body: unknown;
    if (path === "/auth/login")
      body = {
        accessToken: "test-access",
        refreshToken: "test-refresh",
        expiresIn: 900000,
        user: {
          id: "customer-1",
          firstName: "Ana",
          lastName: "Prueba",
          email: "qa@example.test",
          phone: null,
          role: "CUSTOMER",
          active: true,
        },
      };
    else if (path === "/marketplace/categories")
      body = [{ id: "c1", name: "Moda" }];
    else if (path === "/products")
      body = pageOf(
        url.searchParams.get("search") === "inexistente" ? [] : [product],
      );
    else if (path === "/products/p1") body = product;
    else if (path === "/establishments")
      body = pageOf([{ id: "s1", name: "Tienda de prueba", active: true }]);
    else if (path === "/points/balance")
      body = { balance: 183, tier: "SILVER" };
    else if (path === "/points/rules/active")
      body = { rate: 1, multiplier: 1, bonus: 0 };
    else if (path === "/loyalty/visits/me")
      body = { enabled: true, awardedToday: false };
    else if (path === "/points/history")
      body = pageOf([
        {
          id: "m1",
          points: 10,
          description: "Compra confirmada de prueba",
          createdAt: "2026-10-03T12:00:00Z",
        },
      ]);
    else if (path === "/points/rewards")
      body = pageOf([
        {
          id: "r1",
          name: "Café de prueba",
          description: "Solo pruebas",
          pointsRequired: 50,
          stock: 3,
          active: true,
        },
      ]);
    else if (path === "/points/redemptions" || path === "/orders")
      body = pageOf([]);
    else if (path === "/loyalty/me") body = { cards: [] };
    else if (path === "/notifications")
      body = [
        {
          id: "n1",
          title: "Pedido listo",
          description: "Puedes recoger tu compra.",
          date: "2026-10-03T12:00:00Z",
          read: false,
        },
      ];
    else if (path === "/points/qr")
      body = { payload: "PASEO:TEST-ONLY", publicCode: "TEST-ONLY" };
    else if (path === "/auth/logout") body = {};
    else
      return route.fulfill({
        status: 404,
        json: { message: "Ruta no preparada en esta prueba: " + path },
      });
    await route.fulfill({
      json: body,
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return { writes, errors };
}
async function login(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("OnlyTesting123!");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).not.toHaveURL(/login/);
}

test("catálogo, búsqueda vacía y bolsa conservada al iniciar sesión", async ({
  page,
}) => {
  const { errors } = await setup(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Camisa de prueba, Bs 289,00" })
    .click();
  await page.getByRole("button", { name: "Añadir a mi bolsa" }).click();
  await page.getByRole("button", { name: "Ver mi bolsa" }).click();
  await expect(page.getByText("1 unidades")).toBeVisible();
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("qa@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("OnlyTesting123!");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar pedido para recoger" }),
  ).toBeVisible();
  await expect(page.getByText("1 unidades")).toBeVisible();
  expect(errors).toEqual([]);
});

test("puntos, QR y notificaciones respetan el contrato del backend", async ({
  page,
}) => {
  const { errors } = await setup(page);
  await login(page);
  await page.getByRole("tab", { name: "Puntos" }).click();
  await expect(page.getByText("183", { exact: true })).toBeVisible();
  await expect(page.getByText("Compra confirmada de prueba")).toBeVisible();
  await page.screenshot({
    path: "test-results/puntos-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Mi QR personal", exact: true })
    .click();
  await expect(page.getByText("TEST-ONLY", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("tab", { name: "Mi perfil" }).click();
  await page.getByRole("button", { name: "Notificaciones" }).click();
  await expect(page.getByText("Puedes recoger tu compra.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("pedido incierto bloquea un segundo envío incluso al volver", async ({
  page,
}) => {
  await setup(page);
  let orders = 0;
  await page.route("**/api/v1/orders", (r) => {
    orders++;
    return r.fulfill({
      status: 503,
      json: { message: "Conexión interrumpida" },
    });
  });
  await login(page);
  await page
    .getByRole("button", { name: "Camisa de prueba, Bs 289,00" })
    .click();
  await page.getByRole("button", { name: "Añadir a mi bolsa" }).click();
  await page.getByRole("button", { name: "Ver mi bolsa" }).click();
  await page
    .getByRole("button", { name: "Confirmar pedido para recoger" })
    .click();
  await expect(page.getByText(/No sabemos si el pedido/)).toBeVisible();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("button", { name: "Ver mi bolsa" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar pedido para recoger" }),
  ).toHaveCount(0);
  expect(orders).toBe(1);
});

test("canjear pide confirmación y no reintenta al fallar", async ({ page }) => {
  await setup(page);
  let count = 0;
  await page.route("**/api/v1/points/rewards/redeem", (r) => {
    count++;
    return r.fulfill({
      status: 503,
      json: { message: "Conexión interrumpida" },
    });
  });
  await login(page);
  await page.getByRole("tab", { name: "Puntos" }).click();
  await page.getByRole("button", { name: "Canjear", exact: true }).click();
  await page.getByRole("button", { name: "Elegir recompensa" }).click();
  expect(count).toBe(0);
  await page.getByRole("button", { name: "Canjear por 50 puntos" }).click();
  await expect(
    page.getByRole("button", { name: "Canjear por 50 puntos" }),
  ).toBeDisabled();
  expect(count).toBe(1);
});

for (const width of [360, 768])
  test(`navegación y diseño sin desborde a ${width}px`, async ({ page }) => {
    const { errors } = await setup(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Camisa de prueba, Bs 289,00" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("tab", { name: "Mi perfil" }).click();
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

test("el pedido se crea sin acreditar puntos en el cliente", async ({
  page,
}) => {
  await setup(page);
  let submitted: unknown;
  const orders: unknown[] = [];
  await page.route("**/api/v1/orders*", async (r) => {
    if (r.request().method() === "POST") {
      submitted = r.request().postDataJSON();
      orders.push({
        id: "order-1",
        orderNumber: "PA-QA",
        establishmentName: "Tienda de prueba",
        totalCentavos: 28900,
        orderStatus: "RECEIVED",
        paymentStatus: "PENDING",
        items: [{ productId: "p1", productName: product.name, quantity: 1 }],
        createdAt: "2026-10-03T12:00:00Z",
      });
      return r.fulfill({ json: orders[0] });
    }
    return r.fulfill({ json: pageOf(orders) });
  });
  await login(page);
  await page
    .getByRole("button", { name: "Camisa de prueba, Bs 289,00" })
    .click();
  await page.getByRole("button", { name: "Añadir a mi bolsa" }).click();
  await page.getByRole("button", { name: "Ver mi bolsa" }).click();
  await page
    .getByRole("button", { name: "Confirmar pedido para recoger" })
    .click();
  await expect(page.getByText("Pago: pendiente de confirmar")).toBeVisible();
  expect(submitted).toMatchObject({
    establishmentId: "s1",
    items: [{ productId: "p1", quantity: 1 }],
  });
  expect(submitted).not.toHaveProperty("points");
  expect(submitted).not.toHaveProperty("totalCentavos");
  await expect(
    page.getByRole("button", { name: "Ya llegué a la tienda" }),
  ).toHaveCount(0);
});

test("abrir una etiqueta requiere solicitar y confirmar la visita", async ({
  page,
}) => {
  await setup(page);
  let issued = 0;
  let confirmed = false;
  const visit = {
    id: "v1",
    code: "PASEO:VISIT:test-only",
    establishmentName: "Entrada de prueba",
    status: "PENDING",
    expiresAt: "2026-10-03T12:10:00Z",
    credit: null,
  };
  await page.route("**/api/v1/loyalty/visits/tag", (r) => {
    issued++;
    return r.fulfill({ json: visit });
  });
  await page.route("**/api/v1/loyalty/visits/requests/v1", (r) =>
    r.fulfill({
      json: confirmed
        ? {
            ...visit,
            status: "CONFIRMED",
            credit: { balance: 184, alreadyProcessed: false },
          }
        : visit,
    }),
  );
  await login(page);
  await page.getByRole("tab", { name: "Puntos" }).click();
  await page.getByRole("button", { name: "Ganar", exact: true }).click();
  await page
    .getByLabel("Código o enlace")
    .fill("paseoaranjuez://visita/" + "a".repeat(32));
  await page.getByRole("button", { name: "Consultar código" }).click();
  await expect(
    page.getByRole("button", { name: "Generar solicitud de visita" }),
  ).toBeVisible();
  expect(issued).toBe(0);
  await page
    .getByRole("button", { name: "Generar solicitud de visita" })
    .click();
  await expect(
    page.getByText("Esperando confirmación del personal…"),
  ).toBeVisible();
  confirmed = true;
  await expect(page.getByText("Visita confirmada: +1 punto.")).toBeVisible({
    timeout: 10000,
  });
  expect(issued).toBe(1);
});

test("la búsqueda muestra un vacío real y cerrar sesión limpia la bolsa", async ({
  page,
}) => {
  await setup(page);
  await login(page);
  await page.getByLabel("Buscar productos").fill("inexistente");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByText("No hay productos disponibles con estos filtros."),
  ).toBeVisible();
  await page.getByLabel("Buscar productos").fill("");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page
    .getByRole("button", { name: "Camisa de prueba, Bs 289,00" })
    .click();
  await page.getByRole("button", { name: "Añadir a mi bolsa" }).click();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.getByRole("tab", { name: "Mi perfil" }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bolsa, 0 productos" }).click();
  await expect(
    page.getByText(
      "Tu bolsa está vacía. Descubre algo que te guste en PaseoYa.",
    ),
  ).toBeVisible();
});

test("NFC en la vista web explica la limitación sin acreditar puntos", async ({
  page,
}) => {
  const { writes } = await setup(page);
  await login(page);
  await page.getByRole("tab", { name: "Puntos" }).click();
  await page.getByRole("button", { name: "Ganar", exact: true }).click();
  await page.getByRole("button", { name: "Leer NFC", exact: true }).click();
  await expect(
    page.getByText(
      "La lectura NFC necesita la app instalada en un teléfono compatible. Usa el QR en la vista web.",
    ),
  ).toBeVisible();
  expect(writes).toEqual(["/auth/login"]);
});
