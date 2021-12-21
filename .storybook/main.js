module.exports = {
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-a11y'],
  features: {
    postcss: false,
    storyStoreV7: true,
  },
  framework: '@storybook/web-components',
}
