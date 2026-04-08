function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized — please log in",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden — insufficient permissions",
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