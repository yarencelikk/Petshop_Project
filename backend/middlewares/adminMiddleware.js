const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message:
        "Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız.",
    });
  }
};
module.exports= adminMiddleware;
