const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/acuity_tutoring');
  const res = await mongoose.connection.collection('studentprofiles').updateMany(
    { board: { $nin: ['CBSE', 'State Board'] } },
    { $set: { board: 'State Board' } }
  );
  console.log('Migrated student profiles:', res.modifiedCount);
  const distinct = await mongoose.connection.collection('studentprofiles').distinct('board');
  console.log('Distinct boards in DB:', distinct);
  process.exit(0);
}

migrate().catch(console.error);
