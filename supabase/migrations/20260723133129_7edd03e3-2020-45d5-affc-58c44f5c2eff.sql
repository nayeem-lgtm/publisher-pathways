
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('affiliate_manager', 'qa', 'compliance', 'management');

CREATE TYPE public.publisher_status AS ENUM ('pending', 'testing', 'active', 'paused', 'blacklisted');
CREATE TYPE public.publisher_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + default AM role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'affiliate_manager');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Publishers
CREATE TABLE public.publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  status public.publisher_status NOT NULL DEFAULT 'pending',
  tier public.publisher_tier NOT NULL DEFAULT 'tier_3',
  traffic_sources TEXT[] NOT NULL DEFAULT '{}',
  geos TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  assigned_am UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  onboarded_at DATE,
  cap_daily INT,
  revenue_30d NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  performance_score INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishers TO authenticated;
GRANT ALL ON public.publishers TO service_role;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated user reads publishers" ON public.publishers FOR SELECT TO authenticated USING (true);
CREATE POLICY "AMs and management insert publishers" ON public.publishers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'affiliate_manager') OR public.has_role(auth.uid(), 'management'));
CREATE POLICY "AMs and management update publishers" ON public.publishers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'affiliate_manager') OR public.has_role(auth.uid(), 'management'));
CREATE POLICY "Management deletes publishers" ON public.publishers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'management'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER publishers_updated_at BEFORE UPDATE ON public.publishers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed demo publishers (unassigned; visible to any signed-in AM)
INSERT INTO public.publishers
  (partner_id, company_name, contact_name, email, status, tier, traffic_sources, geos, tags, onboarded_at, cap_daily, revenue_30d, revenue_total, conversion_rate, performance_score, notes)
VALUES
  ('EF-10214', 'Northwind Media', 'Julia Reyes', 'julia@northwindmedia.co', 'active', 'tier_1', ARRAY['email','display'], ARRAY['US','CA'], ARRAY['high_performer','email_traffic'], '2024-11-04', 850, 48210.55, 312440.10, 4.72, 92, 'Reliable Q4 scaler. Prefers ACA + auto verticals.'),
  ('EF-10233', 'Beacon Traffic', 'Marcus Hale', 'marcus@beacontraffic.io', 'active', 'tier_1', ARRAY['search','native'], ARRAY['US'], ARRAY['high_performer'], '2024-08-19', 1200, 61890.00, 588102.44, 5.10, 95, 'Top revenue driver last 90 days.'),
  ('EF-10298', 'Loomstack', 'Priya Nair', 'priya@loomstack.com', 'testing', 'tier_3', ARRAY['social'], ARRAY['US','UK'], ARRAY['new'], '2025-06-30', 150, 1204.20, 1204.20, 2.10, 41, 'On 30-day test window. Watch complaint rate.'),
  ('EF-10301', 'Cinderblock Ads', 'Tom Whitaker', 'tom@cinderblockads.com', 'active', 'tier_2', ARRAY['display','push'], ARRAY['US','AU'], ARRAY['mid_performer'], '2025-02-11', 500, 18402.75, 74208.30, 3.44, 68, ''),
  ('EF-10322', 'Kite & Sparrow', 'Elena Voss', 'elena@kitesparrow.co', 'active', 'tier_2', ARRAY['email'], ARRAY['UK','DE','FR'], ARRAY['email_traffic','mid_performer'], '2025-01-08', 400, 22150.00, 128900.00, 3.98, 74, 'EU compliance approved.'),
  ('EF-10344', 'Roundwave', 'DJ Sharma', 'dj@roundwave.media', 'paused', 'tier_2', ARRAY['social','native'], ARRAY['US'], ARRAY['mid_performer'], '2024-10-22', 300, 0.00, 42100.00, 3.11, 55, 'Paused pending creative review.'),
  ('EF-10371', 'Halcyon Reach', 'Sofia Cabrera', 'sofia@halcyonreach.com', 'testing', 'tier_3', ARRAY['email','sms'], ARRAY['US','MX'], ARRAY['new'], '2025-07-02', 100, 640.10, 640.10, 1.85, 32, 'SMS traffic — pending compliance sign-off.'),
  ('EF-10389', 'Bluebird Digital', 'Yusuf Karim', 'yusuf@bluebirddigital.co', 'active', 'tier_1', ARRAY['search','display','email'], ARRAY['US','CA','UK'], ARRAY['high_performer','multi_geo'], '2024-06-14', 1500, 74320.90, 812004.00, 5.62, 98, 'Strategic partner. Quarterly business review.'),
  ('EF-10405', 'Ember & Oak', 'Rachel Lin', 'rachel@emberoak.com', 'blacklisted', 'tier_3', ARRAY['display'], ARRAY['US'], ARRAY['low_quality','compliance_flag'], '2024-12-01', 0, 0.00, 8200.00, 0.94, 12, 'Blacklisted: repeated policy violations.'),
  ('EF-10419', 'Cadence Reach', 'Owen Blackwood', 'owen@cadencereach.io', 'active', 'tier_2', ARRAY['email','native'], ARRAY['US'], ARRAY['mid_performer'], '2025-03-24', 450, 15900.20, 51203.40, 3.62, 66, ''),
  ('EF-10444', 'Sable Traffic Co', 'Aisha Bello', 'aisha@sable.co', 'pending', 'tier_3', ARRAY['social'], ARRAY['NG','UK'], ARRAY['new'], NULL, NULL, 0.00, 0.00, 0.00, 0, 'Awaiting IO signature.'),
  ('EF-10461', 'Northline Growth', 'Peter Vale', 'peter@northline.co', 'active', 'tier_1', ARRAY['search','display'], ARRAY['US','CA'], ARRAY['high_performer'], '2024-09-05', 900, 51402.00, 402100.10, 4.90, 90, 'Consistent volume driver.');
