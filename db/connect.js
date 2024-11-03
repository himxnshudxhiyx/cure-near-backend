// const mongoose = require("mongoose");



// const connectDB = (url) => {
//     console.log("Connect DB");
//     return mongoose.connect(url);
// }

// module.exports = connectDB;

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mynotes-dss-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
module.exports = db;