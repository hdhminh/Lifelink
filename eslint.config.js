import pluginVue from 'eslint-plugin-vue'
import vueConfigPrettier from '@vue/eslint-config-prettier'

export default [
  {
    files: ['**/*.{js,jsx,cjs,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-setup-props-reactivity-loss': 'warn'
    }
  },
  ...pluginVue.configs['flat/recommended'],
  vueConfigPrettier
]
