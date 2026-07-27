const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/EmergencyBoard.vue');
let content = fs.readFileSync(filePath, 'utf8');

// Replace modals in template
const templateStart = content.indexOf('<!-- Double Confirmation Modal for Donation -->');
const templateEnd = content.indexOf('<!-- Floating Tracking Status -->');
if (templateStart > -1 && templateEnd > -1) {
  content = content.substring(0, templateStart) + 
            '<!-- Confirmation Modals Component -->\n    <ConfirmationModals ref="modalsRef" :requests="requests" />\n\n    ' + 
            content.substring(templateEnd);
}

// Add import
content = content.replace(
  "import ConfirmModal from '@/components/ConfirmModal.vue'",
  "import ConfirmationModals from '@/components/ConfirmationModals.vue'"
);

// Add modalsRef
content = content.replace(
  "const route = useRoute()",
  "const route = useRoute()\nconst modalsRef = ref(null)"
);

// Remove modal states and functions CAREFULLY
const toRemove1 = content.substring(content.indexOf('const showMapsConfirmModal = ref(false)'), content.indexOf('const mapComponentRef = ref(null)'));
content = content.replace(toRemove1, 'function handleConfirm(requestId) {\n  if (modalsRef.value) {\n    modalsRef.value.handleConfirm(requestId)\n  }\n}\n\n');

const toRemove2 = content.substring(content.indexOf('const showConfirmDonationModal = ref(false)'), content.indexOf('const requestListContainer = ref(null)'));
content = content.replace(toRemove2, '');

fs.writeFileSync(filePath, content);
console.log('Done refactoring safely');
