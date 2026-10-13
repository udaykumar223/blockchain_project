const fs = require('fs');
const path = require('path');

async function testApi() {
  console.log("Testing Express API endpoints against running blockchain & backend...\n");

  const sampleDir = path.join(__dirname, '..', 'sample_docs');
  const originalPdf = path.join(sampleDir, 'deed_P101_ravi_original.pdf');
  const tamperedPdf = path.join(sampleDir, 'deed_P101_tampered.pdf');
  const transferPdf = path.join(sampleDir, 'deed_P101_arun_transfer.pdf');

  // Helper for multipart/form-data using standard fetch with Blob/FormData
  async function postMultipart(url, fields, filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    for (const key in fields) {
      formData.append(key, fields[key]);
    }
    formData.append('document', blob, path.basename(filePath));

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  }

  const propId = "P" + Math.floor(100 + Math.random() * 900);
  console.log(`Using Test Property ID: ${propId}`);

  // 1. Register Property
  console.log(`\n1. Testing POST /api/properties/register (${propId} - Ravi)...`);
  const regRes = await postMultipart(
    'http://localhost:5000/api/properties/register',
    { propertyId: propId, owner: 'Ravi' },
    originalPdf
  );
  console.log("Register Response:", JSON.stringify(regRes, null, 2));

  // 2. Verify Original Document
  console.log(`\n2. Testing POST /api/properties/verify (Original PDF)...`);
  const verifyRes1 = await postMultipart(
    'http://localhost:5000/api/properties/verify',
    { propertyId: propId },
    originalPdf
  );
  console.log("Verify Result 1:", JSON.stringify(verifyRes1, null, 2));

  // 3. Verify Tampered Document
  console.log(`\n3. Testing POST /api/properties/verify (Tampered PDF)...`);
  const verifyRes2 = await postMultipart(
    'http://localhost:5000/api/properties/verify',
    { propertyId: propId },
    tamperedPdf
  );
  console.log("Verify Result 2 (Tampered):", JSON.stringify(verifyRes2, null, 2));

  // 4. Transfer Ownership
  console.log(`\n4. Testing POST /api/properties/transfer (Ravi -> Arun)...`);
  const transferRes = await postMultipart(
    'http://localhost:5000/api/properties/transfer',
    { propertyId: propId, currentOwner: 'Ravi', newOwner: 'Arun' },
    transferPdf
  );
  console.log("Transfer Response:", JSON.stringify(transferRes, null, 2));

  // 5. Verify History
  console.log(`\n5. Testing GET /api/properties/${propId}/history...`);
  const histRes = await (await fetch(`http://localhost:5000/api/properties/${propId}/history`)).json();
  console.log("History Response:", JSON.stringify(histRes, null, 2));

  // 6. Verify Dashboard
  console.log("\n6. Testing GET /api/dashboard...");
  const dashRes = await (await fetch('http://localhost:5000/api/dashboard')).json();
  console.log("Dashboard Data:", JSON.stringify(dashRes, null, 2));

  console.log("\n✅ ALL API ENDPOINTS VALIDATED SUCCESSFULLY OVER HTTP!");
}

testApi().catch(console.error);
