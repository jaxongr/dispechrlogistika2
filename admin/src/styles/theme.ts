import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#FC3F1D', // Yandex red
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    colorText: '#1A1A1A',
    colorTextSecondary: '#666666',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: {
      siderBg: '#1B1B1B',
      headerBg: '#FFFFFF',
    },
    Menu: {
      darkItemBg: '#1B1B1B',
      darkItemSelectedBg: '#FC3F1D',
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#FC3F1D',
    colorBgContainer: '#1E1E1E',
    colorBgLayout: '#141414',
    colorText: '#E0E0E0',
    colorTextSecondary: '#999999',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: {
      siderBg: '#0A0A0A',
      headerBg: '#1E1E1E',
    },
    Menu: {
      darkItemBg: '#0A0A0A',
      darkItemSelectedBg: '#FC3F1D',
    },
  },
};
