create extension if not exists "pgcrypto";

create table public.flights (
  id uuid not null default gen_random_uuid (),
  flight_number text not null,
  airline text not null,
  from_airport text not null,
  to_airport text not null,
  departure_time timestamp with time zone not null,
  arrival_time timestamp with time zone not null,
  duration_minutes integer not null,
  stops integer not null default 0,
  aircraft_type text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint flights_pkey primary key (id)
) TABLESPACE pg_default;

create table public.flight_cabins (
  id uuid not null default gen_random_uuid (),
  flight_id uuid null,
  cabin_class text not null,
  price numeric(10, 2) not null,
  available_seats integer not null,
  total_seats integer not null,
  created_at timestamp with time zone not null default now(),
  constraint flight_cabins_pkey primary key (id),
  constraint flight_cabins_flight_id_fkey foreign KEY (flight_id) references flights (id) on delete CASCADE,
  constraint flight_cabins_cabin_class_check check (
    (
      cabin_class = any (
        array[
          'Economy'::text,
          'Premium Economy'::text,
          'Business'::text,
          'First'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  trip_type text not null,
  outbound_flight_id uuid null,
  return_flight_id uuid null,
  cabin_class text not null,
  contact_email text not null,
  contact_phone text null,
  total_price numeric(10, 2) not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_outbound_flight_id_fkey foreign KEY (outbound_flight_id) references flights (id) on delete set null,
  constraint bookings_return_flight_id_fkey foreign KEY (return_flight_id) references flights (id) on delete set null,
  constraint bookings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint bookings_cabin_class_check check (
    (
      cabin_class = any (
        array[
          'Economy'::text,
          'Premium Economy'::text,
          'Business'::text,
          'First'::text
        ]
      )
    )
  ),
  constraint bookings_trip_type_check check (
    (
      trip_type = any (array['oneway'::text, 'roundtrip'::text])
    )
  )
) TABLESPACE pg_default;


create table public.passengers (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  passenger_number integer not null,
  full_name character varying(255) not null,
  age integer not null,
  gender character varying(20) not null,
  passenger_type character varying(20) not null default 'Adult'::character varying,
  passport_number character varying(50) null,
  nationality character varying(100) null,
  special_requests text null,
  seat_preference character varying(20) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint passengers_pkey primary key (id),
  constraint passengers_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint passengers_age_check check (
    (
      (age >= 0)
      and (age <= 150)
    )
  ),
  constraint passengers_gender_check check (
    (
      (gender)::text = any (
        (
          array[
            'Male'::character varying,
            'Female'::character varying,
            'Other'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint passengers_passenger_type_check check (
    (
      (passenger_type)::text = any (
        (
          array[
            'Adult'::character varying,
            'Child'::character varying,
            'Infant'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;




create table public.payments (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  user_id uuid null,
  amount numeric(10, 2) not null,
  currency text not null default 'INR'::text,
  status text not null,
  method text not null,
  provider text null,
  provider_ref text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint payments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint payments_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'success'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;



create table public.profiles (
  id uuid not null,
  display_name text null,
  email text null,
  phone text null,
  address text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  role text null default 'user'::text,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;