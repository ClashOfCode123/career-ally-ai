import 'dotenv/config';
console.log("Password in ENV:", process.env.MONGO_URI.split(':')[2].split('@')[0]);