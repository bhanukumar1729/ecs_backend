require('dotenv').config();
const mongoose = require('mongoose');
const Availability = require('../models/Availability');

mongoose.connect(process.env.MONGO_URI);

exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters, pathParameters } = event;
  const { id } = pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (httpMethod === 'POST' && path === '/.netlify/functions/availability') {
      // POST /api/availability - Add or Update availability
      const { date, freeSlots, message } = body;
      const existingEntry = await Availability.findOne({ date });

      if (existingEntry) {
        existingEntry.freeSlots = freeSlots;
        existingEntry.message = message;
        await existingEntry.save();
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Data updated successfully', data: existingEntry }),
        };
      } else {
        const newAvailability = new Availability({ date, freeSlots, message });
        await newAvailability.save();
        return {
          statusCode: 201,
          body: JSON.stringify({ success: true, message: 'Data added successfully', data: newAvailability }),
        };
      }
    }

    if (httpMethod === 'GET' && path === '/.netlify/functions/availability') {
      // GET /api/availability - Get availability by date
      const { date } = queryStringParameters;

      if (date) {
        const availabilityData = await Availability.findOne({ date });
        if (availabilityData) {
          return {
            statusCode: 200,
            body: JSON.stringify(availabilityData),
          };
        } else {
          return {
            statusCode: 404,
            body: JSON.stringify({ success: false, message: 'No data found for this date' }),
          };
        }
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Date parameter is required' }),
        };
      }
    }

    if (httpMethod === 'PUT' && path === `/api/availability/${id}`) {
      // PUT /api/availability/:id - Update specific availability
      const { date, freeSlots, message } = body;

      const updatedAvailability = await Availability.findByIdAndUpdate(
        id,
        { date, freeSlots, message },
        { new: true }
      );

      if (!updatedAvailability) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Entry not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Data updated successfully', updatedAvailability }),
      };
    }

    if (httpMethod === 'DELETE' && path === `/api/availability/${id}`) {
      // DELETE /api/availability/:id - Delete specific availability
      const deletedAvailability = await Availability.findByIdAndDelete(id);

      if (!deletedAvailability) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Entry not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Data deleted successfully' }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Unsupported HTTP method or path' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error', error }),
    };
  }
};
