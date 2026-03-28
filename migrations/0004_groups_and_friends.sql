-- Create groups table for user-created private groups
CREATE TABLE IF NOT EXISTS "groups" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    description text,
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private boolean NOT NULL DEFAULT true,
    max_members integer NOT NULL DEFAULT 50,
    avatar_url text,
    created_at timestamp DEFAULT NOW() NOT NULL,
    updated_at timestamp DEFAULT NOW() NOT NULL
);

-- Create group_members junction table
CREATE TABLE IF NOT EXISTS "group_members" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role varchar(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at timestamp DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS groups_owner_idx ON groups(owner_id);
CREATE INDEX IF NOT EXISTS groups_is_private_idx ON groups(is_private);
CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);

-- Add comments for documentation
COMMENT ON TABLE "groups" IS 'User-created groups for private competition and chat';
COMMENT ON TABLE "group_members" IS 'Junction table linking users to groups with roles';
COMMENT ON COLUMN "groups"."is_private" IS 'If true, only members can view and access the group';
COMMENT ON COLUMN "group_members"."role" IS 'User role: owner (full control), admin (moderate), member (standard)';
