import pool from '../config/database.js';

// Create a new trip with the first itinerary item using stored procedure
export async function createTripWithFirstItem(req, res) {
    const connection = await pool.getConnection();

    try {
        const {
            userId,
            tripName,
            origin,
            destination,
            startDate,
            endDate,
            attraction,
            visitDate,
            startTime,
            endTime,
            notes
        } = req.body;

        if (!userId || !tripName || !attraction?.id) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId', 'tripName', 'attraction.id']
            });
        }

        await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();

        const [result] = await connection.query(
            `CALL CreateTripWithFirstItem(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @trip_id, @item_id)`,
            [
                userId,
                tripName,
                origin || null,
                destination || null,
                startDate || null,
                endDate || null,
                attraction.id,
                visitDate || startDate,
                startTime || '10:00',
                endTime || '12:00',
                notes || null
            ]
        );

        const [[outputParams]] = await connection.query(
            'SELECT @trip_id AS tripId, @item_id AS itemId'
        );

        await connection.commit();

        console.log(`Created trip ${outputParams.tripId} with first itinerary item for user ${userId}`);

        res.json({
            success: true,
            tripId: outputParams.tripId,
            itemId: outputParams.itemId,
            tripDetails: result[0]?.[0] || null
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error in createTripWithFirstItem:', err);

        if (err.sqlState === '45000') {
            return res.status(400).json({ error: err.message });
        }

        res.status(500).json({
            error: 'Failed to create trip',
            message: err.message
        });
    } finally {
        connection.release();
    }
}

// Add an itinerary item to an existing trip using stored procedure
export async function addItineraryItem(req, res) {
    try {
        const {
            tripId,
            attraction,
            visitDate,
            startTime,
            endTime,
            notes
        } = req.body;

        if (!tripId || !attraction?.id) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['tripId', 'attraction.id']
            });
        }

        const [result] = await pool.query(
            `CALL AddItineraryItem(?, ?, ?, ?, ?, ?, @item_id)`,
            [
                tripId,
                attraction.id,
                visitDate,
                startTime || '10:00',
                endTime || '12:00',
                notes || null
            ]
        );

        const [[outputParams]] = await pool.query('SELECT @item_id AS itemId');

        console.log(`Added itinerary item ${outputParams.itemId} to trip ${tripId}`);

        res.json({
            success: true,
            tripId,
            itemId: outputParams.itemId,
            itemDetails: result[0]?.[0] || null
        });

    } catch (err) {
        console.error('Error in addItineraryItem:', err);

        if (err.sqlState === '45000') {
            return res.status(400).json({ error: 'Trip does not exist' });
        }
        if (err.sqlState === '45001') {
            return res.status(400).json({ error: 'Attraction already in itinerary' });
        }

        res.status(500).json({
            error: 'Failed to add itinerary item',
            message: err.message
        });
    }
}

// Get all trips for a user with itinerary stats (item_count maintained by triggers)
export async function getUserTrips(req, res) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const [result] = await pool.query(
            'CALL GetUserTripsWithStats(?)',
            [userId]
        );

        const trips = result[0] || [];

        console.log(`Found ${trips.length} trips for user ${userId}`);

        res.json({
            userId: parseInt(userId),
            trips: trips.map(t => ({
                tripId: t.trip_id,
                tripName: t.trip_title,
                origin: t.origin,
                destination: t.destination,
                startDate: t.start_date,
                endDate: t.end_date,
                createdAt: t.created_at,
                lastModified: t.last_modified,
                itineraryCount: t.item_count ?? t.itinerary_count,
                categories: t.categories
            }))
        });

    } catch (err) {
        console.error('Error in getUserTrips:', err);
        res.status(500).json({
            error: 'Failed to get user trips',
            message: err.message
        });
    }
}

// Get a single trip with full itinerary details using transaction
export async function getTripWithItinerary(req, res) {
    const connection = await pool.getConnection();

    try {
        const { tripId } = req.params;

        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();

        // Get trip details with user info
        const [[trip]] = await connection.query(`
            SELECT
                t.trip_id,
                t.trip_title,
                t.origin,
                t.destination,
                t.start_date,
                t.end_date,
                t.budget,
                t.currency,
                u.user_id,
                u.full_name AS user_name,
                u.email AS user_email
            FROM Trip t
            JOIN UserAccount u ON t.user_id = u.user_id
            WHERE t.trip_id = ?
        `, [tripId]);

        if (!trip) {
            await connection.rollback();
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Get itinerary items with attraction details
        const [itineraryItems] = await connection.query(`
            SELECT
                i.item_id,
                i.visit_date,
                i.start_time,
                i.end_time,
                i.notes,
                i.sort_order,
                a.attraction_id,
                a.name AS attraction_name,
                a.category,
                a.rating,
                l.name AS city,
                l.country
            FROM ItineraryItem i
            JOIN Attraction a ON i.attraction_id = a.attraction_id
            JOIN Location l ON a.location_id = l.location_id
            WHERE i.trip_id = ?
            ORDER BY i.visit_date, i.sort_order, i.start_time
        `, [tripId]);

        await connection.commit();

        res.json({
            trip: {
                tripId: trip.trip_id,
                tripName: trip.trip_title,
                origin: trip.origin,
                destination: trip.destination,
                startDate: trip.start_date,
                endDate: trip.end_date,
                budget: trip.budget,
                currency: trip.currency,
                user: {
                    userId: trip.user_id,
                    name: trip.user_name,
                    email: trip.user_email
                }
            },
            itinerary: itineraryItems.map(item => ({
                itemId: item.item_id,
                visitDate: item.visit_date,
                startTime: item.start_time,
                endTime: item.end_time,
                notes: item.notes,
                sortOrder: item.sort_order,
                attraction: {
                    id: item.attraction_id,
                    name: item.attraction_name,
                    category: item.category,
                    rating: item.rating,
                    city: item.city,
                    country: item.country
                }
            }))
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error in getTripWithItinerary:', err);
        res.status(500).json({
            error: 'Failed to get trip details',
            message: err.message
        });
    } finally {
        connection.release();
    }
}

// Update an itinerary item
export async function updateItineraryItem(req, res) {
    try {
        const { tripId, itemId } = req.params;
        const { visitDate, startTime, endTime, notes } = req.body;

        const [result] = await pool.query(`
            UPDATE ItineraryItem
            SET visit_date = COALESCE(?, visit_date),
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                notes = COALESCE(?, notes)
            WHERE trip_id = ? AND item_id = ?
        `, [visitDate, startTime, endTime, notes, tripId, itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Itinerary item not found' });
        }

        res.json({ success: true, message: 'Itinerary item updated' });

    } catch (err) {
        console.error('Error in updateItineraryItem:', err);
        res.status(500).json({
            error: 'Failed to update itinerary item',
            message: err.message
        });
    }
}

// Remove an itinerary item (triggers decrement item_count)
export async function removeItineraryItem(req, res) {
    try {
        const { tripId, itemId } = req.params;

        const [result] = await pool.query(
            'DELETE FROM ItineraryItem WHERE trip_id = ? AND item_id = ?',
            [tripId, itemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Itinerary item not found' });
        }

        res.json({ success: true, message: 'Itinerary item removed' });

    } catch (err) {
        console.error('Error in removeItineraryItem:', err);
        res.status(500).json({
            error: 'Failed to remove itinerary item',
            message: err.message
        });
    }
}

// Delete a trip (cascade deletes itinerary items)
export async function deleteTrip(req, res) {
    try {
        const { tripId } = req.params;

        const [result] = await pool.query(
            'DELETE FROM Trip WHERE trip_id = ?',
            [tripId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        res.json({ success: true, message: 'Trip deleted' });

    } catch (err) {
        console.error('Error in deleteTrip:', err);
        res.status(500).json({
            error: 'Failed to delete trip',
            message: err.message
        });
    }
}
