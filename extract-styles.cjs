const fs = require('fs');
const glob = require('glob'); // Not needed if we hardcode files

const files = [
  'src/App.vue',
  'src/components/SupportChatWidget.vue',
  'src/components/EmergencyMap.vue',
  'src/views/DonorDashboard.vue'
];

const styleRegex = /style="([^"]+)"/g;
const uniqueStyles = {};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = styleRegex.exec(content)) !== null) {
    const styleContent = match[1].trim();
    if (!uniqueStyles[styleContent]) {
      uniqueStyles[styleContent] = [];
    }
    if (!uniqueStyles[styleContent].includes(file)) {
      uniqueStyles[styleContent].push(file);
    }
  }
});

console.log(JSON.stringify(uniqueStyles, null, 2));
fs.writeFileSync('extracted-styles.json', JSON.stringify(uniqueStyles, null, 2));
