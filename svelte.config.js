const scss = require('svelte-preprocess/dist/processors/scss')

// config file needed for VSCode language server
// without this, it will complain about scss & unused js labels
module.exports = {
  compilerOptions: {
    dev: false,
    customElement: true,
  },
  preprocess: [scss.default({})],
}
