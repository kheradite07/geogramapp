const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-report.json'));
let errCount = 0;
data.filter(d => d.errorCount > 0).forEach(d => {
    console.log('File:', d.filePath);
    d.messages.filter(m => m.severity === 2).forEach(m => {
        console.log(`  Line ${m.line}: ${m.message} (${m.ruleId})`);
        errCount++;
    });
});
console.log('Total Errors:', errCount);
