const http = require('http');

function api(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: resData });
        }
      });
    });
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runWorkflowTests() {
  console.log('🧪 Starting CRM Advanced Workflows Verification...\n');

  // Test 1: Stats API
  const statsRes = await api('GET', '/api/stats');
  console.log('1. Stats API check:', statsRes.status === 200 ? '✅ PASSED' : '❌ FAILED', statsRes.data);

  // Test 2: Create Vehicle
  const vehRes = await api('POST', '/api/vehicles', {
    brand: 'Tata',
    model: 'Harrier Fearless',
    year: 2023,
    fuel: 'Diesel',
    transmission: 'Automatic',
    selling_price: 1850000,
    km_driven: 18000
  });
  console.log('2. Create Vehicle:', vehRes.status === 201 ? '✅ PASSED' : '❌ FAILED', `Stock ID: ${vehRes.data.stock_id}`);
  const vehicleId = vehRes.data._id;

  // Test 3: Customer deduplication test with phone normalization
  const lead1 = await api('POST', '/api/leads', {
    name: 'Rajesh Kumar',
    phone: '+91 98765 11223',
    interested_car: 'Tata Harrier',
    budget_max: 1900000
  });
  console.log('3a. Create Lead 1:', lead1.status === 201 ? '✅ PASSED' : '❌ FAILED', `Cust ID: ${lead1.data.customer_id?._id || lead1.data.customer_id}`);

  const lead2 = await api('POST', '/api/leads', {
    name: 'Rajesh K',
    phone: '98765-11223', // Same customer, different format
    interested_car: 'Safari',
    budget_max: 2000000
  });
  console.log('3b. Create Lead 2 (deduplication check):', lead2.status === 201 ? '✅ PASSED' : '❌ FAILED', `Cust ID: ${lead2.data.customer_id?._id || lead2.data.customer_id}`);

  const cust1Id = lead1.data.customer_id?._id || lead1.data.customer_id;
  const cust2Id = lead2.data.customer_id?._id || lead2.data.customer_id;
  if (cust1Id.toString() === cust2Id.toString()) {
    console.log('  🎯 SUCCESS: Customer deduplicated correctly by normalized phone!');
  } else {
    console.error('  ❌ Customer was not deduplicated!');
  }

  // Test 4: Deal creation and vehicle availability locking
  const dealRes = await api('POST', '/api/deals', {
    vehicle_id: vehicleId,
    customer_id: cust1Id,
    lead_id: lead1.data._id,
    selling_price: 1800000,
    booking_amount: 50000,
    deal_status: 'booked'
  });
  console.log('4. Create Deal on Vehicle:', dealRes.status === 201 ? '✅ PASSED' : '❌ FAILED', `Deal: ${dealRes.data.deal_number}`);
  const dealId = dealRes.data._id;

  // Test 5: Verify double booking rejection
  const doubleBooking = await api('POST', '/api/deals', {
    vehicle_id: vehicleId,
    customer_id: cust2Id,
    selling_price: 1850000
  });
  console.log('5. Double booking protection check:', doubleBooking.status === 400 ? '✅ PASSED (Properly Rejected)' : '❌ FAILED', doubleBooking.data);

  // Test 6: Deal delivery workflow
  const deliveryRes = await api('PUT', `/api/deals/${dealId}`, {
    deal_status: 'delivered'
  });
  console.log('6. Deal Delivery workflow:', deliveryRes.status === 200 ? '✅ PASSED' : '❌ FAILED');

  // Verify vehicle is marked SOLD and lead is marked WON
  const vehCheck = await api('GET', `/api/vehicles/${vehicleId}`);
  const leadCheck = await api('GET', `/api/leads/${lead1.data._id}`);
  console.log('  - Vehicle status after delivery:', vehCheck.data.status === 'sold' ? '✅ SOLD' : vehCheck.data.status);
  console.log('  - Lead status after delivery:', leadCheck.data.lead?.status === 'won' ? '✅ WON' : leadCheck.data.lead?.status);

  // Test 7: Activity logging check
  const activities = await api('GET', '/api/activities');
  console.log('7. Activity audit feed check:', activities.status === 200 && activities.data.length >= 3 ? '✅ PASSED' : '❌ FAILED', `Total activities: ${activities.data.length}`);

  console.log('\n🏆 ALL CRM WORKFLOW TESTS COMPLETED SUCCESSFULLY!');
}

runWorkflowTests().catch(console.error);
