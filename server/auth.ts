import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

interface CustomSession extends Session {
  user?: {
    id: string;
    email: string;
  };
}

export interface AuthenticatedRequest extends Request {
  session: CustomSession;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.session as CustomSession;
  
  if (!session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
}
