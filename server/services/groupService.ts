import { db } from '../db';
import { groups, groupMembers, users } from '../../shared/schema';
import type { Group, GroupMember } from '../../shared/schema';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { pointsAwardedToNetUnits } from '../utils/netUnits';

export interface CreateGroupParams {
    name: string;
    description?: string;
    ownerId: string;
    isPrivate?: boolean;
    maxMembers?: number;
    avatarUrl?: string;
}

export interface GroupMemberWithUser extends GroupMember {
    username: string;
    avatarUrl?: string;
    netUnits: number;
}

export interface GroupWithMembers extends Group {
    members: GroupMemberWithUser[];
    memberCount: number;
}

/**
 * Create a new group
 */
export async function createGroup(params: CreateGroupParams): Promise<Group> {
    const [newGroup] = await db.insert(groups).values({
        id: uuidv4(),
        name: params.name,
        description: params.description,
        ownerId: params.ownerId,
        isPrivate: params.isPrivate ?? true,
        maxMembers: params.maxMembers ?? 50,
        avatarUrl: params.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    // Add owner as group admin
    await db.insert(groupMembers).values({
        id: uuidv4(),
        groupId: newGroup.id,
        userId: params.ownerId,
        role: 'owner',
        joinedAt: new Date(),
    });

    logger.info(`[GroupService] Created group ${newGroup.id} with owner ${params.ownerId}`);
    return newGroup;
}

/**
 * Get group by ID with member details
 */
export async function getGroupById(groupId: string): Promise<GroupWithMembers | null> {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    
    if (!group) return null;

    const membersData = await db.select({
        groupMember: groupMembers,
        user: users,
    })
    .from(groupMembers)
    .leftJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

    const members: GroupMemberWithUser[] = membersData.map(({ groupMember, user }) => ({
        ...groupMember,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl,
        netUnits: pointsAwardedToNetUnits(user?.totalPoints),
    }));

    return {
        ...group,
        members,
        memberCount: members.length,
    };
}

/**
 * Get all groups for a user (both owned and member groups)
 */
export async function getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    // Get all group memberships for this user
    const memberships = await db.select({
        groupId: groupMembers.groupId,
    })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

    const groupIds = memberships.map(m => m.groupId);
    
    if (groupIds.length === 0) return [];

    // Get full group details with members
    const groupsData = await db.select({
        group: groups,
    })
    .from(groups)
    .where(or(
        eq(groups.ownerId, userId),
        inArray(groups.id, groupIds)
    ));

    const result: GroupWithMembers[] = [];
    
    for (const { group } of groupsData) {
        const groupWithMembers = await getGroupById(group.id);
        if (groupWithMembers) {
            result.push(groupWithMembers);
        }
    }

    return result;
}

/**
 * Browse public groups (for discovery)
 */
export async function browsePublicGroups(limit: number = 20, offset: number = 0): Promise<Group[]> {
    return db.select()
        .from(groups)
        .where(eq(groups.isPrivate, false))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(groups.createdAt));
}

/**
 * Add member to group
 */
export async function addMemberToGroup(groupId: string, userId: string, role: 'member' | 'admin' = 'member'): Promise<void> {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    
    if (!group) {
        throw new Error('Group not found');
    }

    // Check if group is full
    const memberCount = await db.select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId))
        .then(result => result[0]?.count || 0);

    if (memberCount >= group.maxMembers) {
        throw new Error('Group is full');
    }

    // Check if already a member
    const existingMember = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    if (existingMember.length > 0) {
        throw new Error('User is already a member of this group');
    }

    await db.insert(groupMembers).values({
        id: uuidv4(),
        groupId,
        userId,
        role,
        joinedAt: new Date(),
    });

    logger.info(`[GroupService] Added user ${userId} to group ${groupId} as ${role}`);
}

/**
 * Remove member from group
 */
export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    const [member] = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    if (!member) {
        throw new Error('Member not found in group');
    }

    // Prevent removing the owner
    if (member.role === 'owner') {
        throw new Error('Cannot remove group owner. Transfer ownership first.');
    }

    await db.delete(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    logger.info(`[GroupService] Removed user ${userId} from group ${groupId}`);
}

/**
 * Update member role
 */
export async function updateMemberRole(groupId: string, userId: string, role: 'member' | 'admin'): Promise<void> {
    await db.update(groupMembers)
        .set({ role })
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    logger.info(`[GroupService] Updated user ${userId} role to ${role} in group ${groupId}`);
}

/**
 * Transfer group ownership
 */
export async function transferOwnership(groupId: string, newOwnerId: string): Promise<void> {
    const [currentOwner] = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, 'owner')
        ));

    if (!currentOwner) {
        throw new Error('Current owner not found');
    }

    // Update current owner to admin
    await db.update(groupMembers)
        .set({ role: 'admin' })
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, currentOwner.userId)
        ));

    // Add new owner or update existing member to owner
    const [existingNewOwner] = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, newOwnerId)
        ));

    if (existingNewOwner) {
        await db.update(groupMembers)
            .set({ role: 'owner' })
            .where(and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, newOwnerId)
            ));
    } else {
        await db.insert(groupMembers).values({
            id: uuidv4(),
            groupId,
            userId: newOwnerId,
            role: 'owner',
            joinedAt: new Date(),
        });
    }

    // Update group owner
    await db.update(groups)
        .set({ ownerId: newOwnerId, updatedAt: new Date() })
        .where(eq(groups.id, groupId));

    logger.info(`[GroupService] Transferred ownership of group ${groupId} to user ${newOwnerId}`);
}

/**
 * Delete group (owner only)
 */
export async function deleteGroup(groupId: string): Promise<void> {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    
    if (!group) {
        throw new Error('Group not found');
    }

    await db.delete(groups).where(eq(groups.id, groupId));
    
    logger.info(`[GroupService] Deleted group ${groupId}`);
}

/**
 * Check if user is member of group
 */
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    return !!member;
}

/**
 * Get member info
 */
export async function getMemberInfo(groupId: string, userId: string): Promise<GroupMember | null> {
    const [member] = await db.select()
        .from(groupMembers)
        .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
        ));

    return member || null;
}
