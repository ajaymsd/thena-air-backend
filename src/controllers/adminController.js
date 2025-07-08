const supabase = require('../lib/supabase');

exports.getAllFlights = async (req, res) => {
  try {
    const { data: flights, error: flightError } = await supabase
      .from('flights')
      .select('*');

    if (flightError) return res.status(500).json({ error: flightError.message });

    if (!flights || flights.length === 0) return res.json([]);

    const flightIds = flights.map(f => f.id);

    const { data: cabins, error: cabinError } = await supabase
      .from('flight_cabins')
      .select('*')
      .in('flight_id', flightIds);

    if (cabinError) return res.status(500).json({ error: cabinError.message });

    const flightsWithCabins = flights.map(flight => ({
      ...flight,
      cabins: cabins.filter(c => c.flight_id === flight.id)
    }));

    res.json(flightsWithCabins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createFlight = async (req, res) => {
  const { cabins, ...flightData } = req.body;

  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .insert([flightData])
    .select()
    .single();

  if (flightError) return res.status(500).json({ error: flightError.message });

  if (cabins?.length) {
    const cabinsToInsert = cabins.map(c => ({ ...c, flight_id: flight.id }));
    const { error: cabinError } = await supabase
      .from('flight_cabins')
      .insert(cabinsToInsert);

    if (cabinError) return res.status(500).json({ error: cabinError.message });
  }

  res.status(201).json(flight);
};

exports.updateFlight = async (req, res) => {
  const { id } = req.params;
  const { cabins, ...flightData } = req.body;

  const { error: flightError } = await supabase
    .from('flights')
    .update(flightData)
    .eq('id', id);

  if (flightError) return res.status(500).json({ error: flightError.message });

  for (const cabin of cabins) {
    const { error: cabinError } = await supabase
      .from('flight_cabins')
      .update({
        cabin_class: cabin.cabin_class,
        price: cabin.price,
        available_seats: cabin.available_seats,
        total_seats: cabin.total_seats
      })
      .eq('id', cabin.id);

    if (cabinError) return res.status(500).json({ error: cabinError.message });
  }

  res.json({ message: 'Flight and cabins updated successfully' });
};

exports.deleteFlight = async (req, res) => {
  const { id } = req.params;

  try {
    const { error: cabinsError } = await supabase
      .from('flight_cabins')
      .delete()
      .eq('flight_id', id);

    if (cabinsError) return res.status(500).json({ error: cabinsError.message });

    const { data: deletedFlight, error: flightError } = await supabase
      .from('flights')
      .delete()
      .eq('id', id)
      .select();

    if (flightError) return res.status(500).json({ error: flightError.message });

    if (!deletedFlight.length) return res.status(404).json({ error: 'Flight not found' });

    res.json({ message: 'Flight and related cabins deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [{ count: totalFlights }, { count: totalBookings }, { count: totalUsers }] = await Promise.all([
      supabase.from('flights').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
    ]);

    const { data: recentFlights, error } = await supabase
      .from('flights')
      .select('id, flight_number, airline, from_airport, to_airport, departure_time, arrival_time')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      total_flights: totalFlights || 0,
      total_bookings: totalBookings || 0,
      total_users: totalUsers || 0,
      recent_flights: recentFlights || [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

exports.getBookings = async (req, res) => {
  const { page = 1, status } = req.query;
  const pageSize = 10;
  const from = (parseInt(page) - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  res.json({ bookings: data, totalPages });
};

exports.getPayments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const status = req.query.status || undefined;

  let query = supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const totalPages = count ? Math.ceil(count / limit) : 1;

  res.json({ payments: data, totalPages });
};
