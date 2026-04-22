export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();

  let cookieName = "patientToken";
  if (user.role === "Admin")  cookieName = "adminToken";
  if (user.role === "Doctor") cookieName = "doctorToken";

  const cookieExpireDays = process.env.COOKIE_EXPIRE
    ? Number(process.env.COOKIE_EXPIRE)
    : 7;

  res
    .status(statusCode)
    .cookie(cookieName, token, {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
     httpOnly: true,
    sameSite: "none",
    secure: true,
    })
    .json({
      success: true,
      message,
      user,
    });
};