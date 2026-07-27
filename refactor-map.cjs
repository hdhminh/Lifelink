const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/LiveNetworkMap.vue');
let content = fs.readFileSync(filePath, 'utf8');

// Replace modals in template
const alertMessageEnd = content.indexOf('    />\n\n    <div>');
if (alertMessageEnd > -1) {
  content = content.substring(0, alertMessageEnd + 7) + 
            '\n    <!-- Confirmation Modals Component -->\n    <ConfirmationModals ref="modalsRef" :requests="requests" />\n\n    <div>' + 
            content.substring(alertMessageEnd + 17);
}

// Add import
content = content.replace(
  "import AlertMessage from '@/components/AlertMessage.vue'",
  "import AlertMessage from '@/components/AlertMessage.vue'\nimport ConfirmationModals from '@/components/ConfirmationModals.vue'"
);

// Add modalsRef
content = content.replace(
  "const mapRef = ref(null)",
  "const mapRef = ref(null)\nconst modalsRef = ref(null)"
);

// Replace handleRespond
content = content.replace(
  "function handleRespond(requestId) {\n  router.push({ path: '/emergency-board', query: { respond: requestId } })\n}",
  "function handleRespond(requestId) {\n  if (modalsRef.value) {\n    modalsRef.value.handleConfirm(requestId)\n  }\n}"
);

fs.writeFileSync(filePath, content);
console.log('Done refactoring LiveNetworkMap.vue');
