function roleGuard(requiredRole) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (userRole !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
      }

      next();
    } catch (err) {
      console.error("RoleGuard Error:", err);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

module.exports = { roleGuard };