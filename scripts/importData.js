// importData.js
const admin = require('firebase-admin');

// IMPORTANT: Path to your service account key file
const serviceAccount = require('./serviceAccountKey.json');

// The name of your dataset file
const data = require('./cars_dataset.json');

// The name of the collection you want to create
const collectionName = 'cars';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const importData = async () => {
  try {
    console.log(`Starting to import data to ${collectionName} collection...`);
    
    for (const doc of data) {
      // Using .add() will auto-generate a document ID
      await db.collection(collectionName).add(doc);
    }
    
    console.log(`Successfully imported ${data.length} documents.`);
  } catch (error) {
    console.error('Error importing data: ', error);
  }
};

importData();