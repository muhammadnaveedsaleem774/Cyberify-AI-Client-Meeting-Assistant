export {};

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      workspaceId: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

declare module 'express-serve-static-core' {
  namespace Express {
    interface AuthUser {
      id: string;
      workspaceId: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}
