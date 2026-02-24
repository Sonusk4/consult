const { RtcTokenBuilder, RtcRole } = require("agora-token");

const generateAgoraToken = (channelName, uid) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return token;
};

module.exports = generateAgoraToken;
