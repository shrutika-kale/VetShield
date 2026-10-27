// VetShield Full-Stack Feature Validation Suite
// Rigorously tests Dairy Management, Milk Production, Financial Analytics, QR System, and IoT Telemetry

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log("=== VETSHIELD VALIDATION TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // TEST 1: Status Endpoint
    console.log("\n--- TEST 1: System Status & Dairy Counts ---");
    const statusRes = await fetch(`${BASE_URL}/status`);
    const statusData = await statusRes.json();
    assert(statusRes.ok, "Status endpoint returns 200 OK");
    assert(statusData.counts.totalAnimals >= 5, "Total animals count reported correctly", JSON.stringify(statusData.counts));
    assert(statusData.counts.totalCows >= 3, "Total cows count reported separately");
    assert(statusData.counts.totalBuffaloes >= 2, "Total buffaloes count reported separately");

    // TEST 2: Add a Cow
    console.log("\n--- TEST 2: Register a New Cow ---");
    const cowPayload = {
      name: "Ganga",
      species: "Cow",
      breed: "Rathi Indigenous",
      gender: "Female",
      age: "3.0 yrs",
      dob: "2023-08-10",
      weight: "520 kg",
      penLocation: "Barn A - Stall 08",
      healthStatus: "Healthy",
      milkProductionStatus: "In Milk",
      purchaseDate: "2024-04-10",
      purchaseCost: 48000,
      publicNotes: "High-yield Rathi breed cow enrolled in test verification."
    };
    const addCowRes = await fetch(`${BASE_URL}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cowPayload)
    });
    const addCowData = await addCowRes.json();
    assert(addCowRes.status === 201, "Cow registration returns 201 Created");
    assert(addCowData.animal && addCowData.animal.id.startsWith("VS"), `Permanent animal ID generated: ${addCowData.animal?.id}`);
    const newCowId = addCowData.animal?.id;

    // TEST 3: Add a Buffalo
    console.log("\n--- TEST 3: Register a New Buffalo ---");
    const buffPayload = {
      name: "Yamuna",
      species: "Buffalo",
      breed: "Murrah Graded",
      gender: "Female",
      age: "4.5 yrs",
      dob: "2022-03-15",
      weight: "690 kg",
      penLocation: "Barn B - Stall 05",
      healthStatus: "Healthy",
      milkProductionStatus: "In Milk",
      purchaseDate: "2024-02-20",
      purchaseCost: 82000,
      publicNotes: "Prime Murrah buffalo enrolled in test verification."
    };
    const addBuffRes = await fetch(`${BASE_URL}/animals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buffPayload)
    });
    const addBuffData = await addBuffRes.json();
    assert(addBuffRes.status === 201, "Buffalo registration returns 201 Created");
    assert(addBuffData.animal && addBuffData.animal.species === "Buffalo", `Buffalo species verified: ${addBuffData.animal?.species}`);
    const newBuffId = addBuffData.animal?.id;

    // TEST 4: Record Daily Milk Production (Automatic Totals Calculation)
    console.log("\n--- TEST 4: Record Daily Milk Production & Auto-Calculation ---");
    const testDate = "2026-10-27";
    const milkPayload = {
      animalId: newCowId,
      date: testDate,
      morningLiters: 9.0,
      afternoonLiters: 0.0,
      eveningLiters: 8.0,
      soldLiters: 15.0, // 2.0 L retained
      pricePerLiter: 55.0,
      notes: "Test milking log: 2L retained for calf"
    };
    const addMilkRes = await fetch(`${BASE_URL}/milk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milkPayload)
    });
    const addMilkData = await addMilkRes.json();
    assert(addMilkRes.status === 201, "Milk record saved successfully (201)");
    assert(addMilkData.milkRecord.totalLiters === 17.0, `Daily Milk Total auto-calculated: ${addMilkData.milkRecord.totalLiters} L (expected 17.0)`);
    assert(addMilkData.milkRecord.unsoldLiters === 2.0, `Unsold milk recorded separately: ${addMilkData.milkRecord.unsoldLiters} L (expected 2.0)`);
    assert(addMilkData.milkRecord.totalIncome === 825.0, `Milk Sales Income auto-calculated: ₹${addMilkData.milkRecord.totalIncome} (expected 15 * 55 = 825)`);
    assert(addMilkData.milkRecord.transactionId !== null, `Auto-linked sales transaction ID: ${addMilkData.milkRecord.transactionId}`);
    const createdMilkId = addMilkData.milkRecord.id;

    // TEST 5: Prevent Duplicate Milk Record for Same Animal & Date
    console.log("\n--- TEST 5: Duplicate Milk Entry Prevention ---");
    const duplicateRes = await fetch(`${BASE_URL}/milk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milkPayload)
    });
    const dupData = await duplicateRes.json();
    assert(duplicateRes.status === 409, `Duplicate entry blocked with 409 Conflict: ${dupData.error}`);

    // TEST 6: Edit Milk Record
    console.log("\n--- TEST 6: Edit Milk Record & Sync Linked Transaction ---");
    const editPayload = {
      morningLiters: 9.5,
      afternoonLiters: 0.0,
      eveningLiters: 8.5,
      soldLiters: 16.0,
      pricePerLiter: 55.0,
      notes: "Corrected morning yield (+0.5L) and evening yield (+0.5L)"
    };
    const editRes = await fetch(`${BASE_URL}/milk/${createdMilkId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editPayload)
    });
    const editData = await editRes.json();
    assert(editRes.ok, "Milk record updated successfully");
    assert(editData.milkRecord.totalLiters === 18.0, `Updated Total Yield: ${editData.milkRecord.totalLiters} L (expected 18.0)`);
    assert(editData.milkRecord.totalIncome === 880.0, `Updated Total Income: ₹${editData.milkRecord.totalIncome} (expected 16 * 55 = 880)`);

    // TEST 7: Record Operating Expenses
    console.log("\n--- TEST 7: Add Operating Expense Transactions ---");
    const expPayload1 = {
      date: testDate,
      type: "expense",
      category: "Animal feed",
      description: "Organic concentrate feed for Ganga",
      amount: 450.0,
      animalId: newCowId,
      paymentMethod: "Cash"
    };
    const expRes1 = await fetch(`${BASE_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expPayload1)
    });
    assert(expRes1.status === 201, "Feed expense recorded with 201 Created");

    const expPayload2 = {
      date: testDate,
      type: "expense",
      category: "Veterinary treatment",
      description: "Preventive vitamin mineral bolus for Ganga",
      amount: 200.0,
      animalId: newCowId,
      paymentMethod: "UPI / QR"
    };
    const expRes2 = await fetch(`${BASE_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expPayload2)
    });
    assert(expRes2.status === 201, "Veterinary expense recorded with 201 Created");

    // TEST 8: Financial Calculations & Double-Counting Check
    console.log("\n--- TEST 8: Financial Calculations & Anti-Double-Counting Audit ---");
    const finRes = await fetch(`${BASE_URL}/finances/summary?targetDate=${testDate}`);
    const finData = await finRes.json();
    assert(finRes.ok, "Financial summary endpoint returned 200 OK");
    console.log("  Today Summary:", finData.today);
    console.log("  Weekly Summary:", finData.week);
    console.log("  Monthly Summary:", finData.month);

    assert(finData.today.income > 0, `Today's Income verified: ₹${finData.today.income}`);
    assert(finData.today.operatingExpenses > 0, `Today's Operating Expenses verified: ₹${finData.today.operatingExpenses}`);
    const expectedTodayNet = parseFloat((finData.today.income - finData.today.operatingExpenses).toFixed(2));
    assert(finData.today.netOperatingProfit === expectedTodayNet, `Today's Net Operating Profit verified: ₹${finData.today.netOperatingProfit}`);

    // Anti-double-counting check: verify milk sales transaction count for new cow
    const txnsRes = await fetch(`${BASE_URL}/finances/transactions?animalId=${newCowId}&type=income`);
    const newCowTxns = await txnsRes.json();
    assert(newCowTxns.length === 1, `Exactly 1 linked income transaction found for ${newCowId} (no double counting)`);
    assert(newCowTxns[0].amount === 880.0, `Transaction amount matches updated milk sales (₹880)`);

    // TEST 9: Animal-Wise Profitability Report (Feature 4)
    console.log("\n--- TEST 9: Animal-Wise Profitability Report ---");
    const animalProf = finData.animalProfitability.find(a => a.animalId === newCowId);
    assert(animalProf !== undefined, `Animal profitability found for ${newCowId}`);
    if (animalProf) {
      console.log("  Ganga Profitability Profile:", animalProf);
      assert(animalProf.totalRecordedIncome === 880.0, `Recorded Income: ₹${animalProf.totalRecordedIncome}`);
      assert(animalProf.feedExpenses === 450.0, `Direct Feed Expenses: ₹${animalProf.feedExpenses}`);
      assert(animalProf.vetExpenses === 200.0, `Direct Vet Expenses: ₹${animalProf.vetExpenses}`);
      assert(animalProf.totalDirectExpenses === 650.0, `Total Direct Expenses: ₹${animalProf.totalDirectExpenses}`);
      assert(animalProf.netContribution === 230.0, `Net Contribution: ₹${animalProf.netContribution} (880 - 650 = 230)`);
    }

    // TEST 10: QR Code Public Profile Lookup & Sanitization
    console.log("\n--- TEST 10: Scanned QR Public Profile Verification ---");
    const pubRes = await fetch(`${BASE_URL}/animals/${newCowId}/public`);
    const pubData = await pubRes.json();
    assert(pubRes.ok, "Public QR profile returns 200 OK");
    assert(pubData.id === newCowId, `Public profile ID matches: ${pubData.id}`);
    assert(pubData.todayMilkYield && pubData.todayMilkYield.totalLiters === 18.0, "Today's milk production included in public profile");
    assert(pubData.purchaseCost === undefined, "Purchase cost is NOT exposed in public profile (Data Privacy Protected)");
    assert(pubData.ownerPhone === undefined && pubData.owner === undefined, "Owner phone is NOT exposed in public profile (Data Privacy Protected)");
    assert(pubData.sensorData.temperature === undefined || typeof pubData.sensorData.temperature === 'number', "Sensor status handled honestly without fabricated values");

    // TEST 11: Real ESP32 Sensor Telemetry Ingestion (Authenticated)
    console.log("\n--- TEST 11: Real ESP32 Sensor Telemetry Ingestion ---");
    const telemetryPayload = {
      deviceId: "ESP32-VET-01",
      temperature: 38.65,
      unit: "C",
      battery: 92,
      rssi: -58,
      firmwareVersion: "2.1.0"
    };
    const telRes = await fetch(`${BASE_URL}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'vetshield_sec_esp32_k8912x'
      },
      body: JSON.stringify(telemetryPayload)
    });
    const telData = await telRes.json();
    assert(telRes.status === 200, "Real ESP32 reading authenticated and recorded (200 OK)");
    assert(telData.success === true, "Hardware ingestion verified");

    // Verify rejection of unauthenticated device
    const badKeyRes = await fetch(`${BASE_URL}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'wrong_key_fake'
      },
      body: JSON.stringify(telemetryPayload)
    });
    assert(badKeyRes.status === 403, "Invalid API key rejected with 403 Forbidden");

    // TEST 12: DS18B20 Fault Detection & Physiological Bounds Check
    console.log("\n--- TEST 12: Hardware Fault & Physiological Sanity Check ---");
    const faultPayload = {
      deviceId: "ESP32-VET-01",
      temperature: -127.0 // Standard DS18B20 disconnected wire signal
    };
    const faultRes = await fetch(`${BASE_URL}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'vetshield_sec_esp32_k8912x'
      },
      body: JSON.stringify(faultPayload)
    });
    assert(faultRes.status === 422, "DS18B20 -127°C disconnected probe rejected with 422 Unprocessable Entity");

    // TEST 13: Invalid Animal Lookup
    console.log("\n--- TEST 13: Invalid Animal ID QR Lookup Graceful Handling ---");
    const invalidRes = await fetch(`${BASE_URL}/animals/VS9999/public`);
    assert(invalidRes.status === 404, "Non-existent animal ID returns graceful 404 Not Found");

    // TEST 14: Delete Animal with Safety Handling
    console.log("\n--- TEST 14: Safe Animal Deletion & Cascade Clean ---");
    const delRes = await fetch(`${BASE_URL}/animals/${newBuffId}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    assert(delRes.ok, `Animal ${newBuffId} successfully deleted`);
    const checkDelRes = await fetch(`${BASE_URL}/animals/${newBuffId}/public`);
    assert(checkDelRes.status === 404, "Deleted animal no longer accessible");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n========================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================");
}

runTests();
