const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Open Meteo API endpoint and parameters
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const LATITUDE = '35.6944';  // Latitude of the city
const LONGITUDE = '51.4215'; // Longitude of the city
const PARAMETERS = 'minutely_15=rain';

// Function to check if it's raining right now
const isRainingNow = async () => {
    try {
        const response = await axios.get(`${BASE_URL}?latitude=${LATITUDE}&longitude=${LONGITUDE}&${PARAMETERS}`);
        const data = response.data;

        // Check the latest entry in the minutely_15 data for rain
        const rainData = data.minutely_15.rain;
        const currentRain = rainData[rainData.length - 1];

        return currentRain > 0;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return false;
    }
};

// Define an endpoint to get the rain status
app.get('/is-it-raining', async (req, res) => {
    const raining = await isRainingNow();
   res.json({ raining });
});