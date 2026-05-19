const { scryptSync } = require("node:crypto");

const FOOD_CATALOG = [
  { id: "food-double-burger", price: 16500 },
  { id: "food-big-cheese", price: 18900 },
  { id: "food-spicy-chicken", price: 16900 },
  { id: "food-bacon-deluxe", price: 20900 },
  { id: "food-cheesy-fries", price: 9900 },
  { id: "food-chicken-nuggets", price: 8900 },
  { id: "food-coca-cola", price: 3000 },
  { id: "food-garlic-aioli", price: 2500 },
  { id: "food-margherita-pizza", price: 14900 },
  { id: "food-caesar-salad", price: 12900 },
  { id: "food-truffle-smash", price: 19800 },
  { id: "food-volcano-chicken", price: 17600 },
  { id: "food-black-pepper-bacon", price: 21800 },
  { id: "food-midnight-umami-combo", price: 24900 },
  { id: "food-firehouse-combo", price: 26900 },
  { id: "food-loaded-fries", price: 11900 },
  { id: "food-popcorn-chicken", price: 10900 },
  { id: "food-cherry-cola-float", price: 4900 },
];

const DISTRICTS = [
  { district: "Sukhbaatar", khoroo: "1-r khoroo", lat: 47.9189, lng: 106.9176 },
  { district: "Chingeltei", khoroo: "3-r khoroo", lat: 47.9244, lng: 106.9057 },
  { district: "Bayanzurkh", khoroo: "26-r khoroo", lat: 47.9215, lng: 106.9342 },
  { district: "Khan-Uul", khoroo: "15-r khoroo", lat: 47.8924, lng: 106.9152 },
  { district: "Bayangol", khoroo: "12-r khoroo", lat: 47.9153, lng: 106.8747 },
  { district: "Songinokhairkhan", khoroo: "18-r khoroo", lat: 47.9132, lng: 106.8224 },
];

const CUSTOMERS = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `user-seed-customer-${number}`,
    email: `customer${number}@burger.mn`,
    name: `Seed Customer ${number}`,
    password: "Customer123456",
    phone: `+976 9900 ${String(1100 + index).slice(-4)}`,
    salt: `seed-customer-${number}`,
  };
});

const STAFF_USERS = [
  {
    id: "user-seed-admin",
    email: "admin@burger.mn",
    name: "Burger Admin",
    password: "Admin123456",
    phone: null,
    role: "ADMIN",
    salt: "seed-admin",
  },
  {
    id: "user-seed-manager",
    email: "manager@burger.mn",
    name: "Kitchen Manager",
    password: "Manager123456",
    phone: "+976 9911 3344",
    role: "MANAGER",
    salt: "seed-manager",
  },
  {
    id: "user-seed-courier",
    email: "courier@burger.mn",
    name: "Night Courier",
    password: "Courier123456",
    phone: "+976 9911 2233",
    role: "COURIER",
    salt: "seed-courier",
  },
];

const STATUSES = [
  ...Array.from({ length: 20 }, () => "PENDING"),
  ...Array.from({ length: 20 }, () => "CONFIRMED"),
  ...Array.from({ length: 15 }, () => "COOKING"),
  ...Array.from({ length: 15 }, () => "DELIVERING"),
  ...Array.from({ length: 24 }, () => "DELIVERED"),
  ...Array.from({ length: 5 }, () => "CANCELLED"),
];

function sqlEscape(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function sqlString(value) {
  if (value == null) {
    return "NULL";
  }

  return `'${sqlEscape(value)}'`;
}

function sqlDate(value) {
  if (!value) {
    return "NULL";
  }

  const iso = new Date(value).toISOString().slice(0, 19).replace("T", " ");
  return sqlString(iso);
}

function hashPassword(password, salt) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function shiftDate(base, minutes) {
  return new Date(base.getTime() + minutes * 60_000);
}

function getOrderStatus(index) {
  return STATUSES[index - 1];
}

function getPaymentMethod(index) {
  const methods = ["QPAY", "CARD", "CASH"];
  return methods[(index - 1) % methods.length];
}

function getPaymentStatus(status, method, index) {
  if (status === "CANCELLED") {
    return index % 2 === 0 ? "FAILED" : "REFUNDED";
  }

  if (status === "DELIVERED") {
    return "PAID";
  }

  if (status === "DELIVERING") {
    return method === "CASH" ? "PENDING" : "PAID";
  }

  if (status === "CONFIRMED" || status === "COOKING") {
    return method === "CASH" && index % 4 === 0 ? "PENDING" : "PAID";
  }

  return "PENDING";
}

function getTrackingStatus(status) {
  if (status === "DELIVERED") {
    return "DELIVERED";
  }

  if (status === "DELIVERING") {
    return "ON_THE_WAY";
  }

  if (status === "PENDING" || status === "CONFIRMED" || status === "COOKING") {
    return "PREPARING";
  }

  return null;
}

function getFoodItems(index) {
  const itemCount = (index % 3) + 1;
  const items = [];
  const used = new Set();

  for (let offset = 0; offset < itemCount; offset += 1) {
    let cursor = (index * 2 + offset * 5) % FOOD_CATALOG.length;

    while (used.has(cursor)) {
      cursor = (cursor + 1) % FOOD_CATALOG.length;
    }

    used.add(cursor);

    const food = FOOD_CATALOG[cursor];
    const quantity = ((index + offset) % 2) + 1;

    items.push({
      foodCategory: food.category,
      foodId: food.id,
      foodImage: food.image,
      foodName: food.name,
      price: food.price,
      quantity,
    });
  }

  return items;
}

function buildUsersInsert() {
  const customerRows = CUSTOMERS.map((customer) => `(
    ${sqlString(customer.id)},
    ${sqlString(customer.name)},
    ${sqlString(customer.email)},
    ${sqlString(hashPassword(customer.password, customer.salt))},
    ${sqlString(customer.phone)},
    'CUSTOMER',
    NOW()
  )`);

  const staffRows = STAFF_USERS.map((user) => `(
    ${sqlString(user.id)},
    ${sqlString(user.name)},
    ${sqlString(user.email)},
    ${sqlString(hashPassword(user.password, user.salt))},
    ${sqlString(user.phone)},
    ${sqlString(user.role)},
    NOW()
  )`);

  return `
INSERT INTO \`User\` (\`id\`, \`name\`, \`email\`, \`password\`, \`phone\`, \`role\`, \`createdAt\`)
VALUES
${[...staffRows, ...customerRows].join(",\n")}
ON DUPLICATE KEY UPDATE
  \`name\` = VALUES(\`name\`),
  \`password\` = VALUES(\`password\`),
  \`phone\` = VALUES(\`phone\`),
  \`role\` = VALUES(\`role\`);
`;
}

function buildUserSettingsInsert() {
  const rows = CUSTOMERS.map((customer, index) => {
    const preferredPaymentMethod = ["QPAY", "CARD", "CASH"][index % 3];

    return `(
      ${sqlString(`user-settings-${String(index + 1).padStart(2, "0")}`)},
      ${sqlString(customer.id)},
      TRUE,
      ${sqlString(preferredPaymentMethod)},
      NOW(),
      NOW()
    )`;
  });

  return `
INSERT INTO \`UserSettings\` (\`id\`, \`userId\`, \`notificationsEnabled\`, \`preferredPaymentMethod\`, \`createdAt\`, \`updatedAt\`)
VALUES
${rows.join(",\n")}
ON DUPLICATE KEY UPDATE
  \`notificationsEnabled\` = VALUES(\`notificationsEnabled\`),
  \`preferredPaymentMethod\` = VALUES(\`preferredPaymentMethod\`),
  \`updatedAt\` = VALUES(\`updatedAt\`);
`;
}

function buildOrderSql() {
  const orderRows = [];
  const itemRows = [];
  const paymentRows = [];
  const trackingRows = [];

  for (let index = 1; index <= 99; index += 1) {
    const orderNumber = String(index).padStart(3, "0");
    const customer = CUSTOMERS[(index - 1) % CUSTOMERS.length];
    const district = DISTRICTS[(index - 1) % DISTRICTS.length];
    const status = getOrderStatus(index);
    const method = getPaymentMethod(index);
    const paymentStatus = getPaymentStatus(status, method, index);
    const trackingStatus = getTrackingStatus(status);
    const items = getFoodItems(index);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date(Date.UTC(2026, 4, 1, 8, 0, 0));
    createdAt.setUTCDate(createdAt.getUTCDate() + ((index - 1) % 11));
    createdAt.setUTCMinutes(createdAt.getUTCMinutes() + index * 19);

    const acceptedAt = status === "PENDING" || status === "CANCELLED"
      ? null
      : shiftDate(createdAt, 8 + (index % 6));
    const readyForCourierAt = status === "DELIVERING" || status === "DELIVERED"
      ? shiftDate(createdAt, 24 + (index % 8))
      : null;
    const deliveredAt = status === "DELIVERED"
      ? shiftDate(createdAt, 55 + (index % 10))
      : null;
    const cancelledAt = status === "CANCELLED"
      ? shiftDate(createdAt, 17 + (index % 9))
      : null;
    const paidAt = paymentStatus === "PAID"
      ? shiftDate(createdAt, status === "DELIVERED" ? 48 : 12)
      : null;
    const failedAt = paymentStatus === "FAILED" ? shiftDate(createdAt, 14) : null;
    const refundedAt = paymentStatus === "REFUNDED" ? shiftDate(createdAt, 22) : null;
    const courierId = status === "DELIVERING" || status === "DELIVERED"
      ? "user-seed-courier"
      : null;
    const latitudeBase = district.lat + ((index % 5) * 0.0013);
    const longitudeBase = district.lng + ((index % 7) * 0.0011);
    const address = `${district.district} district, ${district.khoroo}, Peace Avenue ${(20 + index)}`;
    const addressLabel = index % 4 === 0 ? "Office" : "Home";
    const addressUnit = `${(index % 9) + 1}-${(index % 14) + 10}`;
    const addressNotes = index % 5 === 0
      ? "Ring the bell once and leave at the glass door."
      : "Please call on arrival.";
    const providerReference = method === "CASH"
      ? null
      : `BGR-${method}-SEED-${orderNumber}`;
    const providerPayload = JSON.stringify({
      seed: true,
      orderNumber,
      imageQuality: "high",
      method,
      status: paymentStatus,
    });
    const cancelReason = status === "CANCELLED"
      ? (paymentStatus === "FAILED"
        ? "Payment provider declined the transaction."
        : "Customer requested a refund before dispatch.")
      : null;
    const failureReason = paymentStatus === "FAILED"
      ? "Seeded as failed payment for dashboard coverage."
      : paymentStatus === "REFUNDED"
        ? "Seeded as refunded payment for dashboard coverage."
        : null;

    orderRows.push(`(
      ${sqlString(`order-seed-${orderNumber}`)},
      ${sqlString(customer.id)},
      ${sqlString(courierId)},
      ${sqlString(status)},
      ${totalPrice},
      ${sqlString(address)},
      ${sqlString(addressLabel)},
      ${sqlString(district.district)},
      ${sqlString(district.khoroo)},
      ${sqlString(addressUnit)},
      ${latitudeBase.toFixed(6)},
      ${longitudeBase.toFixed(6)},
      ${sqlString(addressNotes)},
      ${sqlString(customer.phone)},
      ${sqlDate(acceptedAt)},
      ${sqlDate(readyForCourierAt)},
      ${sqlDate(deliveredAt)},
      ${sqlDate(cancelledAt)},
      ${sqlString(cancelReason)},
      ${sqlDate(createdAt)}
    )`);

    items.forEach((item, itemIndex) => {
      itemRows.push(`(
        ${sqlString(`order-item-seed-${orderNumber}-${itemIndex + 1}`)},
        ${sqlString(`order-seed-${orderNumber}`)},
        ${sqlString(item.foodId)},
        ${sqlString(item.foodName)},
        ${sqlString(item.foodImage)},
        ${sqlString(item.foodCategory)},
        ${item.quantity},
        ${item.price}
      )`);
    });

    paymentRows.push(`(
      ${sqlString(`payment-seed-${orderNumber}`)},
      ${sqlString(`order-seed-${orderNumber}`)},
      ${sqlString(method)},
      ${sqlString(paymentStatus)},
      ${sqlString(providerReference)},
      ${sqlString(providerPayload)},
      ${sqlDate(paidAt)},
      ${sqlDate(failedAt)},
      ${sqlDate(refundedAt)},
      ${sqlString(failureReason)},
      ${sqlDate(createdAt)}
    )`);

    if (trackingStatus) {
      trackingRows.push(`(
        ${sqlString(`tracking-seed-${orderNumber}`)},
        ${sqlString(`order-seed-${orderNumber}`)},
        ${sqlString(trackingStatus)},
        ${trackingStatus === "PREPARING" ? "NULL" : (latitudeBase + 0.0042).toFixed(6)},
        ${trackingStatus === "PREPARING" ? "NULL" : (longitudeBase + 0.0038).toFixed(6)},
        ${sqlDate(deliveredAt ?? readyForCourierAt ?? acceptedAt ?? createdAt)}
      )`);
    }
  }

  return `
DELETE FROM \`Tracking\` WHERE \`id\` LIKE 'tracking-seed-%';
DELETE FROM \`Payment\` WHERE \`id\` LIKE 'payment-seed-%';
DELETE FROM \`OrderItem\` WHERE \`id\` LIKE 'order-item-seed-%';
DELETE FROM \`Order\` WHERE \`id\` LIKE 'order-seed-%';

INSERT INTO \`Order\` (
  \`id\`,
  \`userId\`,
  \`courierId\`,
  \`status\`,
  \`totalPrice\`,
  \`address\`,
  \`addressLabel\`,
  \`addressDistrict\`,
  \`addressKhoroo\`,
  \`addressUnit\`,
  \`addressLatitude\`,
  \`addressLongitude\`,
  \`addressNotes\`,
  \`contactPhone\`,
  \`acceptedAt\`,
  \`readyForCourierAt\`,
  \`deliveredAt\`,
  \`cancelledAt\`,
  \`cancelReason\`,
  \`createdAt\`
)
VALUES
${orderRows.join(",\n")}
;

INSERT INTO \`OrderItem\` (\`id\`, \`orderId\`, \`foodId\`, \`foodName\`, \`foodImage\`, \`foodCategory\`, \`quantity\`, \`price\`)
VALUES
${itemRows.join(",\n")}
;

INSERT INTO \`Payment\` (
  \`id\`,
  \`orderId\`,
  \`method\`,
  \`status\`,
  \`providerReference\`,
  \`providerPayload\`,
  \`paidAt\`,
  \`failedAt\`,
  \`refundedAt\`,
  \`failureReason\`,
  \`createdAt\`
)
VALUES
${paymentRows.join(",\n")}
;

INSERT INTO \`Tracking\` (\`id\`, \`orderId\`, \`status\`, \`latitude\`, \`longitude\`, \`updatedAt\`)
VALUES
${trackingRows.join(",\n")}
;
`;
}

const script = `
START TRANSACTION;
${buildUsersInsert()}
${buildUserSettingsInsert()}
${buildOrderSql()}
COMMIT;
`;

process.stdout.write(script);
