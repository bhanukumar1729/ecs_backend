require('dotenv').config();
const mongoose = require('mongoose');
const Availability = require('../models/Availability');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters, pathParameters } = event;
  const { id } = pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({})
    };
  }

  try {
    if (httpMethod === 'POST' && path === '/.netlify/functions/availability') {
      const { date, freeSlots, message } = body;
      const existingEntry = await Availability.findOne({ date });

      if (existingEntry) {
        existingEntry.freeSlots = freeSlots;
        existingEntry.message = message;
        await existingEntry.save();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Data updated successfully', data: existingEntry }),
        };
      } else {
        const newAvailability = new Availability({ date, freeSlots, message });
        await newAvailability.save();
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ success: true, message: 'Data added successfully', data: newAvailability }),
        };
      }
    }

    if (httpMethod === 'GET' && path === '/.netlify/functions/availability') {
      const { date } = queryStringParameters;

      if (date) {
        const availabilityData = await Availability.findOne({ date });
        if (availabilityData) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(availabilityData),
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'No data found for this date' }),
          };
        }
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Date parameter is required' }),
        };
      }
    }

    // New route to get all data
    if (httpMethod === 'GET' && path === '/.netlify/functions/availability/all') {
      const allData = await Availability.find();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allData),
      };
    }

    if (httpMethod === 'PUT' && path === `/api/availability/${id}`) {
      const { date, freeSlots, message } = body;

      const updatedAvailability = await Availability.findByIdAndUpdate(
        id,
        { date, freeSlots, message },
        { new: true }
      );

      if (!updatedAvailability) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Entry not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data updated successfully', updatedAvailability }),
      };
    }

    if (httpMethod === 'DELETE' && path === `/api/availability/${id}`) {
      const deletedAvailability = await Availability.findByIdAndDelete(id);

      if (!deletedAvailability) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Entry not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data deleted successfully' }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Unsupported HTTP method or path' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error', error }),
    };
  }
};
