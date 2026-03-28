import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { logger } from '../../utils/logger';
import * as adminService from '../../services/adminService';

/**
 * Admin user management routes.
 * All business logic delegated to adminService.
 * Admin access is enforced by requireAdmin middleware.
 */
export function registerAdminUserRoutes(app: Express) {

  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { search, limit } = req.query;
      if (search && typeof search === 'string' && search.length >= 2) {
        const results = await adminService.searchUsers(search, limit ? Number(limit) : 10);
        return res.json(results);
      }
      const allUsers = await adminService.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      logger.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const { updatedUser } = await adminService.changeUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
}
