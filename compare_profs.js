const fs = require('fs');
const path = require('path');

const CLARIVATE_PATH = 'C:/Users/kiron/OneDrive/Desktop/professor-outreach/clarivate.txt';
const PROFESSORS_TS_PATH = 'C:/Users/kiron/OneDrive/Desktop/professor-outreach/lib/data/professors.ts';

function parseClarivate() {
    if (!fs.existsSync(CLARIVATE_PATH)) return [];
    const content = fs.readFileSync(CLARIVATE_PATH, 'utf-8');
    const sections = content.split(/\d+\.\s+/).filter(s => s.trim().length > 0);
    
    return sections.map(section => {
        const lines = section.trim().split('\n');
        const name = lines[0].trim();
        const university = lines[1]?.trim() || '';
        const fieldsStr = lines[2]?.trim() || '';
        const areas = fieldsStr.split(/[,;&]/).map(a => a.trim()).filter(a => a.length > 0);
        
        return {
            name,
            university,
            areas,
            url: ''
        };
    });
}

function parsePreloaded() {
    if (!fs.existsSync(PROFESSORS_TS_PATH)) return [];
    const content = fs.readFileSync(PROFESSORS_TS_PATH, 'utf-8');
    const match = content.match(/PRELOADED_PROFESSORS: PreloadedProfessor\[\] = \[([\s\S]+?)\];/);
    if (!match) return [];
    
    const nameMatches = match[1].match(/name: "(.*?)"/g);
    return nameMatches ? nameMatches.map(m => m.replace(/name: "(.*?)"/, '$1')) : [];
}

const clarivateProfs = parseClarivate();
const existingNames = new Set(parsePreloaded());

const newProfs = clarivateProfs.filter(p => !existingNames.has(p.name));

console.log(`Total Clarivate Profs: ${clarivateProfs.length}`);
console.log(`Already in PRELOADED_PROFESSORS: ${clarivateProfs.length - newProfs.length}`);
console.log(`New to add: ${newProfs.length}`);

if (newProfs.length > 0) {
    console.log('\nSample of new profs:');
    console.log(JSON.stringify(newProfs.slice(0, 3), null, 2));
}
