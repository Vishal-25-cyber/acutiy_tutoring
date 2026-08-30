const mongoose = require('mongoose');

async function fixOrphanedAssignments() {
  await mongoose.connect('mongodb://127.0.0.1:27017/acuity_tutoring');
  
  const teachers = await mongoose.connection.db.collection('users').find({ role: 'TEACHER' }).toArray();
  const teacherProfiles = await mongoose.connection.db.collection('teacherprofiles').find({}).toArray();
  
  const mathTeacher = teachers.find(t => t.email.includes('maths')) || teachers[0];
  const scienceTeacher = teachers.find(t => t.email.includes('science')) || teachers[0];
  const englishTeacher = teachers.find(t => t.email.includes('english')) || teachers[0];
  
  const validTeacherIds = new Set(teachers.map(t => t._id.toString()));
  
  const assignments = await mongoose.connection.db.collection('assignments').find({}).toArray();
  
  for (const asg of assignments) {
    if (!asg.teacherId || !validTeacherIds.has(asg.teacherId.toString())) {
      let targetTeacher = mathTeacher;
      if (asg.subject === 'Science' || asg.subject === 'Physics' || asg.subject === 'Chemistry') {
        targetTeacher = scienceTeacher;
      } else if (asg.subject === 'English') {
        targetTeacher = englishTeacher;
      }
      
      console.log(`Fixing assignment "${asg.title}" (${asg.subject}) -> assigning to ${targetTeacher.name} (${targetTeacher._id})`);
      await mongoose.connection.db.collection('assignments').updateOne(
        { _id: asg._id },
        { $set: { teacherId: targetTeacher._id } }
      );
    }
  }
  
  console.log('Database assignments successfully updated!');
  await mongoose.disconnect();
}

fixOrphanedAssignments().catch(console.error);
