/* *************************************************************************
  usage: update tailwind.config.js
  - clear existing fontFamily and fontWeight preflight defaults
  - add fontWeights object

    fontFamily: {},
    fontWeight: {},
    fontWeights: {
      lato: {
        family: ["Lato", ...defaultTheme.fontFamily.sans],
        weights: [300, 100, 400, 700, 900],
      },
      maharlika: {
        family: ["maharlika", ...defaultTheme.fontFamily.serif],
        weights: [400],
      },
      elite: {
        family: ["Special Elite", ...defaultTheme.fontFamily.serif],
        weights: [400],
      },
    },

************************************************************************* */

import plugin from 'tailwindcss/plugin';

export default plugin(({ addUtilities, theme }) => {
  const fontWeights = theme('fontWeights', {});
  const fontUtilities = {};

  Object.entries(fontWeights).forEach(([fontName, { family, weights }]) => {
    const defaultWeight = weights[0];

    weights.forEach((weight) => {
      const className = weight === defaultWeight ? `.font-${fontName.replace(/\s/g, '-')}` : `.font-${fontName.replace(/\s/g, '-')}-${weight}`;
      fontUtilities[className] = {
        'font-family': family.join(', '),
        'font-weight': weight,
      };
    });
  });

  addUtilities(fontUtilities, ['responsive', 'hover']);
});
