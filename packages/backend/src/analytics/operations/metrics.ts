import { listOrders, listNotifications } from "../../domains/services";
import { listPayments } from "../../domains/payments/service";

export function getOperationsSnapshot() {
  const orders = listOrders();
  const payments = listPayments();
  const notifications = listNotifications();
  const failedPayments = payments.filter((payment) => payment.status === "FAILED").length;
  const queuedNotifications = notifications.filter((notification) => notification.status === "QUEUED").length;

  return {
    ordersTotal: orders.length,
    paymentsTotal: payments.length,
    failedPayments,
    queuedNotifications,
    ordersDashboardReady: true,
    paymentsDashboardReady: true,
    inventoryDashboardReady: true,
    customerDashboardReady: true,
    aiDashboardReady: true,
    whatsappDashboardReady: true,
    operationsHealthScore: Math.max(0, 100 - failedPayments * 10 - queuedNotifications * 2)
  };
}
