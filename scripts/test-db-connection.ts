import { config } from 'dotenv';

// Load environment variables from .env file
config();

console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('MongoDB URI length:', process.env.MONGODB_URI?.length || 0);

// Now import and run the connection
import { connectMongoDB } from '../src/lib/mongodb';
import { EquipmentModel } from '../src/models/equipment';
import { AccountModel } from '../src/models/account';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectMongoDB();
    console.log('✅ Successfully connected to MongoDB');

    // Test creating a simple equipment item
    const testEquipment = {
      title: 'Test Camera',
      brand: 'Test Brand',
      model: 'Test Model',
      description: 'Test description',
      category: 'camera',
      quantity: 1,
      location: {
        type: 'Point',
        coordinates: [106.7017555, 10.7758439],
        address: 'Quận 1, Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        city: 'Thành phố Hồ Chí Minh'
      },
      specs: [
        { name: 'Test Spec', value: 'Test Value' }
      ],
      pricePerDay: 100000,
      replacementPrice: 1000000,
      status: 'available'
    };

    // Create a test owner first
    const testOwner = {
      credentials: {
        email: 'test@example.com',
        password: 'hashedpassword'
      },
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        phone: '+84123456789',
        dateOfBirth: new Date('1990-01-01')
      },
      verification: {
        verificationLevel: 'verified'
      },
      registrationStage: 4
    };

    console.log('Creating test owner...');
    const owner = await AccountModel.create(testOwner);
    console.log('✅ Test owner created:', owner._id);

    // Add owner to equipment
    testEquipment.ownerId = owner._id;

    console.log('Creating test equipment...');
    const equipment = await EquipmentModel.create(testEquipment);
    console.log('✅ Test equipment created:', equipment._id);

    console.log('Database test completed successfully!');

    // Clean up test data
    await EquipmentModel.deleteOne({ _id: equipment._id });
    await AccountModel.deleteOne({ _id: owner._id });
    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testConnection();