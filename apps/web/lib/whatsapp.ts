import { createOrderDraft, generateWhatsAppUrl, products } from "@salora/data";

const icedMatcha = products.find((product) => product.id === "iced-matcha-vanilla");
const saffronCake = products.find((product) => product.id === "saffron-milk-cake");

if (!icedMatcha || !saffronCake) {
  throw new Error("Featured WhatsApp products are missing from SALORA mock data.");
}

export const featuredWhatsAppUrl = generateWhatsAppUrl(
  createOrderDraft(
    {
      name: "Guest",
      phone: "00000000",
      orderType: "Counter",
      notes: "Please confirm today's SALORA availability."
    },
    [
      { product: icedMatcha, quantity: 1 },
      { product: saffronCake, quantity: 1 }
    ]
  )
);
