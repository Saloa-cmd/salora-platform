import { incrementMetric } from "../runtime/metrics";
import { publishDomainEvent } from "./events";
import type { CustomerInput, InventoryInput, LoyaltyInput, NotificationInput, OrderInput, ProductInput } from "./schemas";

const store = {
  customers: [] as Array<CustomerInput & { id: string; createdAt: string }>,
  products: [] as Array<ProductInput & { id: string; status: "ACTIVE"; createdAt: string }>,
  orders: [] as Array<OrderInput & { id: string; status: "PLACED"; subtotal: number; total: number; createdAt: string }>,
  inventory: [] as Array<InventoryInput & { id: string; createdAt: string }>,
  loyalty: [] as Array<LoyaltyInput & { id: string; createdAt: string }>,
  notifications: [] as Array<NotificationInput & { id: string; status: "QUEUED"; createdAt: string }>
};

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export function createCustomer(input: CustomerInput) {
  const customer = { ...input, id: id(), createdAt: now() };
  store.customers.push(customer);
  incrementMetric("salora_customers_created_total");
  publishDomainEvent({ name: "CustomerRegistered", aggregateId: customer.id, aggregateType: "CustomerProfile", payload: { email: customer.email } });
  return customer;
}

export function listCustomers() {
  return [...store.customers];
}

export function createProduct(input: ProductInput) {
  const product = { ...input, id: id(), status: "ACTIVE" as const, createdAt: now() };
  store.products.push(product);
  incrementMetric("salora_products_created_total");
  publishDomainEvent({ name: "ProductCreated", aggregateId: product.id, aggregateType: "CatalogProduct", payload: { slug: product.slug } });
  return product;
}

export function listProducts() {
  return [...store.products];
}

export function createOrder(input: OrderInput) {
  const subtotal = input.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const order = { ...input, id: id(), status: "PLACED" as const, subtotal, total: subtotal, createdAt: now() };
  store.orders.push(order);
  incrementMetric("salora_orders_created_total");
  publishDomainEvent({ name: "OrderCreated", aggregateId: order.id, aggregateType: "CafeOrder", payload: { total: order.total } });
  return order;
}

export function listOrders() {
  return [...store.orders];
}

export function recordInventoryMovement(input: InventoryInput) {
  const movement = { ...input, id: id(), createdAt: now() };
  store.inventory.push(movement);
  if (input.quantity <= input.reorderThreshold) {
    publishDomainEvent({ name: "InventoryLow", aggregateId: movement.id, aggregateType: "Ingredient", payload: { ingredientName: input.ingredientName } });
  }
  incrementMetric("salora_inventory_movements_total");
  return movement;
}

export function listInventoryMovements() {
  return [...store.inventory];
}

export function awardLoyaltyPoints(input: LoyaltyInput) {
  const entry = { ...input, id: id(), createdAt: now() };
  store.loyalty.push(entry);
  incrementMetric("salora_loyalty_entries_total");
  publishDomainEvent({ name: "PointsAwarded", aggregateId: entry.customerId, aggregateType: "LoyaltyAccount", payload: { points: entry.points } });
  return entry;
}

export function listLoyaltyEntries() {
  return [...store.loyalty];
}

export function queueNotification(input: NotificationInput) {
  const notification = { ...input, id: id(), status: "QUEUED" as const, createdAt: now() };
  store.notifications.push(notification);
  incrementMetric("salora_notifications_queued_total");
  publishDomainEvent({ name: "NotificationQueued", aggregateId: notification.id, aggregateType: "Notification", payload: { channel: input.channel } });
  return notification;
}

export function listNotifications() {
  return [...store.notifications];
}
