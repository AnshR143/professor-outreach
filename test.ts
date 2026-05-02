import fs from 'fs';

const data = fs.readFileSync('C:\\Users\\kiron\\OneDrive\\Desktop\\professor-outreach\\data.txt', 'utf-8');
const lines = data.split('\n').filter(l => l.trim().length > 0);

for (const line of lines.slice(0, 10)) {
  const parts = line.split('__');
  let text = parts[0];
  let url = parts[1] || '';
  
  // Split by camelCase transition
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  console.log(text, ' | URL:', url);
}
