# Baratu - Project Manual

Welcome to the documentation for **Baratu**, the Maputo Grocery Route App! This manual provides an overview of how the project is structured, its core features, and the underlying technology stack.

## 1. Introduction

**Baratu** is a web-first application built to help residents of Maputo, Mozambique organize their "Dia de Rancho" (grocery shopping day). The app aggregates product prices across various markets in Maputo (such as Zimpeto, Xipamanine, and Shoprite) and helps users build an optimized, interactive shopping route to get the best prices.

## 2. Technology Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Styling:** Tailwind CSS for rapid, responsive design
- **Icons:** Lucide React
- **State Management:** React Context API (`RanchContext`)
- **Maps Integration:** Dynamic Leaflet/custom map components and Google Maps deep-linking

## 3. Project Structure

The project follows the standard Next.js App Router conventions:

- `src/app/`: Contains the main application pages and layouts.
- `src/components/`: Houses reusable UI components (like the interactive map).
- `src/context/`: Contains global state management providers (e.g., `RanchContext`).
- `src/data/`: Stores static mock data representing the database.
  - `produtos.js`: Contains the catalogue of grocery products and their prices at different markets.
  - `mercados.ts`: Contains the GPS coordinates for various Maputo markets (e.g., `[-25.836, 32.564]` for Zimpeto).

## 4. Key Features & Pages

### Home Page (`src/app/page.tsx`)
The entry point of the app. It features a hero section explaining the value proposition ("Encontra os Melhores Preços do Dia em Maputo") and showcases the "Destaques do Dia" (Highlights of the Day).

### Products Catalog (`src/app/produtos/`)
This section lists all available grocery items. Users can browse products, filter them by category (e.g., Mercearia, Frescos, Talho), search by name, and compare prices across different markets. When a user finds a good deal, they can add it to their "Route" (Cart).

### Route Planner (`src/app/rota/page.tsx`)
The core feature of Baratu. Once items are added to the route, this page:
1. **Groups Items by Market:** Automatically groups the selected products by their respective market locations.
2. **Calculates Costs:** Displays subtotals per market and the overall estimated total cost.
3. **Interactive Map:** Uses a dynamic map component (`MapWithNoSSR`) to visually display the markets the user needs to visit.
4. **Google Maps Integration:** Generates a dynamic Google Maps URL (e.g., `https://www.google.com/maps/dir/...`) with all the necessary waypoints, allowing the user to seamlessly follow the route on their phone.

## 5. State Management (RanchContext)

The application relies on `src/context/RanchContext.tsx` to manage the shopping cart globally. It provides the following core functionalities:
- `cart`: The current list of selected `RanchItem` objects.
- `addToRoute`: Adds a product from a specific market to the cart, preventing exact duplicates.
- `removeFromRoute`: Removes a specific item from a specific market.
- `clearRoute`: Empties the entire route.

The context wraps the application (likely in `src/app/layout.tsx`), ensuring that the user's route is preserved as they navigate between the Home, Products, and Route pages.

## 6. Development & Deployment

- **Running Locally:** Standard Next.js commands apply (`npm run dev`, `yarn dev`, etc.). The app will be available at `http://localhost:3000`.
- **Deployment:** The application is optimized for deployment on Vercel, which handles Next.js App Router features natively.
