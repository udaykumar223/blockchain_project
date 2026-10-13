const fs = require('fs');
const path = require('path');

function createSimplePdf(filePath, title, bodyText) {
  // Minimal valid PDF 1.4 file
  const streamContent = `BT /F1 18 Tf 50 720 Td (${title}) Tj ET BT /F1 12 Tf 50 680 Td (${bodyText}) Tj ET`;
  const streamLength = streamContent.length;

  const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000248 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
370
%%EOF`;

  fs.writeFileSync(filePath, pdfData);
  console.log(`Generated sample PDF: ${filePath}`);
}

const sampleDir = path.join(__dirname, '..', 'sample_docs');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

createSimplePdf(
  path.join(sampleDir, 'deed_P101_ravi_original.pdf'),
  'GOVERNMENT LAND REGISTRY AUDIT COPY',
  'Property ID: P101 - Registered Owner: Ravi Kumar - Survey No: 421/B - Area: 2400 sq.ft'
);

createSimplePdf(
  path.join(sampleDir, 'deed_P101_tampered.pdf'),
  'GOVERNMENT LAND REGISTRY AUDIT COPY',
  'Property ID: P101 - Altered Owner: Malicious Actor - Survey No: 421/B - TAMPERED RECORD'
);

createSimplePdf(
  path.join(sampleDir, 'deed_P101_arun_transfer.pdf'),
  'OFFICIAL OWNERSHIP TRANSFER DEED',
  'Property ID: P101 - Transferred From: Ravi Kumar - New Legal Owner: Arun Sharma - Date: 2026'
);

console.log('Sample demonstration PDFs created successfully.');
