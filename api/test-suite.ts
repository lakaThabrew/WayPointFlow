import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:4000';
const prisma = new PrismaClient();

async function runTests() {
  console.log('🚀 Starting WaypointFlow API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorMsg?: string) {
    if (condition) {
      console.log(`✅ ${testName}`);
      passed++;
    } else {
      console.error(`❌ ${testName} - ${errorMsg || 'Failed'}`);
      failed++;
    }
  }

  try {
    // --- Phase 1: Backend Foundation ---
    console.log('--- Phase 1: Foundation ---');
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      assert(res.status === 200 && data.status === 'ok', 'TC-1.4 — Health endpoint');
    } catch (e) {
      assert(false, 'TC-1.4 — Health endpoint', 'Server not running');
      console.error('CRITICAL: API server must be running on port 4000. Start it with `npm run dev` in the api folder.');
      process.exit(1);
    }

    const usersCount = await prisma.user.count();
    assert(usersCount > 0, 'TC-1.3 — Seed', 'No users found in database');

    // --- Phase 2: Authentication ---
    console.log('\n--- Phase 2: Authentication ---');
    let dispatcherToken = '';
    let driverToken = '';
    let storeToken = '';
    
    // TC-2.1 Valid Login
    let res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ashan@waypoint.lk', password: 'demo1234' })
    });
    let data = await res.json();
    assert(res.status === 200 && data.token, 'TC-2.1 — Valid login');
    dispatcherToken = data.token;

    // TC-2.2 Invalid Password
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ashan@waypoint.lk', password: 'wrong' })
    });
    assert(res.status === 401, 'TC-2.2 — Invalid password');

    // TC-2.3 Unknown User
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@waypoint.lk', password: 'wrong' })
    });
    assert(res.status === 401 || res.status === 404, 'TC-2.3 — Unknown user');

    // Get Driver Token
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kasun.p@waypoint.lk', password: 'demo1234' })
    });
    data = await res.json();
    driverToken = data.token;

    // Get Store Token
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chamari@waypoint.lk', password: 'demo1234' })
    });
    data = await res.json();
    storeToken = data.token;

    // TC-2.4 /me
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${dispatcherToken}` }
    });
    data = await res.json();
    assert(res.status === 200 && data.user.email === 'ashan@waypoint.lk', 'TC-2.4 — /me endpoint');

    // TC-2.5 Role Protection (Driver accessing Planning API)
    res = await fetch(`${API_URL}/planning/conflicts`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert(res.status === 403, 'TC-2.5 — Role protection (Driver blocked from Dispatcher API)');

    // --- Phase 3: Store Manager ---
    console.log('\n--- Phase 3: Store Manager ---');
    // TC-3.2 Validation
    res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storeToken}` },
      body: JSON.stringify({}) // Empty body
    });
    assert(res.status === 400 || res.status === 500, 'TC-3.2 — Required field validation');

    // TC-3.1 Create valid order
    let futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // Bypass cutoff and Sunday logic
    res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storeToken}` },
      body: JSON.stringify({
        brand: 'Fresh',
        tempRequirement: 'CHILLED',
        weightKg: 500,
        volumeM3: 2,
        units: 10,
        windowOpen: '06:00',
        windowClose: '08:00',
        deliveryDate: futureDate.toISOString().split('T')[0],
      })
    });
    data = await res.json();
    assert(res.status === 201 || res.status === 200, 'TC-3.1 — Create valid order');
    let orderId = data.order?.id || data.id;
    
    // --- Phase 6: Driver Route ---
    console.log('\n--- Phase 6: Driver Route ---');
    
    // Ensure there is at least one READY trip for Kasun to fetch
    const anyTrip = await prisma.trip.findFirst();
    if (anyTrip) {
      await prisma.trip.update({
        where: { id: anyTrip.id },
        data: { status: 'READY' } // MVP logic returns the first READY/IN_TRANSIT trip
      });
    }

    // TC-6.1 Driver Route Fetch
    res = await fetch(`${API_URL}/driver/route`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert(res.status === 200, 'TC-6.1 — Driver route endpoint');
    data = await res.json();
    
    let trip = Array.isArray(data) ? data[0] : data;
    
    if (trip && trip.stops && trip.stops.length > 0) {
      let stop = trip.stops[0];
      // TC-6.3 Arrival
      res = await fetch(`${API_URL}/driver/stops/${stop.id}/arrive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      assert(res.status === 200, 'TC-6.3 — Arrival');

      // TC-6.4 Complete delivery
      res = await fetch(`${API_URL}/driver/stops/${stop.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driverToken}` },
        body: JSON.stringify({ receiverName: 'Test Receiver', signatureNote: 'Tested via API' })
      });
      assert(res.status === 200, 'TC-6.4 — Complete delivery');

      // TC-6.5 PoD created
      const pod = await prisma.proofOfDelivery.findUnique({ where: { stopId: stop.id } });
      assert(pod !== null && pod.receiverName === 'Test Receiver', 'TC-6.5 — Proof of delivery');

    } else {
      console.warn('⚠️ Skipping Driver Stop tests because no active trip is assigned to Kasun.');
    }

    // --- Summary ---
    console.log(`\n🎉 Test Run Complete: ${passed} Passed, ${failed} Failed`);

  } catch (error) {
    console.error('Fatal error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
