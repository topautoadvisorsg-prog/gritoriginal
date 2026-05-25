import { Router, Request } from 'express';
import { isAuthenticated } from '../../auth/guards';
import * as groupService from '../../services/groupService';
import { db } from '../../db';
import { groupChat } from '../../../shared/schema';
import { desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/groups - Create a new group
 */
router.post('/', isAuthenticated, async (req: Request, res) => {
    try {
        const { name, description, isPrivate, maxMembers, avatarUrl } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const group = await groupService.createGroup({
            name: name.trim(),
            description,
            ownerId: userId,
            isPrivate: isPrivate ?? true,
            maxMembers: maxMembers ?? 50,
            avatarUrl,
        });

        logger.info(`[Groups API] User ${userId} created group ${group.id}`);
        res.status(201).json(group);
    } catch (error: any) {
        logger.error('[Groups API] Error creating group', error);
        res.status(500).json({ message: error.message || 'Failed to create group' });
    }
});

/**
 * GET /api/groups - Get all groups for current user
 */
router.get('/my', isAuthenticated, async (req: Request, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const groups = await groupService.getUserGroups(userId);
        res.json(groups);
    } catch (error: any) {
        logger.error('[Groups API] Error fetching user groups', error);
        res.status(500).json({ message: error.message || 'Failed to fetch groups' });
    }
});

/**
 * GET /api/groups/browse - Browse public groups
 */
router.get('/browse', async (req: Request, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const groups = await groupService.browsePublicGroups(limit, offset);
        res.json(groups);
    } catch (error: any) {
        logger.error('[Groups API] Error browsing public groups', error);
        res.status(500).json({ message: error.message || 'Failed to fetch public groups' });
    }
});

/**
 * GET /api/groups/:id - Get group by ID
 */
router.get('/:id', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const group = await groupService.getGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check access: if private, only members can view
        if (group.isPrivate) {
            const isMember = await groupService.isGroupMember(groupId, userId);
            if (!isMember) {
                return res.status(403).json({ message: 'Access denied. This group is private.' });
            }
        }

        res.json(group);
    } catch (error: any) {
        logger.error('[Groups API] Error fetching group', error);
        res.status(500).json({ message: error.message || 'Failed to fetch group' });
    }
});

/**
 * POST /api/groups/:id/members - Add member to group
 */
router.post('/:id/members', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const { userId, role } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify requester is admin or owner
        const currentMember = await groupService.getMemberInfo(groupId, currentUserId);
        if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
            return res.status(403).json({ message: 'Only admins and owners can add members' });
        }

        await groupService.addMemberToGroup(groupId, userId as string, role || 'member');
        res.status(204).send();
    } catch (error: any) {
        logger.error('[Groups API] Error adding member', error);
        res.status(400).json({ message: error.message || 'Failed to add member' });
    }
});

/**
 * DELETE /api/groups/:id/members/:userId - Remove member from group
 */
router.delete('/:id/members/:userId', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const targetUserId = req.params.userId as string;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Users can remove themselves
        if (targetUserId === currentUserId) {
            await groupService.removeMemberFromGroup(groupId, targetUserId);
            return res.status(204).send();
        }

        // Verify requester is admin or owner
        const currentMember = await groupService.getMemberInfo(groupId, currentUserId);
        if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
            return res.status(403).json({ message: 'Only admins and owners can remove other members' });
        }

        await groupService.removeMemberFromGroup(groupId, targetUserId);
        res.status(204).send();
    } catch (error: any) {
        logger.error('[Groups API] Error removing member', error);
        res.status(400).json({ message: error.message || 'Failed to remove member' });
    }
});

/**
 * PATCH /api/groups/:id/members/:userId/role - Update member role
 */
router.patch('/:id/members/:userId/role', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const targetUserId = req.params.userId as string;
        const { role } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!['member', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Only owner can update roles
        const currentMember = await groupService.getMemberInfo(groupId, currentUserId);
        if (!currentMember || currentMember.role !== 'owner') {
            return res.status(403).json({ message: 'Only owner can update member roles' });
        }

        await groupService.updateMemberRole(groupId, targetUserId, role);
        res.status(204).send();
    } catch (error: any) {
        logger.error('[Groups API] Error updating member role', error);
        res.status(400).json({ message: error.message || 'Failed to update member role' });
    }
});

/**
 * POST /api/groups/:id/transfer - Transfer group ownership
 */
router.post('/:id/transfer', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const { newOwnerId } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Only owner can transfer ownership
        const group = await groupService.getGroupById(groupId);
        if (!group || group.ownerId !== currentUserId) {
            return res.status(403).json({ message: 'Only group owner can transfer ownership' });
        }

        await groupService.transferOwnership(groupId, newOwnerId as string);
        res.status(204).send();
    } catch (error: any) {
        logger.error('[Groups API] Error transferring ownership', error);
        res.status(400).json({ message: error.message || 'Failed to transfer ownership' });
    }
});

/**
 * DELETE /api/groups/:id - Delete group (owner only)
 */
router.delete('/:id', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const group = await groupService.getGroupById(groupId);
        if (!group || group.ownerId !== userId) {
            return res.status(403).json({ message: 'Only group owner can delete the group' });
        }

        await groupService.deleteGroup(groupId);
        res.status(204).send();
    } catch (error: any) {
        logger.error('[Groups API] Error deleting group', error);
        res.status(400).json({ message: error.message || 'Failed to delete group' });
    }
});

/**
 * GET /api/groups/:id/chat - Get group chat messages
 */
router.get('/:id/chat', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify membership
        const isMember = await groupService.isGroupMember(groupId, userId);
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Fetch last 50 messages from group_chat table
        const messages = await db.query.groupChat.findMany({
            where: eq(groupChat.groupId, groupId),
            orderBy: [desc(groupChat.createdAt)],
            limit: 50,
            with: {
                user: true,
            },
        }).catch(() => []); // Return empty array if table doesn't exist yet

        res.json(messages.reverse());
    } catch (error: any) {
        logger.error('[Groups API] Error fetching chat messages', error);
        res.status(500).json({ message: error.message || 'Failed to fetch chat' });
    }
});

/**
 * POST /api/groups/:id/chat - Send chat message
 */
router.post('/:id/chat', isAuthenticated, async (req: Request, res) => {
    try {
        const groupId = req.params.id as string;
        const { content } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Message content required' });
        }

        // Verify membership
        const isMember = await groupService.isGroupMember(groupId, userId);
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Insert message
        const [message] = await db.insert(groupChat).values({
            id: uuidv4(),
            groupId,
            userId,
            content: content.trim(),
            createdAt: new Date(),
        }).returning().catch(() => {
            // If table doesn't exist, return mock message for development
            return [{
                id: uuidv4(),
                groupId,
                userId,
                content: content.trim(),
                createdAt: new Date(),
                username: req.user?.username || 'User',
            }];
        });

        res.status(201).json(message);
    } catch (error: any) {
        logger.error('[Groups API] Error sending chat message', error);
        res.status(500).json({ message: error.message || 'Failed to send message' });
    }
});

export default router;
