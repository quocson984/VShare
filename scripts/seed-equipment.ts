import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('MONGODB_URI loaded:', !!process.env.MONGODB_URI);

import { connectMongoDB } from '../src/lib/mongodb';
import { EquipmentModel } from '../src/models/equipment';
import { AccountModel } from '../src/models/account';

const sampleEquipment = [
  {
    title: 'Canon EOS C200',
    brand: 'Canon',
    model: 'EOS C200',
    description: 'Professional cinema camera with 4K recording capabilities. Perfect for filmmaking, documentaries, and commercial projects.',
    images: [
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'
    ],
    category: 'camera',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [106.7017555, 10.7758439], // Quận 1, TP.HCM
      address: 'Quận 1, Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Sensor', value: 'Super 35mm CMOS' },
      { name: 'Resolution', value: '4K UHD' },
      { name: 'ISO Range', value: '100-102400' },
      { name: 'Recording Format', value: 'Cinema RAW Light' }
    ],
    pricePerDay: 800000,
    pricePerWeek: 4500000,
    pricePerMonth: 15000000,
    replacementPrice: 120000000,
    deposit: 2000000,
    status: 'available'
  },
  {
    title: 'Sony FX6',
    brand: 'Sony',
    model: 'FX6',
    description: 'Full-frame professional camcorder with exceptional low-light performance and advanced autofocus.',
    images: [
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800'
    ],
    category: 'camera',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [106.6834971, 10.7626545], // Quận 3, TP.HCM
      address: 'Quận 3, Thành phố Hồ Chí Minh',
      district: 'Quận 3',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Sensor', value: 'Full-frame CMOS' },
      { name: 'Resolution', value: '4K UHD' },
      { name: 'ISO Range', value: '100-409600' },
      { name: 'Recording Format', value: 'XAVC-I' }
    ],
    pricePerDay: 1200000,
    pricePerWeek: 6800000,
    pricePerMonth: 22000000,
    replacementPrice: 180000000,
    deposit: 3000000,
    status: 'available'
  },
  {
    title: 'ARRI Lighting Kit Professional',
    brand: 'ARRI',
    model: 'SkyPanel S30-C',
    description: 'Professional LED lighting kit with color temperature control. Includes stands, diffusers, and barn doors.',
    images: [
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'
    ],
    category: 'lighting',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [106.6916573, 10.7379469], // Quận 7, TP.HCM
      address: 'Quận 7, Thành phố Hồ Chí Minh',
      district: 'Quận 7',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Power', value: '200W LED' },
      { name: 'Color Temperature', value: '2800K-10000K' },
      { name: 'Dimming', value: '0-100%' },
      { name: 'Beam Angle', value: '115°' }
    ],
    pricePerDay: 600000,
    pricePerWeek: 3200000,
    pricePerMonth: 10000000,
    replacementPrice: 45000000,
    deposit: 1000000,
    status: 'available'
  },
  {
    title: 'Canon EF 24-70mm f/2.8L II USM',
    brand: 'Canon',
    model: '24-70mm f/2.8L II USM',
    description: 'Professional standard zoom lens with excellent image quality and weather sealing.',
    images: [
      'https://images.unsplash.com/photo-1606983340077-e4c5bbb7e5dd?w=800'
    ],
    category: 'lens',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [106.7297615, 10.7543222], // Quận 2, TP.HCM
      address: 'Quận 2, Thành phố Hồ Chí Minh',
      district: 'Quận 2',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Focal Length', value: '24-70mm' },
      { name: 'Maximum Aperture', value: 'f/2.8' },
      { name: 'Mount', value: 'Canon EF' },
      { name: 'Weight', value: '805g' }
    ],
    pricePerDay: 250000,
    pricePerWeek: 1400000,
    pricePerMonth: 4500000,
    replacementPrice: 35000000,
    deposit: 500000,
    status: 'available'
  },
  {
    title: 'DJI Mavic 3 Pro Drone',
    brand: 'DJI',
    model: 'Mavic 3 Pro',
    description: 'Professional drone with Hasselblad camera and tri-camera system. Perfect for aerial cinematography.',
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800'
    ],
    category: 'camera', // or create 'drone' category
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [106.7081842, 10.8007768], // Quận Bình Thạnh, TP.HCM
      address: 'Quận Bình Thạnh, Thành phố Hồ Chí Minh',
      district: 'Quận Bình Thạnh',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Camera', value: 'Hasselblad L2D-20c' },
      { name: 'Video Resolution', value: '5.1K/4K' },
      { name: 'Flight Time', value: '43 minutes' },
      { name: 'Range', value: '15km' }
    ],
    pricePerDay: 900000,
    pricePerWeek: 5000000,
    pricePerMonth: 16000000,
    replacementPrice: 85000000,
    deposit: 2000000,
    status: 'available'
  },
  {
    title: 'RODE VideoMic Pro Plus',
    brand: 'RODE',
    model: 'VideoMic Pro Plus',
    description: 'Professional shotgun microphone with auto-sensing 3.5mm/USB connectivity and built-in rechargeable battery.',
    images: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800'
    ],
    category: 'audio',
    quantity: 2,
    location: {
      type: 'Point',
      coordinates: [106.6589966, 10.8013546], // Quận Tân Bình, TP.HCM
      address: 'Quận Tân Bình, Thành phố Hồ Chí Minh',
      district: 'Quận Tân Bình',
      city: 'Thành phố Hồ Chí Minh'
    },
    specs: [
      { name: 'Type', value: 'Shotgun' },
      { name: 'Frequency Response', value: '20Hz-20kHz' },
      { name: 'Connectivity', value: '3.5mm/USB-C' },
      { name: 'Battery Life', value: '100 hours' }
    ],
    pricePerDay: 150000,
    pricePerWeek: 800000,
    pricePerMonth: 2500000,
    replacementPrice: 8500000,
    deposit: 200000,
    status: 'available'
  },
  {
    title: 'Sony FE 85mm f/1.4 GM',
    brand: 'Sony',
    model: 'FE 85mm f/1.4 GM',
    description: 'Premium portrait lens with exceptional bokeh and sharpness. Perfect for portrait photography and cinematography.',
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
    ],
    category: 'lens',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [105.8542441, 21.0283334], // Ba Đình, Hà Nội
      address: 'Ba Đình, Hà Nội',
      district: 'Ba Đình',
      city: 'Hà Nội'
    },
    specs: [
      { name: 'Focal Length', value: '85mm' },
      { name: 'Maximum Aperture', value: 'f/1.4' },
      { name: 'Mount', value: 'Sony FE' },
      { name: 'Weight', value: '820g' }
    ],
    pricePerDay: 350000,
    pricePerWeek: 1950000,
    pricePerMonth: 6200000,
    replacementPrice: 42000000,
    deposit: 800000,
    status: 'available'
  },
  {
    title: 'Blackmagic URSA Mini Pro 12K',
    brand: 'Blackmagic Design',
    model: 'URSA Mini Pro 12K',
    description: 'Professional cinema camera with 12K resolution and dual CFast/SD card recording.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'
    ],
    category: 'camera',
    quantity: 1,
    location: {
      type: 'Point',
      coordinates: [108.2208333, 16.0544444], // Hải Châu, Đà Nẵng
      address: 'Hải Châu, Đà Nẵng',
      district: 'Hải Châu',
      city: 'Đà Nẵng'
    },
    specs: [
      { name: 'Sensor', value: 'Super 35 CMOS' },
      { name: 'Resolution', value: '12K' },
      { name: 'ISO Range', value: '200-25600' },
      { name: 'Recording Format', value: 'Blackmagic RAW' }
    ],
    pricePerDay: 1500000,
    pricePerWeek: 8500000,
    pricePerMonth: 28000000,
    replacementPrice: 200000000,
    deposit: 4000000,
    status: 'available'
  }
];

async function seedEquipment() {
  try {
    await connectMongoDB();
    
    console.log('Creating sample owner accounts...');
    
    // Create sample owner accounts
    const owners = [
      {
        credentials: {
          email: 'owner1@vshare.com',
          password: 'hashedpassword123'
        },
        personalInfo: {
          firstName: 'Nguyễn',
          lastName: 'Văn A',
          phone: '+84901234567',
          dateOfBirth: new Date('1990-01-15')
        },
        verification: {
          verificationLevel: 'verified'
        },
        registrationStage: 4
      },
      {
        credentials: {
          email: 'owner2@vshare.com',
          password: 'hashedpassword123'
        },
        personalInfo: {
          firstName: 'Trần',
          lastName: 'Thị B',
          phone: '+84902345678',
          dateOfBirth: new Date('1988-05-22')
        },
        verification: {
          verificationLevel: 'verified'
        },
        registrationStage: 4
      },
      {
        credentials: {
          email: 'owner3@vshare.com',
          password: 'hashedpassword123'
        },
        personalInfo: {
          firstName: 'Lê',
          lastName: 'Văn C',
          phone: '+84903456789',
          dateOfBirth: new Date('1985-11-08')
        },
        verification: {
          verificationLevel: 'verified'
        },
        registrationStage: 4
      }
    ];

    // Clear existing data
    await EquipmentModel.deleteMany({});
    await AccountModel.deleteMany({ 'credentials.email': { $in: owners.map(o => o.credentials.email) } });

    // Insert owners
    const createdOwners = await AccountModel.insertMany(owners);
    console.log(`Created ${createdOwners.length} owner accounts`);

    // Add owner IDs to equipment
    const equipmentWithOwners = sampleEquipment.map((equipment, index) => ({
      ...equipment,
      ownerId: createdOwners[index % createdOwners.length]._id
    }));

    // Insert equipment
    const createdEquipment = await EquipmentModel.insertMany(equipmentWithOwners);
    console.log(`Created ${createdEquipment.length} equipment items`);

    console.log('Sample data seeded successfully!');
    console.log('\nSample equipment:');
    createdEquipment.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - ${item.location.address} - ${item.pricePerDay.toLocaleString('vi-VN')}đ/ngày`);
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedEquipment();