/**
 * main.js
 *
 * Application entry point.
 * Sets up Vue app, registers Vue Router, registers the custom
 * v-highlight-urgency directive globally, and imports Bootstrap.
 */

import { createApp } from 'vue'
import './styles/global.css'
import App from './App.vue'
import router from './router/index.js'
import { vHighlightUrgency } from './directives/highlightUrgency.js'
import OfflineIndicator from './components/OfflineIndicator.vue'
import CookieConsent from './components/CookieConsent.vue'

// Bootstrap CSS and JS bundle (includes Popper for dropdowns/modals)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/bootstrap-icons-subset.css'

const app = createApp(App)

// Register custom directive globally so all components can use v-highlight-urgency
app.directive('highlight-urgency', vHighlightUrgency)

// Register global components
app.component('OfflineIndicator', OfflineIndicator)
app.component('CookieConsent', CookieConsent)

app.use(router)
import { initFirebase } from './firebase.js'

initFirebase().then(() => {
  app.mount('#app')
})
