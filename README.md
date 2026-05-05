# Crown Store

Crown Store is a frontend-first stock and ordering website for a fashion business that sells retail and wholesale wears for men, women, and kids.

## Stack

- React + Vite frontend

## Features

- Browse products with badges, favorites, featured picks, and low-stock alerts
- Choose simple size and color variants before adding items to cart
- Search, filter, and sort local product data
- Submit customer orders through WhatsApp with a cleaner order summary
- Persist cart, favorites, stock, settings, and local order history in `localStorage`
- Manage products, promotions, store settings, and backups locally at `/admin`
- Import and export store backups as JSON

## Frontend setup

1. Install packages inside `frontend`:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Optional: add a WhatsApp number in a `.env` file inside `frontend`:

```env
VITE_WHATSAPP_NUMBER=2348000000000
```

If you do not set one, the app falls back to the default number in `App.jsx`.

## Next ideas

- Move product data to a CMS or backendless service like Supabase
- Add payment integration
- Add multi-device sync for products and order history
