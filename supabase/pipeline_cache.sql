-- Pipeline Cache for Google Maps + Scraper results
-- Reduces API costs and latency for repeat searches

CREATE TABLE IF NOT EXISTS public.pipeline_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- e.g., "search:lat:lng:radius:keyword" or "details:place_id"
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup and expiration pruning
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_key ON public.pipeline_cache(key);
CREATE INDEX IF NOT EXISTS idx_pipeline_cache_expires_at ON public.pipeline_cache(expires_at);

-- RLS Policies (internal only, usually service role)
ALTER TABLE public.pipeline_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.pipeline_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION prune_pipeline_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.pipeline_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
