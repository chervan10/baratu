const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const mockVisitors = [
  {
    mobile: "Mobile",
    location: "Gaza, Mozambique",
    browser: "Samsung Internet 23.0",
    sessionTime: 65,
    phoneSpec: "Android 13 (Samsung Galaxy A34 | 1080x2340 @3x | 6GB RAM | 8 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
  },
  {
    mobile: "Mobile",
    location: "Inhambane, Mozambique",
    browser: "Opera Mobile 76.0",
    sessionTime: 195,
    phoneSpec: "Android 12 (Xiaomi Redmi Note 11 | 1080x2400 @3x | 4GB RAM | 8 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
  },
  {
    mobile: "Desktop",
    location: "Sofala, Mozambique",
    browser: "Brave 1.65.114",
    sessionTime: 512,
    phoneSpec: "Linux x86_64 (Intel Core i5-11400 | 1920x1080 @1x | 16GB RAM | 6 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 75), // 1.25 hours ago
  },
  {
    mobile: "Mobile",
    location: "Tete, Mozambique",
    browser: "Brave Mobile 1.65",
    sessionTime: 340,
    phoneSpec: "Android 14 (Google Pixel 8 Pro | 1344x2992 @3x | 12GB RAM | 9 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    mobile: "Mobile",
    location: "Zambezia, Mozambique",
    browser: "DuckDuckGo 7.73.1",
    sessionTime: 48,
    phoneSpec: "iOS (iPhone SE 3rd Gen | 375x667 @2x | 4GB RAM | 6 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 250), // ~4 hours ago
  },
  {
    mobile: "Desktop",
    location: "Cabo Delgado, Mozambique",
    browser: "Vivaldi 6.7.3",
    sessionTime: 890,
    phoneSpec: "Windows 11 (AMD Ryzen 9 7900X | 3840x2160 @1x | 64GB RAM | 12 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 500), // ~8 hours ago
  },
  {
    mobile: "Mobile",
    location: "Niassa, Mozambique",
    browser: "Chrome Mobile 126.0",
    sessionTime: 22,
    phoneSpec: "Android 11 (Tecno Spark 8C | 720x1612 @2x | 3GB RAM | 4 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 1200), // 20 hours ago
  },
  {
    mobile: "Desktop",
    location: "Manica, Mozambique",
    browser: "Safari 17.0",
    sessionTime: 120,
    phoneSpec: "macOS Sonoma (Mac Studio M2 Ultra | 5120x2880 @2x | 128GB RAM | 24 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 1800), // 30 hours ago
  },
  {
    mobile: "Mobile",
    location: "Maputo Province, Mozambique",
    browser: "Firefox Focus 125.0",
    sessionTime: 712,
    phoneSpec: "iOS (iPad Pro 11-inch | 834x1194 @2x | 8GB RAM | 8 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 2800), // ~2 days ago
  },
  {
    mobile: "Desktop",
    location: "Lisbon, Portugal",
    browser: "Arc 1.45.0",
    sessionTime: 1045,
    phoneSpec: "macOS Sequoia (MacBook Air M3 | 2560x1664 @2x | 16GB RAM | 8 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 3800), // ~2.6 days ago
  },
];

async function main() {
  console.log("Seeding mock visitors data to database...");
  
  // Clear any existing visitors
  await prisma.visitor.deleteMany({});
  
  for (const visitor of mockVisitors) {
    const created = await prisma.visitor.create({
      data: visitor,
    });
    console.log(`Created visitor session from ${created.location} on ${created.mobile}`);
  }

  console.log("Database seeded successfully with 10 mock visitor records!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
