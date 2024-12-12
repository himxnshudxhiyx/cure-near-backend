const Booking = require("../models/booking");
const Doctors = require("../models/doctors");
const moment = require('moment'); // You can use moment for easy date-time manipulation

const bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time } = req.body; // Extract doctorId, date, and time from request body
        const userId = req.user.id; // Get the userId from the authenticated user

        // Validate the input fields
        if (!doctorId || !date || !time) {
            return res.status(400).json({ message: "Doctor, date, and time are required." });
        }

        // Validate if the doctor exists in the database
        const doctor = await Doctors.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found.", status: 404 });
        }

        // Convert doctor's working hours into moment objects for easy comparison
        const workingStartTime = moment(`${date} ${doctor.workingTime.start}`, 'YYYY-MM-DD hh:mm A');
        const workingEndTime = moment(`${date} ${doctor.workingTime.end}`, 'YYYY-MM-DD hh:mm A');

        // Convert the provided appointment time into a moment object for comparison
        const appointmentTime = moment(`${date} ${time}`, 'YYYY-MM-DD hh:mm A');

        // Check if the appointment time is within the doctor's working hours
        if (appointmentTime.isBefore(workingStartTime) || appointmentTime.isAfter(workingEndTime)) {
            return res.status(400).json({
                message: `The chosen time must be within the doctor's working hours (${doctor.workingTime.start} - ${doctor.workingTime.end}).`,
                status: 400
            });
        }

        // Check if there's already a booking for this doctor at the same time on the same date
        const existingBooking = await Booking.findOne({
            doctorId,
            date,
            time,
            status: { $in: ['Pending', 'Confirmed'] } // Only consider Pending or Confirmed status
        });
        
        if (existingBooking) {
            return res.status(400).json({
                message: "Please choose another time, doctor is busy at the provided time.",
                status: 400
            });
        }

        // Create a new booking document
        const newBooking = new Booking({
            userId,
            doctorId,
            date,
            time
        });

        // Save the booking to the database
        await newBooking.save();

        res.status(201).json({
            message: "Appointment booked successfully!",
            booking: newBooking,
            status: 201
        });
    } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).json({ message: "An error occurred while booking the appointment.", error: error.message, status: 500 });
    }
};

const getBookingsOfUser = async (req, res) => {
    try {
        const userId = req.user.id; // Get the authenticated user's ID
        const { status } = req.query; // Get the status from the query parameter (0, 1, 2, or 3)

        // Define a status filter based on the query parameter
        let statusFilter = {};

        if (status === '0') {
            // Filter for Pending and Confirmed bookings
            statusFilter = { status: { $in: ['Pending', 'Confirmed'] } };
        } else if (status === '1') {
            // Filter for Completed bookings
            statusFilter = { status: 'Completed' };
        } else if (status === '2') {
            // Filter for Cancelled bookings
            statusFilter = { status: 'Cancelled' };
        } else if (status === '3') {
            // No filter (all bookings)
            statusFilter = {};
        }

        // Fetch bookings based on the userId and status filter
        const bookings = await Booking.find({ userId, ...statusFilter })
        .populate({
            path: 'doctorId',
            select: 'name category', // Fields from the doctor document
            populate: {
                path: 'hospitalId', // Populate the hospitalId field (which references the Hospital model)
                select: 'name address location' // Specify the fields you want from the Hospital model (name and address)
            }
        });
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found", status: 404 });
        }

        res.status(200).json({
            message: "Bookings retrieved successfully",
            bookings,
            totalRecords: bookings.length,
            status: 200
        });
    } catch (error) {
        console.error("Error retrieving bookings:", error);
        res.status(500).json({ message: "An error occurred while fetching bookings.", error: error.message, status: 500 });
    }
}

const getAvailableTimeSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.body; // Extract doctorId and date from the request body

        // Validate input
        if (!doctorId || !date) {
            return res.status(400).json({ message: "Doctor ID and date are required." });
        }

        // Find the doctor's working hours
        const doctor = await Doctors.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found.", status: 404 });
        }

        // Parse the working hours
        const startTime = moment(`${date} ${doctor.workingTime.start}`, 'YYYY-MM-DD hh:mm A');
        const endTime = moment(`${date} ${doctor.workingTime.end}`, 'YYYY-MM-DD hh:mm A');

        // Validate that the start time is before the end time
        if (startTime.isAfter(endTime)) {
            return res.status(400).json({ message: "Invalid working hours. Start time should be before end time." });
        }

        // Generate time slots in 15-minute intervals
        let availableSlots = [];
        let currentSlot = startTime;

        while (currentSlot.isBefore(endTime)) {
            availableSlots.push(currentSlot.format('hh:mm A'));
            currentSlot = currentSlot.add(15, 'minutes'); // Move to the next 15-minute interval
        }

        // Check if the slots are already booked
        const bookedAppointments = await Booking.find({
            doctorId,
            date: moment(date).format('YYYY-MM-DD'), // Match the date
            time: { $in: availableSlots }, // Find if any of these available slots are already booked
            status: { $in: ['Pending', 'Confirmed'] } // Only consider appointments that are Pending or Confirmed
        });

        // Remove the booked slots from the available slots
        const bookedTimes = bookedAppointments.map(appointment => appointment.time);
        availableSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));

        // Return available slots
        res.status(200).json({
            message: "Available time slots retrieved successfully",
            availableSlots,
            status: 200
        });
    } catch (error) {
        console.error("Error retrieving available time slots:", error);
        res.status(500).json({ message: "An error occurred", error: error.message, status: 500 });
    }
}

module.exports = { bookAppointment, getBookingsOfUser, getAvailableTimeSlots};