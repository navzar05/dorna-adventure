// src/utils/jwt.ts
interface JwtPayload {
  sub: string; // username or user ID
  roles?: string[];
  role?: string;
  exp?: number;
  iat?: number;
  // Add other fields your JWT contains
}

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const getUserRolesFromToken = (token: string): string[] => {
  const decoded = decodeJwt(token);
  if (!decoded) return [];
  
  // 1. Check if 'roles' exists (common in Spring Security)
  if (decoded.roles) {
    // If it's already an array, return it
    if (Array.isArray(decoded.roles)) {
      return decoded.roles;
    }
    // If it's a single string (e.g. "ADMIN"), wrap it in an array
    return [decoded.roles];
  }
  
  // 2. Check if 'role' exists (alternative claim name)
  if (decoded.role) {
    if (Array.isArray(decoded.role)) {
      return decoded.role;
    }
    return [decoded.role];
  }
  
  // 3. Return empty array if no roles found
  return [];
};

export const isAdmin = (token: string): boolean => {
  const roles = getUserRolesFromToken(token);
  console.log('User roles:', roles);
  
  // Check if the array contains 'ADMIN' or 'ROLE_ADMIN'
  return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
};

export const isEmployee = (token: string): boolean => {
  const roles = getUserRolesFromToken(token);
  console.log('User roles:', roles);
  
  // Check if the array contains 'ADMIN' or 'ROLE_ADMIN'
  return roles.includes('EMPLOYEE') || roles.includes('ROLE_EMPLOYEE');
};