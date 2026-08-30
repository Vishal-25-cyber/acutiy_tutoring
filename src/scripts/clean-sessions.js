const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect('mongodb://127.0.0.1:27017/acuity_tutoring');
  await mongoose.connection.collection('livesessions').updateMany(
    { date: { $lt: '2026-08-30' }, status: 'LIVE' },
    { $set: { status: 'COMPLETED' } }
  );
  console.log('Cleaned up past live sessions.');
  process.exit(0);
}

clean().catch(console.error);
