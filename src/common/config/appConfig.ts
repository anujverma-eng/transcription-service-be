export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: "15m", issuer: "transcription-auth" },
  },
});
