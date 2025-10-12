import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://quocson9842004:4lQSxwfbOOy0BF5s@cluster0.dmhzf.mongodb.net/vshare?retryWrites=true&w=majority&appName=Cluster0";

const sampleEquipment = [
  {
    title: "Canon EOS R5",
    category: "camera",
    brand: "Canon",
    model: "EOS R5",
    pricePerDay: 450000,
    description: "Camera mirrorless full frame chất lượng cao, quay video 8K",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop"],
    rating: 4.8,
    reviewCount: 24,
    location: {
      address: "Quận 1, TP.HCM",
      city: "Ho Chi Minh City",
      district: "District 1",
      coordinates: {
        lat: 10.8231,
        lng: 106.6297
      }
    },
    ownerId: null, // Will be set to a sample user ID
    specifications: {
      resolution: "45MP",
      videoResolution: "8K",
      batteryLife: "8 hours",
      weight: "650g"
    },
    policies: {
      cancellation: "Miễn phí hủy trong 24h",
      deposit: 2000000,
      insurance: true
    },
    availability: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Sony FX6",
    category: "camera",
    brand: "Sony",
    model: "FX6",
    pricePerDay: 800000,
    description: "Camera cinema chuyên nghiệp, quay phim chất lượng cao",
    images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop"],
    rating: 4.9,
    reviewCount: 18,
    location: {
      address: "Quận 3, TP.HCM",
      city: "Ho Chi Minh City",
      district: "District 3",
      coordinates: {
        lat: 10.7769,
        lng: 106.7009
      }
    },
    ownerId: null,
    specifications: {
      resolution: "4K",
      videoResolution: "4K Cinema",
      batteryLife: "6 hours",
      weight: "890g"
    },
    policies: {
      cancellation: "Miễn phí hủy trong 48h",
      deposit: 3000000,
      insurance: true
    },
    availability: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "DJI Ronin RS3",
    category: "accessory",
    brand: "DJI",
    model: "Ronin RS3",
    pricePerDay: 200000,
    description: "Gimbal chống rung chuyên nghiệp cho máy ảnh",
    images: ["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop"],
    rating: 4.7,
    reviewCount: 31,
    location: {
      address: "Quận 7, TP.HCM", 
      city: "Ho Chi Minh City",
      district: "District 7",
      coordinates: {
        lat: 10.7427,
        lng: 106.7191
      }
    },
    ownerId: null,
    specifications: {
      payload: "3kg",
      batteryLife: "12 hours",
      weight: "1.3kg",
      compatibility: "DSLR/Mirrorless"
    },
    policies: {
      cancellation: "Miễn phí hủy trong 24h",
      deposit: 1000000,
      insurance: true
    },
    availability: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Lens Canon 24-70mm f/2.8",
    category: "lens",
    brand: "Canon",
    model: "EF 24-70mm f/2.8L",
    pricePerDay: 150000,
    description: "Ống kính zoom chuyên nghiệp, khẩu độ lớn",
    images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop"],
    rating: 4.6,
    reviewCount: 42,
    location: {
      address: "Quận Bình Thạnh, TP.HCM",
      city: "Ho Chi Minh City", 
      district: "Binh Thanh District",
      coordinates: {
        lat: 10.8012,
        lng: 106.7109
      }
    },
    ownerId: null,
    specifications: {
      focalLength: "24-70mm",
      aperture: "f/2.8",
      mount: "Canon EF",
      weight: "805g"
    },
    policies: {
      cancellation: "Miễn phí hủy trong 24h",
      deposit: 800000,
      insurance: true
    },
    availability: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Lighting Kit Godox",
    category: "lighting",
    brand: "Godox",
    model: "SL-60W Kit",
    pricePerDay: 180000,
    description: "Bộ đèn LED chuyên nghiệp cho studio",
    images: ["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop"],
    rating: 4.5,
    reviewCount: 28,
    location: {
      address: "Quận Tân Bình, TP.HCM",
      city: "Ho Chi Minh City",
      district: "Tan Binh District", 
      coordinates: {
        lat: 10.8142,
        lng: 106.6438
      }
    },
    ownerId: null,
    specifications: {
      power: "60W",
      colorTemperature: "5600K",
      includes: "2x Lights, 2x Stands, 2x Softboxes",
      weight: "3.5kg"
    },
    policies: {
      cancellation: "Miễn phí hủy trong 24h",
      deposit: 900000,
      insurance: true
    },
    availability: "available",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db("vshare");
    const equipmentCollection = db.collection("equipment");
    
    // Clear existing data
    await equipmentCollection.deleteMany({});
    console.log("Cleared existing equipment data");
    
    // Insert sample data
    const result = await equipmentCollection.insertMany(sampleEquipment);
    console.log(`Inserted ${result.insertedCount} equipment items`);
    
    // Create indexes for better search performance
    await equipmentCollection.createIndex({ title: "text", description: "text", brand: "text" });
    await equipmentCollection.createIndex({ "location.coordinates": "2dsphere" });
    await equipmentCollection.createIndex({ category: 1 });
    await equipmentCollection.createIndex({ pricePerDay: 1 });
    await equipmentCollection.createIndex({ rating: -1 });
    
    console.log("Created search indexes");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);