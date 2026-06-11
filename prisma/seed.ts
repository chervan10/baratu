import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mockVisitors = [
  {
    mobile: "Mobile",
    location: "Maputo, Mozambique",
    browser: "Chrome 125.0",
    sessionTime: 142,
    phoneSpec: "Android (Samsung Galaxy S23 Ultra | 1080x2340 @3x | 12GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
  {
    mobile: "Mobile",
    location: "Matola, Mozambique",
    browser: "Safari 17.4",
    sessionTime: 88,
    phoneSpec: "iOS (iPhone 14 Pro | 393x852 @3x | 6GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
  },
  {
    mobile: "Desktop",
    location: "Maputo, Mozambique",
    browser: "Chrome 126.0",
    sessionTime: 423,
    phoneSpec: "Windows 11 (Intel Core i7-13700H | 1920x1080 @1x | 16GB RAM | 14 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
  {
    mobile: "Mobile",
    location: "Maputo, Mozambique",
    browser: "Chrome Mobile 125.0",
    sessionTime: 215,
    phoneSpec: "Android (Xiaomi Redmi Note 12 | 1080x2400 @3x | 8GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
  {
    mobile: "Mobile",
    location: "Beira, Mozambique",
    browser: "Safari 17.5",
    sessionTime: 47,
    phoneSpec: "iOS (iPhone 15 Pro Max | 430x932 @3x | 8GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
  },
  {
    mobile: "Desktop",
    location: "Nampula, Mozambique",
    browser: "Firefox 126.0",
    sessionTime: 312,
    phoneSpec: "macOS Sonoma (Apple M2 Pro | 1728x1117 @2x | 16GB RAM | 10 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 600), // 10 hours ago
  },
  {
    mobile: "Mobile",
    location: "Maputo, Mozambique",
    browser: "Edge Mobile 125.0",
    sessionTime: 12,
    phoneSpec: "Android (Huawei P30 Lite | 1080x2312 @3x | 6GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 1440), // 1 day ago
  },
  {
    mobile: "Desktop",
    location: "Maputo, Mozambique",
    browser: "Firefox 125.0",
    sessionTime: 1105,
    phoneSpec: "Linux x86_64 (AMD Ryzen 5 5600X | 2560x1440 @1x | 32GB RAM | 12 Cores)",
    createdAt: new Date(Date.now() - 1000 * 60 * 2000), // ~1.4 days ago
  },
  {
    mobile: "Mobile",
    location: "Xai-Xai, Mozambique",
    browser: "Chrome Mobile 124.0",
    sessionTime: 340,
    phoneSpec: "Android (Samsung Galaxy A54 | 1080x2340 @3x | 8GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 3000), // ~2 days ago
  },
  {
    mobile: "Mobile",
    location: "Maputo, Mozambique",
    browser: "Opera Touch 73.0",
    sessionTime: 189,
    phoneSpec: "Android (Google Pixel 7a | 1080x2400 @3x | 8GB RAM)",
    createdAt: new Date(Date.now() - 1000 * 60 * 4000), // ~2.8 days ago
  },
];

async function main() {
  console.log("Seeding mock visitors data to database...");
  
  // Clear any existing visitors to keep it exactly at 10 for demonstration if needed, 
  // or simply insert them.
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
