const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  freeSlots: [
    {
      slotNo:{
        type:Number,
        required:true,
        default:8,
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      }
    }
  ],
  message: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
