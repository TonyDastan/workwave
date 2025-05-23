// Middleware to check if user has a specific role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasRole = roles.includes(req.user.role);
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action' });
    }
    
    next();
  };
};

module.exports = checkRole; 