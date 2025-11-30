
async function fetchData() {
  try {
    const usersRes = await fetch('http://localhost:3000/api/users');
    const chiefdomsRes = await fetch('http://localhost:3000/api/chiefdoms');
    
    const users = await usersRes.json();
    const chiefdoms = await chiefdomsRes.json();

    console.log('--- FIRST USER ---');
    console.log(JSON.stringify(users[0], null, 2));
    
    console.log('--- FIRST CHIEFDOM ---');
    console.log(JSON.stringify(chiefdoms[0], null, 2));

    // Check for a user with a chiefdom object
    const userWithChiefdom = users.find(u => u.chiefdom);
    if (userWithChiefdom) {
        console.log('--- USER WITH CHIEFDOM OBJECT ---');
        console.log(JSON.stringify(userWithChiefdom, null, 2));
    } else {
        console.log('No user found with chiefdom object');
    }

    // Count workers per chiefdom
    const chiefdomCounts = {};
    users.forEach(u => {
        if (u.chiefdom && u.chiefdom.id) {
            const id = u.chiefdom.id;
            chiefdomCounts[id] = (chiefdomCounts[id] || 0) + 1;
        }
    });
    console.log('--- WORKER COUNTS PER CHIEFDOM ---');
    console.log(JSON.stringify(chiefdomCounts, null, 2));


  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
