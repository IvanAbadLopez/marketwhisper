/**
 * User entity types
 * @module entities/user
 */

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface UserSession {
  user: UserProfile;
  expires: string;
}
