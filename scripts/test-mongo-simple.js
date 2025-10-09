// Simple Node.js script to test MongoDB connection
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://vuhse182692:taolavua@freecluster.7omldwk.mongodb.net/vshare?retryWrites=true&w=majority&appName=FreeCluster';

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');
    
    // Test database operations
    const db = client.db('vshare');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test inserting a simple document
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({
      name: 'Test Equipment',
      price: 100000,
      createdAt: new Date()
    });
    console.log('✅ Test document inserted:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

testConnection();