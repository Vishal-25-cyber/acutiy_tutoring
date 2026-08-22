import { AccessToken } from "livekit-server-sdk";

export async function createLivekitToken(params: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isTeacher: boolean;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret_livekit_key_at_least_32_characters_long_12345";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.participantIdentity,
    name: params.participantName,
    ttl: "4h",
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: params.isTeacher,
    roomRecord: params.isTeacher,
  });

  return await at.toJwt();
}
