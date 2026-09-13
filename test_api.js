const http = require('http');

async function testApi() {
  console.log("Starting Self-Assessment Test...\n");

  // Helper to make requests
  const request = (options, postData) => {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  try {
    // 1. ADD DATA (POST)
    console.log("[1/3] Testing Adding Data (POST /api/vehicles)...");
    const testVehicle = JSON.stringify({
      brand: "SelfTestBrand",
      model: "SelfTestModel",
      year: 2026,
      selling_price: 100000
    });

    const postResponse = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/vehicles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testVehicle)
      }
    }, testVehicle);

    if (postResponse.statusCode !== 201) throw new Error("Failed to add data");
    const createdVehicle = JSON.parse(postResponse.data);
    console.log("  ✅ SUCCESS: Vehicle added with ID: " + createdVehicle._id);

    // 2. READ DATA (GET)
    console.log("\n[2/3] Testing Retrieving Data (GET /api/vehicles)...");
    const getResponse = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/vehicles',
      method: 'GET'
    });
    
    if (getResponse.statusCode !== 200) throw new Error("Failed to fetch data");
    const vehicles = JSON.parse(getResponse.data);
    const found = vehicles.find(v => v._id === createdVehicle._id);
    if (!found) throw new Error("Added vehicle was not found in database!");
    console.log("  ✅ SUCCESS: Retrieved the newly added vehicle from the database.");

    // 3. DELETE DATA (DELETE)
    console.log("\n[3/3] Testing Deleting Data (DELETE /api/vehicles/:id)...");
    const deleteResponse = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/vehicles/${createdVehicle._id}`,
      method: 'DELETE'
    });

    if (deleteResponse.statusCode !== 200) throw new Error("Failed to delete data");
    console.log("  ✅ SUCCESS: Vehicle deleted successfully.");

    console.log("\n✅ ALL TESTS PASSED! The application is correctly communicating with MongoDB.");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

testApi();
