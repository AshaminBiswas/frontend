const fs = require('fs');
let text = fs.readFileSync('D:/frontend/src/components/auth/UserProfilePage.tsx', 'utf-8');

// 1. Remove getMyPoSubmissionsApi import
text = text.replace(/import\s*\{\s*getMyPoSubmissionsApi[^\}]*\}\s*from[^;]+;\n?/g, '');
text = text.replace(/import\s*\{\s*deletePurchaseOrderApi[^\}]*\}\s*from[^;]+;\n?/g, '');
text = text.replace(/import\s*\{\s*CustomerPoSubmission[^}]*\}\s*from[^;]+;\n?/g, '');
text = text.replace(/import\s*\{[^}]*\}\s*from\s*"[^"]*poService";\n?/g, '');
text = text.replace(/import\s*\{[^}]*\}\s*from\s*"[^"]*poSubmissionsService";\n?/g, '');

// 2. Remove states
const statesToRemove = [
    /const \[poSubmissions, setPoSubmissions\] = useState<CustomerPoSubmission\[\]>\(\[\]\);\n?/g,
    /const \[poLoading, setPoLoading\] = useState\(false\);\n?/g,
    /const \[poFilter, setPoFilter\] = useState<string>\("ALL"\);\n?/g,
    /const \[poSearch, setPoSearch\] = useState<string>\(""\);\n?/g,
];
statesToRemove.forEach(regex => { text = text.replace(regex, ''); });

// 3. Remove PO tab effect
text = text.replace(/\s*\/\/\s*Fetch PO Submissions when tab selected or on overview \(B2B only\)[\s\S]*?\}, \[activeTab, isB2B\]\);/g, '');

// 4. Remove PO tab from TABS
text = text.replace(/\s*\{\s*key:\s*"po"\s*as\s*ProfileTab,[\s\S]*?\},/g, '');

// 5. Remove filteredPoSubmissions block
text = text.replace(/\s*\/\/\s*PO Filtered List Helper[\s\S]*?return true;\s*\}\);/g, '');
// Wait, the comment might be different
text = text.replace(/\s*\/\*\s*.+?\s*PO Filtered List Helper.*?\*\/\s*const filteredPoSubmissions[\s\S]*?return true;\s*\n\s*\}\);/g, '');

// 6. Remove the activeTab === "po" rendering block
const startPoRender = text.indexOf('{activeTab === "po" &&');
const endPoRender = text.indexOf('{activeTab === "quotes" &&');
if (startPoRender !== -1 && endPoRender !== -1) {
    const beforeQuotes = text.lastIndexOf('{/*', endPoRender);
    if (beforeQuotes !== -1 && beforeQuotes > startPoRender) {
        text = text.slice(0, startPoRender) + text.slice(beforeQuotes);
    } else {
        text = text.slice(0, startPoRender) + text.slice(endPoRender);
    }
}

// 7. Remove ordersFilter PO type
text = text.replace('const [ordersFilter, setOrdersFilter] = useState<"ALL" | "RETAIL" | "PO">("ALL");', 'const [ordersFilter, setOrdersFilter] = useState<"ALL" | "RETAIL">("ALL");');
text = text.replace('{ key: "PO", label: "Purchase Orders" },\n', '');
text = text.replace('const [purchaseOrders, setPurchaseOrders] = useState<CustomerPurchaseOrder[]>([]);\n', '');
text = text.replace(/import\s*\{\s*CustomerPurchaseOrder[^\}]*\}\s*from[^;]+;\n/, '');

const startB2BOrders = text.indexOf('{/* ?? B2B PURCHASE ORDERS ?? */}');
const endB2BOrders = text.indexOf('{/* ??? STANDARD RETAIL ORDERS ??? */}');
if (startB2BOrders !== -1 && endB2BOrders !== -1) {
    text = text.slice(0, startB2BOrders) + text.slice(endB2BOrders);
}

const startFilterPO = text.indexOf('{ordersFilter === "PO" && purchaseOrders.length === 0 && (');
if (startFilterPO !== -1) {
    const endFilterPO = text.indexOf(')}\n', startFilterPO);
    if (endFilterPO !== -1) {
        text = text.slice(0, startFilterPO) + text.slice(endFilterPO + 3);
    }
}

fs.writeFileSync('D:/frontend/src/components/auth/UserProfilePage.tsx', text);
