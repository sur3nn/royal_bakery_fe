# Royal Sweets & Bakery - Frontend Application

Modern POS, Billing & ERP Frontend for Royal Sweets & Bakery, built with **React**, **TypeScript**, **Vite**, and **Redux Toolkit**.

---

## 🎨 Theme & Styling

- **Primary Rose**: `#C94F6D`
- **Dark Rose**: `#A83D58`
- **Soft Rose**: `#FCE7EC`
- **Cream Canvas**: `#FFF9F5`
- **Heritage Gold**: `#D9A441`
- **Borders**: `#EDE2E5`
- **Typography**: Plus Jakarta Sans & Outfit

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (or Node 20+)
- npm or yarn

### 2. Installation
```bash
cd royal-sweets-frontend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your backend API base URL:
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Running Local Development Server
```bash
npm run dev
```
The frontend will start at **http://localhost:5173**.

### 5. Production Build
```bash
npm run build
```
Outputs static files in `dist/` ready for deployment to Vercel, Netlify, Cloudflare Pages, AWS S3, or Nginx.

---

## 🏗️ Architecture & Communication Flow

- **Zero Direct Axios Calls in Components**: All API communication runs through typed Redux Toolkit `createAsyncThunk` actions (`FetchProductsAction`, `CreateSaleAction`, etc.).
- **Axios Client**: Centralized in `src/services/axiosFile.ts` respecting `import.meta.env.VITE_API_BASE_URL`.
- **State Management**: Redux store located in `src/redux/store.ts` with dedicated `bakerySlice`.
