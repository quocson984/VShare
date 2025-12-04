const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vuhse182692:taolavua@freecluster.7omldwk.mongodb.net/vshare?retryWrites=true&w=majority&appName=FreeCluster';

// Remove Vietnamese accents
function removeVietnameseAccents(str) {
  if (!str) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

async function normalizeEquipment() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const Equipment = mongoose.connection.collection('equipments');
    
    // Get all equipment
    const equipment = await Equipment.find({}).toArray();
    console.log(`Found ${equipment.length} equipment items`);

    let updated = 0;
    for (const item of equipment) {
      const update = {};
      
      if (item.title) {
        update.titleNormalized = removeVietnameseAccents(item.title.toLowerCase());
      }
      if (item.brand) {
        update.brandNormalized = removeVietnameseAccents(item.brand.toLowerCase());
      }
      if (item.description) {
        update.descriptionNormalized = removeVietnameseAccents(item.description.toLowerCase());
      }

      if (Object.keys(update).length > 0) {
        await Equipment.updateOne(
          { _id: item._id },
          { $set: update }
        );
        updated++;
        console.log(`Updated: ${item.title} (${item._id})`);
      }
    }

    console.log(`\nSuccessfully normalized ${updated} equipment items!`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

normalizeEquipment();
