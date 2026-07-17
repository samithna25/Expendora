import 'dotenv/config';
import app from './app.json';

export default {
  expo: {
    ...app.expo,
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    },
  },
};
