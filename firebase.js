const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');

admin.initializeApp({
  credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

const pubsub = new PubSub({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

module.exports = { bucket, pubsub };
