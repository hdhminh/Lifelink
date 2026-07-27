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

// Replace ConfirmModal import
content = content.replace(
  "import ConfirmModal from '@/components/ConfirmModal.vue'",
  "import ConfirmationModals from '@/components/ConfirmationModals.vue'"
);

// Add modalsRef
content = content.replace(
  "const route = useRoute()\nconst { getEnRouteCountForRequest } = useActiveResponses()",
  "const route = useRoute()\nconst modalsRef = ref(null)\nconst { getEnRouteCountForRequest } = useActiveResponses()"
);

// Remove useConfirmDonation, useGeolocation
content = content.replace(
  "const {\n  loading: confirmLoading,\n  confirmAvailability,\n  confirmGuestAvailability\n} = useConfirmDonation()\nconst { buildMapsUrl } = useGeolocation()",
  "const {\n  loading: confirmLoading\n} = useConfirmDonation()"
);

// Remove getGuestSession
content = content.replace(
  "const { getGuestSession, updateGuestSession } = useGuestSession()",
  "const { updateGuestSession } = useGuestSession()"
);

// Remove startTracking
content = content.replace(
  "const { isTracking, startTracking, stopTracking, markArrived } = useLocationTracking()",
  "const { isTracking, stopTracking, markArrived } = useLocationTracking()"
);

// Remove modal states and functions
const scriptStart = content.indexOf('const showMapsConfirmModal = ref(false)');
const scriptEnd = content.indexOf('const requestListContainer = ref(null)');
if (scriptStart > -1 && scriptEnd > -1) {
  content = content.substring(0, scriptStart) + 
            'function handleConfirm(requestId) {\n  if (modalsRef.value) {\n    modalsRef.value.handleConfirm(requestId)\n  }\n}\n\n' + 
            content.substring(scriptEnd);
}

fs.writeFileSync(filePath, content);
console.log('Done refactoring EmergencyBoard.vue');
