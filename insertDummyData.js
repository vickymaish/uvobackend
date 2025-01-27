const mongoose = require('mongoose');
const Order = require('./models/order');


const newDummyData = [
  {
    customerName: 'Account 1',
    stats: 'Active',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    pages: 10,
    topic: 'Academic',
    cpp: 6,
    totalPrice: 10 * 6,
    status: 'Pending',
  },
  {
    customerName: 'Account 2',
    stats: 'Completed',
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    pages: 20,
    topic: 'Blog Writing',
    cpp: 6,
    totalPrice: 20 * 6,
    status: 'Completed',
  },
  {
    customerName: 'Account 3',
    stats: 'Active',
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    pages: 15,
    topic: 'History',
    cpp: 6,
    totalPrice: 15 * 6,
    status: 'Pending',
  },
  {
    customerName: 'Account 4',
    stats: 'Completed',
    deadline: new Date(Date.now() + 7 * 60 * 60 * 1000), // 7 hours from now
    pages: 25,
    topic: 'Literature',
    cpp: 6,
    totalPrice: 25 * 6,
    status: 'Completed',
  },
  {
    customerName: 'Account 5',
    stats: 'Active',
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    pages: 30,
    topic: 'Physics',
    cpp: 6,
    totalPrice: 30 * 6,
    status: 'Pending',
  },
  {
    customerName: 'Account 6',
    stats: 'Completed',
    deadline: new Date(Date.now() + 9 * 60 * 60 * 1000), // 9 hours from now
    pages: 35,
    topic: 'Chemistry',
    cpp: 6,
    totalPrice: 35 * 6,
    status: 'Completed',
  },
  {
    customerName: 'Account 7',
    stats: 'Active',
    deadline: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
    pages: 40,
    topic: 'Biology',
    cpp: 6,
    totalPrice: 40 * 6,
    status: 'Pending',
  },
];

// function insertNewDummyData() {
//   Order.insertMany(newDummyData)
//     .then(() => {
//       console.log('New dummy data inserted');
//       mongoose.connection.close();
//     })
//     .catch((error) => {
//       console.error('Error inserting new dummy data:', error);
//     });
// }