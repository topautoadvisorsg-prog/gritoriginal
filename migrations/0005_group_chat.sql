-- Create group_chat table for group messaging
CREATE TABLE IF NOT EXISTS "group_chat" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS group_chat_group_idx ON group_chat(group_id);
CREATE INDEX IF NOT EXISTS group_chat_user_idx ON group_chat(user_id);
CREATE INDEX IF NOT EXISTS group_chat_created_at_idx ON group_chat(created_at DESC);

-- Add comment
COMMENT ON TABLE "group_chat" IS 'Chat messages for group members';
