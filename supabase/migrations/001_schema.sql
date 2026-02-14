-- Extend profiles with brand fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2563eb';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e40af';

-- Locations
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  google_maps_url text,
  industry text,
  tone text DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locations" ON locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  source text DEFAULT 'google' CHECK (source IN ('google', 'yelp', 'facebook', 'other')),
  reviewer_name text,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text text NOT NULL,
  review_date date,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score real,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Responses (AI-generated review responses)
CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  tone text,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own responses" ON responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM reviews WHERE reviews.id = responses.review_id AND reviews.user_id = auth.uid())
  );

-- Customers (contacts for review requests)
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  last_request_sent timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Review Requests (email campaigns)
CREATE TABLE review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  channel text DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'completed')),
  review_link text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_requests" ON review_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_reviews_location ON reviews(location_id);
CREATE INDEX idx_reviews_user_month ON reviews(user_id, created_at);
CREATE INDEX idx_responses_review ON responses(review_id);
CREATE INDEX idx_customers_location ON customers(location_id);
CREATE INDEX idx_review_requests_user ON review_requests(user_id, created_at);
