-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    "notaNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    "serviceType" TEXT NOT NULL,
    "totalPrice" NUMERIC NOT NULL,
    status TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "estimatedFinishDate" TEXT NOT NULL,
    "specialRequest" TEXT,
    "deliveryMethod" TEXT NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    phone TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    "lastSeen" TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is a simple app without user auth yet)
-- WARNING: In a production app with real users, you should restrict these policies!
CREATE POLICY "Allow all operations for orders" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for customers" ON public.customers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for orders table
alter publication supabase_realtime add table public.orders;
