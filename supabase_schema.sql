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

