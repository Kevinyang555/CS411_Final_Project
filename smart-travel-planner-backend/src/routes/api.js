import express from 'express';
import { getTripSummary } from '../controllers/tripController.js';
import { userLogin } from '../controllers/userController.js';
import {
    createTripWithFirstItem,
    addItineraryItem,
    getUserTrips,
    getTripWithItinerary,
    updateItineraryItem,
    removeItineraryItem,
    deleteTrip
} from '../controllers/tripItineraryController.js';

const router = express.Router();

// User login
router.post('/userLogin', userLogin);

// Trip planning - get weather, flights, attractions
router.post('/trip-summary', getTripSummary);

// Trip CRUD
router.post('/trips', createTripWithFirstItem);
router.get('/trips/user/:userId', getUserTrips);
router.get('/trips/:tripId', getTripWithItinerary);
router.delete('/trips/:tripId', deleteTrip);

// Itinerary CRUD
router.post('/trips/:tripId/itinerary', addItineraryItem);
router.put('/trips/:tripId/itinerary/:itemId', updateItineraryItem);
router.delete('/trips/:tripId/itinerary/:itemId', removeItineraryItem);

export default router;
