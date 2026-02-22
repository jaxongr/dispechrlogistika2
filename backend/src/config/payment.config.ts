import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  click: {
    serviceId: process.env.CLICK_SERVICE_ID,
    merchantId: process.env.CLICK_MERCHANT_ID,
    secretKey: process.env.CLICK_SECRET_KEY,
  },
  payme: {
    merchantId: process.env.PAYME_MERCHANT_ID,
    merchantKey: process.env.PAYME_MERCHANT_KEY,
  },
  plans: {
    trial: { duration: 12 * 60 * 60 * 1000, price: 0 },
    daily: { duration: 24 * 60 * 60 * 1000, price: 5000 },
    weekly: { duration: 7 * 24 * 60 * 60 * 1000, price: 25000 },
    monthly: { duration: 30 * 24 * 60 * 60 * 1000, price: 70000 },
  },
}));
