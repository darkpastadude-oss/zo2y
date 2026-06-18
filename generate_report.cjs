const fs = require('fs');
const queries = JSON.parse(fs.readFileSync('scratch_query_audit.json', 'utf8'));

const tableMap = {};

queries.forEach(q => {
    let key = `${q.type}:${q.target}`;
    if (!tableMap[key]) {
        tableMap[key] = {
            target: q.target,
            type: q.type,
            actions: new Set(),
            colsQueried: new Set(),
            locations: []
        };
    }
    
    let entry = tableMap[key];
    entry.actions.add(q.action);
    if (q.cols) {
        q.cols.split(',').map(c => c.trim()).filter(c => c).forEach(c => entry.colsQueried.add(c));
    }
    entry.locations.push(`${q.file.replace(/\\/g, '/').split('zo2ys/')[1]}:${q.line}`);
});

let md = '# Supabase Query Audit Report\n\n';

Object.values(tableMap).sort((a, b) => a.target.localeCompare(b.target)).forEach(entry => {
    md += `## ${entry.type === 'from' ? 'Table' : 'RPC'}: \`${entry.target}\`\n`;
    md += `- **Actions Used**: ${Array.from(entry.actions).join(', ')}\n`;
    if (entry.colsQueried.size > 0) {
        md += `- **Columns Queried**: ${Array.from(entry.colsQueried).join(', ')}\n`;
    }
    md += `- **Locations (Sampled up to 10)**:\n`;
    entry.locations.slice(0, 10).forEach(loc => {
        md += `  - \`${loc}\`\n`;
    });
    if (entry.locations.length > 10) {
        md += `  - ...and ${entry.locations.length - 10} more.\n`;
    }
    md += '\n';
});

fs.writeFileSync('scratch_audit_report.md', md);
console.log('Report generated at scratch_audit_report.md');
