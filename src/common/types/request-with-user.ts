/** `req.user` shape once `JwtAuthGuard` has run — see `JwtStrategy.validate()`. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface RequestWithUser {
  user?: AuthenticatedUser;
}
