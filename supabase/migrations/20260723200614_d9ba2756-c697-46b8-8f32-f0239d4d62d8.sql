
-- 1. Extend tier enum with A, S, D
ALTER TYPE public.publisher_tier ADD VALUE IF NOT EXISTS 'tier_a';
ALTER TYPE public.publisher_tier ADD VALUE IF NOT EXISTS 'tier_s';
ALTER TYPE public.publisher_tier ADD VALUE IF NOT EXISTS 'tier_d';
