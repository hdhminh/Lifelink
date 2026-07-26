const fs = require('fs');

function refactorFile(filePath, prefix) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  const styleRegex = /\sstyle="([^"]+)"/g;
  
  const extractedStyles = {};
  let counter = 1;
  
  let newContent = content.replace(styleRegex, (match, styleContent) => {
    let className;
    const existing = Object.keys(extractedStyles).find(k => extractedStyles[k] === styleContent);
    if (existing) {
      className = existing;
    } else {
      className = `${prefix}-${counter++}`;
      extractedStyles[className] = styleContent;
    }
    return ` data-merge-class="${className}"`;
  });

  newContent = newContent.replace(/<([a-zA-Z0-9-]+)([^>]*)>/g, (tagMatch, tagName, attributes) => {
    const mergeMatch = attributes.match(/\sdata-merge-class="([^"]+)"/);
    if (mergeMatch) {
      const className = mergeMatch[1];
      let newAttributes = attributes.replace(mergeMatch[0], '');
      
      const classMatch = newAttributes.match(/class="([^"]*)"/);
      if (classMatch) {
        newAttributes = newAttributes.replace(classMatch[0], `class="${classMatch[1]} ${className}"`);
      } else {
        newAttributes = ` class="${className}"` + newAttributes;
      }
      return `<${tagName}${newAttributes}>`;
    }
    return tagMatch;
  });

  if (Object.keys(extractedStyles).length > 0) {
    let styleBlock = '\n<style scoped>\n';
    for (const [cls, rules] of Object.entries(extractedStyles)) {
      styleBlock += `.${cls} {\n  ${rules.split(';').map(s => s.trim()).filter(s => s).join(';\n  ')};\n}\n`;
    }
    styleBlock += '</style>\n';
    
    if (newContent.includes('<style scoped>')) {
      newContent = newContent.replace(/<style scoped>/, styleBlock + '\n<style scoped>');
    } else if (newContent.includes('<style>')) {
      newContent = newContent.replace(/<style>/, styleBlock + '\n<style>');
    } else {
      newContent += styleBlock;
    }
    fs.writeFileSync(filePath, newContent);
    console.log(`Refactored ${filePath} with ${Object.keys(extractedStyles).length} classes.`);
  } else {
    console.log(`No static styles found in ${filePath}.`);
  }
}

refactorFile('src/components/SupportChatWidget.vue', 'chat-style');
refactorFile('src/components/EmergencyMap.vue', 'map-style');
refactorFile('src/views/DonorDashboard.vue', 'dashboard-style');
