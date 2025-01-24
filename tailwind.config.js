const plugin = require('tailwindcss/plugin');

const colorConfig = {
  lightGrey: '#F5F7FA',
  almostWhite: '#FAFAFC',
  lightGrey2: 'rgba(17 5 22/.08)',
  gray: 'rgba(17 5 22/.40)',
  purple: '#943BF2',
  pink: '#FF3763',
  green: '#17DDA0',
  black: '#110516',
};

const typographyConfig = {
  '.text-h1': {
    font: "700 28px/47px 'Gilroy', sans-serif",
    '@media (max-width: 768px)': {
      fontSize: '28px',
      lineHeight: '39px',
    },
  },
  '.text-h2': {
    font: "600 22px/32px 'Gilroy', sans-serif",
    '@media (max-width: 768px)': {
      fontSize: '20px',
      lineHeight: '32px',
    },
  },
  '.text-h3': {
    font: "700 16px/24px 'Gilroy', sans-serif !important",
    '@media (max-width: 768px)': {
      fontSize: '15px !important',
      lineHeight: '27px !important',
    },
  },
  '.text-small': {
    font: "700 12px/20px 'Gilroy', sans-serif !important",
    '@media (max-width: 768px)': {
      fontSize: '15px !important',
      lineHeight: '27px !important',
    },
  },
  '.text-regular': {
    font: "400 14px/20px 'Gilroy', sans-serif !important",
    '@media (max-width: 768px)': {
      fontSize: '15px !important',
      lineHeight: '27px !important',
    },
  },
  '.text-large': {
    font: "500 18px/24px 'Gilroy', sans-serif !important",
    '@media (max-width: 768px)': {
      fontSize: '15px !important',
      lineHeight: '27px !important',
    },
  },
};

module.exports = {
  prefix: 'tw-',
  content: [
    './layout/*.liquid',
    './templates/*.liquid',
    './templates/customers/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
  ],
  theme: {
    screens: {
      tablet: '769px', // => @media (min-width: 768px) { ... }
      desktop: '1024px', // => @media (min-width: 1024px) { ... }
    },
    extend: {
      fontFamily: {
        gilroy: ['Gilroy', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '6px', // alias to md
        md: '6px',
        lg: '12px',
        xl: '16px',
        full: '50%',
      },
      spacing: {
        2: '2px',
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
        20: '20px',
        24: '24px',
        28: '28px',
        32: '32px',
        36: '36px',
        40: '40px',
        44: '44px',
        48: '48px',
        56: '56px',
        60: '60px',
        64: '64px',
        128: '128px',
        256: '256px',
      },
      borderColor: {
        'accent-purple': colorConfig.purple,
        lightGray: colorConfig.lightGrey2,
      },
      colors: {
        'accent-purple': colorConfig.purple,
        'accent-pink': colorConfig.pink,
        'accent-green': colorConfig.green,
        dark: colorConfig.black,
        text: {
          gray: colorConfig.gray,
          dark: colorConfig.black,
        },
        background: {
          light: colorConfig.almostWhite,
        },
        surface: {
          lightGrey: colorConfig.lightGrey,
        },
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents(typographyConfig);
    }),
  ],
};
