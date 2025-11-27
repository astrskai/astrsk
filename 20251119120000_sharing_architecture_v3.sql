-- Supabase Setup Script for Sharing Architecture V3
-- Execute this in your Supabase SQL Editor.
-- All tables are prefixed with 'astrsk_' to avoid conflicts with existing schema.
-- Schema mirrors local PGlite with added owner_id for claiming functionality.

-- Phase 1: Create Tables

-- Assets table (no owner_id - public read access)
CREATE TABLE IF NOT EXISTS public.astrsk_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hash varchar NOT NULL,
    name varchar NOT NULL,
    size_byte integer NOT NULL,
    mime_type varchar NOT NULL,
    file_path varchar NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Sessions table (top-level shareable resource)
CREATE TABLE IF NOT EXISTS public.astrsk_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar NOT NULL,
    name varchar,
    all_cards jsonb NOT NULL,
    user_character_card_id uuid,
    turn_ids jsonb NOT NULL,
    background_id uuid REFERENCES public.astrsk_assets(id) ON DELETE CASCADE,
    cover_id uuid REFERENCES public.astrsk_assets(id) ON DELETE CASCADE,
    translation jsonb,
    chat_styles jsonb,
    flow_id uuid,
    auto_reply varchar DEFAULT 'off' NOT NULL,
    data_schema_order jsonb DEFAULT '[]'::jsonb NOT NULL,
    widget_layout jsonb,
    tags text[] DEFAULT '{}' NOT NULL,
    summary text,
    is_public boolean DEFAULT false NOT NULL,
    owner_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Flows table (belongs to session, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_flows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    description text NOT NULL,
    nodes jsonb NOT NULL,
    edges jsonb NOT NULL,
    response_template text NOT NULL,
    data_store_schema jsonb,
    panel_structure jsonb,
    viewport jsonb,
    vibe_session_id uuid,
    ready_state varchar DEFAULT 'draft' NOT NULL,
    validation_issues jsonb,
    session_id uuid REFERENCES public.astrsk_sessions(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}' NOT NULL,
    summary text,
    version varchar,
    conceptual_origin varchar,
    is_public boolean DEFAULT false NOT NULL,
    owner_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Agents table (belongs to flow, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id uuid NOT NULL REFERENCES public.astrsk_flows(id) ON DELETE CASCADE,
    name varchar NOT NULL,
    description text NOT NULL,
    target_api_type varchar NOT NULL,
    api_source jsonb,
    model_id varchar,
    model_name varchar,
    model_tier varchar DEFAULT 'Light',
    prompt_messages text NOT NULL,
    text_prompt text NOT NULL DEFAULT '',
    enabled_parameters jsonb NOT NULL,
    parameter_values jsonb NOT NULL,
    enabled_structured_output boolean NOT NULL DEFAULT false,
    output_format varchar DEFAULT 'structured_output',
    output_streaming boolean DEFAULT true,
    schema_name varchar,
    schema_description text,
    schema_fields jsonb,
    token_count integer NOT NULL DEFAULT 0,
    color varchar NOT NULL DEFAULT '#3b82f6',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Data Store Nodes table (belongs to flow, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_data_store_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id uuid REFERENCES public.astrsk_flows(id) ON DELETE CASCADE,
    name varchar NOT NULL,
    color varchar DEFAULT '#3b82f6' NOT NULL,
    data_store_fields jsonb DEFAULT '[]'::jsonb,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- If Nodes table (belongs to flow, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_if_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id uuid REFERENCES public.astrsk_flows(id) ON DELETE CASCADE,
    name varchar NOT NULL,
    color varchar DEFAULT '#3b82f6' NOT NULL,
    "logicOperator" varchar,
    conditions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Characters table (belongs to session, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_characters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar NOT NULL,
    icon_asset_id uuid REFERENCES public.astrsk_assets(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}' NOT NULL,
    creator varchar,
    card_summary text,
    version varchar,
    conceptual_origin varchar,
    vibe_session_id uuid,
    image_prompt text,
    name varchar NOT NULL,
    description text,
    example_dialogue text,
    lorebook jsonb,
    session_id uuid REFERENCES public.astrsk_sessions(id) ON DELETE CASCADE,
    is_public boolean DEFAULT false NOT NULL,
    owner_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Scenarios table (belongs to session, CASCADE delete)
CREATE TABLE IF NOT EXISTS public.astrsk_scenarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar NOT NULL,
    icon_asset_id uuid REFERENCES public.astrsk_assets(id) ON DELETE CASCADE,
    tags text[] DEFAULT '{}' NOT NULL,
    creator varchar,
    card_summary text,
    version varchar,
    conceptual_origin varchar,
    vibe_session_id uuid,
    image_prompt text,
    name varchar NOT NULL,
    description text,
    first_messages jsonb,
    lorebook jsonb,
    session_id uuid REFERENCES public.astrsk_sessions(id) ON DELETE CASCADE,
    is_public boolean DEFAULT false NOT NULL,
    owner_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Shared Resources table (manages sharing + claiming)
CREATE TABLE IF NOT EXISTS public.astrsk_shared_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type varchar NOT NULL,
    resource_id uuid NOT NULL,
    expires_at timestamp NOT NULL,
    claimed_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL
);


-- Phase 2: Enable Row Level Security (RLS)

ALTER TABLE public.astrsk_shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_data_store_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_if_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astrsk_assets ENABLE ROW LEVEL SECURITY;


-- Phase 3: Create RLS Policies

-- ====================
-- Shared Resources
-- ====================
CREATE POLICY "Allow anonymous insert for sharing"
ON public.astrsk_shared_resources
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for non-expired"
ON public.astrsk_shared_resources
FOR SELECT
TO public
USING (expires_at > NOW());

CREATE POLICY "Allow authenticated users to claim"
ON public.astrsk_shared_resources
FOR UPDATE
TO authenticated
USING (expires_at > NOW() AND claimed_by IS NULL)
WITH CHECK (claimed_by = auth.uid());


-- ====================
-- Sessions (top-level shareable)
-- ====================
CREATE POLICY "Allow anonymous insert for sessions"
ON public.astrsk_sessions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for shared sessions"
ON public.astrsk_sessions
FOR SELECT
TO public
USING (
  id IN (
    SELECT resource_id FROM public.astrsk_shared_resources
    WHERE expires_at > NOW() AND resource_type = 'session'
  )
);

CREATE POLICY "Allow owner to update sessions"
ON public.astrsk_sessions
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow owner to delete sessions"
ON public.astrsk_sessions
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- ====================
-- Flows (belongs to session)
-- ====================
CREATE POLICY "Allow anonymous insert for flows"
ON public.astrsk_flows
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for flows in shared sessions"
ON public.astrsk_flows
FOR SELECT
TO public
USING (
  session_id IN (
    SELECT id FROM public.astrsk_sessions
    WHERE id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'session'
    )
  )
  OR id IN (
    SELECT resource_id FROM public.astrsk_shared_resources
    WHERE expires_at > NOW() AND resource_type = 'flow'
  )
);

CREATE POLICY "Allow owner to update flows"
ON public.astrsk_flows
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL)
WITH CHECK (owner_id = auth.uid() AND session_id IS NULL);

CREATE POLICY "Allow owner to delete flows"
ON public.astrsk_flows
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL);


-- ====================
-- Agents (belongs to flow)
-- ====================
CREATE POLICY "Allow anonymous insert for agents"
ON public.astrsk_agents
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for agents"
ON public.astrsk_agents
FOR SELECT
TO public
USING (
  flow_id IN (
    SELECT id FROM public.astrsk_flows
    WHERE session_id IN (
      SELECT id FROM public.astrsk_sessions
      WHERE id IN (
        SELECT resource_id FROM public.astrsk_shared_resources
        WHERE expires_at > NOW() AND resource_type = 'session'
      )
    )
    OR id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'flow'
    )
  )
);

-- Agents cannot be updated or deleted directly
-- They are managed through flow updates and cascade delete when flow is deleted


-- ====================
-- Data Store Nodes (belongs to flow)
-- ====================
CREATE POLICY "Allow anonymous insert for data_store_nodes"
ON public.astrsk_data_store_nodes
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for data_store_nodes"
ON public.astrsk_data_store_nodes
FOR SELECT
TO public
USING (
  flow_id IN (
    SELECT id FROM public.astrsk_flows
    WHERE session_id IN (
      SELECT id FROM public.astrsk_sessions
      WHERE id IN (
        SELECT resource_id FROM public.astrsk_shared_resources
        WHERE expires_at > NOW() AND resource_type = 'session'
      )
    )
    OR id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'flow'
    )
  )
);

-- Data store nodes cannot be updated or deleted directly
-- They are managed through flow updates and cascade delete when flow is deleted


-- ====================
-- If Nodes (belongs to flow)
-- ====================
CREATE POLICY "Allow anonymous insert for if_nodes"
ON public.astrsk_if_nodes
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for if_nodes"
ON public.astrsk_if_nodes
FOR SELECT
TO public
USING (
  flow_id IN (
    SELECT id FROM public.astrsk_flows
    WHERE session_id IN (
      SELECT id FROM public.astrsk_sessions
      WHERE id IN (
        SELECT resource_id FROM public.astrsk_shared_resources
        WHERE expires_at > NOW() AND resource_type = 'session'
      )
    )
    OR id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'flow'
    )
  )
);

-- If nodes cannot be updated or deleted directly
-- They are managed through flow updates and cascade delete when flow is deleted


-- ====================
-- Characters (belongs to session)
-- ====================
CREATE POLICY "Allow anonymous insert for characters"
ON public.astrsk_characters
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for characters"
ON public.astrsk_characters
FOR SELECT
TO public
USING (
  session_id IN (
    SELECT id FROM public.astrsk_sessions
    WHERE id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'session'
    )
  )
  OR id IN (
    SELECT resource_id FROM public.astrsk_shared_resources
    WHERE expires_at > NOW() AND resource_type = 'character'
  )
);

CREATE POLICY "Allow owner to update characters"
ON public.astrsk_characters
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL)
WITH CHECK (owner_id = auth.uid() AND session_id IS NULL);

CREATE POLICY "Allow owner to delete characters"
ON public.astrsk_characters
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL);


-- ====================
-- Scenarios (belongs to session)
-- ====================
CREATE POLICY "Allow anonymous insert for scenarios"
ON public.astrsk_scenarios
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for scenarios"
ON public.astrsk_scenarios
FOR SELECT
TO public
USING (
  session_id IN (
    SELECT id FROM public.astrsk_sessions
    WHERE id IN (
      SELECT resource_id FROM public.astrsk_shared_resources
      WHERE expires_at > NOW() AND resource_type = 'session'
    )
  )
  OR id IN (
    SELECT resource_id FROM public.astrsk_shared_resources
    WHERE expires_at > NOW() AND resource_type = 'scenario'
  )
);

CREATE POLICY "Allow owner to update scenarios"
ON public.astrsk_scenarios
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL)
WITH CHECK (owner_id = auth.uid() AND session_id IS NULL);

CREATE POLICY "Allow owner to delete scenarios"
ON public.astrsk_scenarios
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() AND session_id IS NULL);


-- ====================
-- Assets (public read)
-- ====================
CREATE POLICY "Allow anonymous insert for assets"
ON public.astrsk_assets
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public read for assets"
ON public.astrsk_assets
FOR SELECT
TO public
USING (true);


-- Phase 4: Claim Function (for authenticated users)

CREATE OR REPLACE FUNCTION public.claim_resource(
  p_resource_type varchar,
  p_resource_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_share_record RECORD;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if resource exists and is not expired
  SELECT * INTO v_share_record
  FROM public.astrsk_shared_resources
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Resource not found or expired');
  END IF;

  -- Check if already claimed
  IF v_share_record.claimed_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Resource already claimed');
  END IF;

  -- Update shared_resources to mark as claimed
  UPDATE public.astrsk_shared_resources
  SET claimed_by = v_user_id
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id;

  -- Update the actual resource table to set owner
  CASE p_resource_type
    WHEN 'session' THEN
      -- Update Session
      UPDATE public.astrsk_sessions
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE id = p_resource_id;

      -- Cascade to Flows in this Session
      UPDATE public.astrsk_flows
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE session_id = p_resource_id;

      -- Cascade to Characters in this Session
      UPDATE public.astrsk_characters
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE session_id = p_resource_id;

      -- Cascade to Scenarios in this Session
      UPDATE public.astrsk_scenarios
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE session_id = p_resource_id;

    WHEN 'flow' THEN
      UPDATE public.astrsk_flows
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE id = p_resource_id;

    WHEN 'character' THEN
      UPDATE public.astrsk_characters
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE id = p_resource_id;

    WHEN 'scenario' THEN
      UPDATE public.astrsk_scenarios
      SET owner_id = v_user_id, updated_at = NOW()
      WHERE id = p_resource_id;
  END CASE;

  RETURN jsonb_build_object(
    'success', true,
    'resource_type', p_resource_type,
    'resource_id', p_resource_id,
    'claimed_by', v_user_id
  );
END;
$$;


-- Phase 5: Automatic Expiration Cleanup (Cron Job)

-- Function to delete expired shares and unclaimed resources
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_share RECORD;
BEGIN
  -- Loop through all expired shares
  FOR v_expired_share IN
    SELECT resource_type, resource_id, claimed_by
    FROM public.astrsk_shared_resources
    WHERE expires_at <= NOW()
  LOOP
    -- Only delete the actual resource if it was never claimed
    IF v_expired_share.claimed_by IS NULL THEN
      CASE v_expired_share.resource_type
        WHEN 'session' THEN
          DELETE FROM public.astrsk_sessions WHERE id = v_expired_share.resource_id AND owner_id IS NULL;
        WHEN 'flow' THEN
          DELETE FROM public.astrsk_flows WHERE id = v_expired_share.resource_id AND owner_id IS NULL;
        WHEN 'character' THEN
          DELETE FROM public.astrsk_characters WHERE id = v_expired_share.resource_id AND owner_id IS NULL;
        WHEN 'scenario' THEN
          DELETE FROM public.astrsk_scenarios WHERE id = v_expired_share.resource_id AND owner_id IS NULL;
      END CASE;
    END IF;
  END LOOP;

  -- Delete all expired share records (both claimed and unclaimed)
  DELETE FROM public.astrsk_shared_resources WHERE expires_at <= NOW();
END;
$$;

-- Note: pg_cron jobs must be created via Supabase Dashboard
-- Navigate to Database > Cron Jobs and create a job with:
-- Name: delete-expired-astrsk-shares
-- Schedule: 0 * * * * (every hour)
-- SQL: SELECT public.cleanup_expired_shares();

-- Phase 6: Performance Indexes

CREATE INDEX IF NOT EXISTS idx_astrsk_flows_session_id ON public.astrsk_flows(session_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_agents_flow_id ON public.astrsk_agents(flow_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_data_store_nodes_flow_id ON public.astrsk_data_store_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_if_nodes_flow_id ON public.astrsk_if_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_characters_session_id ON public.astrsk_characters(session_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_scenarios_session_id ON public.astrsk_scenarios(session_id);
CREATE INDEX IF NOT EXISTS idx_astrsk_shared_resources_expires_at ON public.astrsk_shared_resources(expires_at);

-- GIN Indexes for Tag Search
CREATE INDEX IF NOT EXISTS idx_astrsk_sessions_tags ON public.astrsk_sessions USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_astrsk_flows_tags ON public.astrsk_flows USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_astrsk_characters_tags ON public.astrsk_characters USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_astrsk_scenarios_tags ON public.astrsk_scenarios USING GIN (tags);

-- Extension for Text Search (Trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN Trigram Indexes for Name/Title/Summary Search
CREATE INDEX IF NOT EXISTS idx_astrsk_sessions_title_summary ON public.astrsk_sessions USING GIN (title gin_trgm_ops, (coalesce(summary, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_astrsk_flows_name_summary ON public.astrsk_flows USING GIN (name gin_trgm_ops, (coalesce(summary, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_astrsk_characters_name_summary ON public.astrsk_characters USING GIN (name gin_trgm_ops, (coalesce(card_summary, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_astrsk_scenarios_name_summary ON public.astrsk_scenarios USING GIN (name gin_trgm_ops, (coalesce(card_summary, '')) gin_trgm_ops);

-- End of script
