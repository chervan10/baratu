-- Create table for contact submissions
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    verified_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for email OTPs
CREATE TABLE email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);

-- Create table for visitor analytics
CREATE TABLE visitor_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    browser TEXT NOT NULL,
    browser_version TEXT NOT NULL,
    operating_system TEXT NOT NULL,
    os_version TEXT NOT NULL,
    screen_width INTEGER NOT NULL,
    screen_height INTEGER NOT NULL,
    pixel_ratio NUMERIC NOT NULL,
    language TEXT NOT NULL,
    timezone TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_visitor_analytics_visitor_id ON visitor_analytics(visitor_id);
CREATE INDEX idx_visitor_analytics_visit_date ON visitor_analytics(visit_date);
CREATE INDEX idx_visitor_analytics_country ON visitor_analytics(country);

-- Create table for admin login attempts & lockouts
CREATE TABLE admin_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT UNIQUE NOT NULL,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Analytics insertion policy
CREATE POLICY "Allow public insert tracking" ON visitor_analytics
    FOR INSERT TO anon WITH CHECK (true);

-- Analytics update policy
CREATE POLICY "Allow public update tracking" ON visitor_analytics
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Admin read policy
CREATE POLICY "Allow authenticated read analytics" ON visitor_analytics
    FOR SELECT TO authenticated USING (true);

-- Create table for orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    country TEXT NOT NULL,
    province_state TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    order_notes TEXT,
    subtotal NUMERIC NOT NULL,
    shipping_cost NUMERIC NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    discount NUMERIC DEFAULT 0 NOT NULL,
    total_amount NUMERIC NOT NULL,
    order_status TEXT DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Enable RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order insertion policies (Public/Anon users can checkout)
CREATE POLICY "Allow public insert orders" ON orders
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public insert order_items" ON order_items
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin read/write policies
CREATE POLICY "Allow authenticated read orders" ON orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update orders" ON orders
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read order_items" ON order_items
    FOR SELECT TO authenticated USING (true);


