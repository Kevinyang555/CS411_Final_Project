/**
 * API Routes
 *
 * This file defines all API endpoints and connects them to controller functions.
 *
 * Routes define WHAT endpoints exist.
 * Controllers define HOW those endpoints behave.
 */

import express from 'express';
import { getTripSummary } from '../controllers/tripController.js';
import { userLogin } from '../controllers/userController.js'
const router = express.Router();

// ==================== TRIP PLANNING ENDPOINTS ====================

/**
 * POST /api/trip-summary
 *
 * Main trip planning endpoint. User provides:
 * - origin, destination (city names)
 * - startDate, endDate
 * - budget, currency
 * - tempMin, tempMax (in Celsius - frontend converts from Fahrenheit)
 * - crowdPreference
 * - maxFlightPrice (optional)
 *
 * Returns:
 * - Location info
 * - Weather summary and daily forecast
 * - Flight options
 * - Attractions with crowd data
 * - Best time to visit recommendation
 */

// For login 

router.post('/userLogin', userLogin);

router.post('/trip-summary', getTripSummary);

// ==================== EXPLORE ENDPOINTS ====================
// TODO: Implement these endpoints later
// router.get('/explore/sunny-cities', getSunnyCities);
// router.get('/explore/cold-cities', getColdCities);
// router.get('/explore/cheap-flights-good-weather', getCheapFlightsGoodWeather);
// router.get('/explore/monthly-route-avg', getMonthlyRouteAvg);


export default router;
