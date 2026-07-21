/**
 * main.js
 *
 * Application entry point.
 * Sets up Vue app, registers Vue Router, registers the custom
 * v-highlight-urgency directive globally, and imports Bootstrap.
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { vHighlightUrgency } from './directives/highlightUrgency.js'

// Bootstrap CSS and JS bundle (includes Popper for dropdowns/modals)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)

// Register custom directive globally so all components can use v-highlight-urgency
app.directive('highlight-urgency', vHighlightUrgency)

app.use(router)
app.mount('#app')
