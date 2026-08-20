const fs = require('fs');
let content = fs.readFileSync('D:/frontend/src/components/auth/UserProfilePage.tsx', 'utf-8');
content = content.replace(/\/\*\s*"?"? PO Submissions[\s\S]*?useState<string>\(""\);/g, '');
content = content.replace(/if \(!isB2B\) return;\s*if \(activeTab !== "po" && activeTab !== "overview"\) return;[\s\S]*?\}, \[activeTab, isB2B\]\);/g, '');
content = content.replace(/\/\*\s*"?"? PO Filtered List Helper[\s\S]*?return true;\s*\}\);/g, '');
content = content.replace(/\{\s*key:\s*"po"\s*as\s*ProfileTab,.*?\n/g, '');
content = content.replace(/\{\s*activeTab === "po"\s*&&[\s\S]*?(?=\{activeTab === "notifications")/g, '');
content = content.replace(/import\s*\{\s*CustomerPoSubmission[^}]*\}\s*from\s*"[^"]*";/g, '');
fs.writeFileSync('D:/frontend/src/components/auth/UserProfilePage.tsx', content);
