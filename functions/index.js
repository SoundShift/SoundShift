const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();

const encryptionKey = process.env.ENCRYPTION_KEY;
const ivLength = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + encrypted;
}

function decrypt(text) {
  const iv = Buffer.from(text.slice(0, ivLength * 2), "hex");
  const encryptedText = text.slice(ivLength * 2);
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

exports.exchangeToken = functions.https.onCall(
  { enforceAppCheck: false },
  async (req) => {
    try {
      const { code } = req.data;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const redirectUri = "http://localhost:3000/callback";

      if (!clientId || !clientSecret || !encryptionKey) {
        throw new functions.https.HttpsError(
          "internal",
          "Missing API credentials."
        );
      }

      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      const userResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const spotifyUserId = userResponse.data.id;

      let userRecord;
      try {
        userRecord = await admin.auth().getUser(spotifyUserId);
      } catch (error) {
        userRecord = await admin.auth().createUser({
          uid: spotifyUserId,
          displayName: userResponse.data.display_name,
          photoURL: userResponse.data.images?.[0]?.url,
        });
      }

      await admin
        .firestore()
        .collection("users")
        .doc(spotifyUserId)
        .set(
          {
            access_token: encrypt(access_token),
            refresh_token: encrypt(refresh_token),
            expires_at: Date.now() + expires_in * 1000,
            profile: userResponse.data,
          },
          { merge: true }
        );

      const firebaseToken = await admin.auth().createCustomToken(spotifyUserId);

      return { firebaseToken };
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw new functions.https.HttpsError("internal", "Token exchange failed");
    }
  }
);

exports.decryptTokens = functions.https.onCall(
  { enforceAppCheck: false },
  async (req) => {
    try {
      const { userId } = req.data;
      const callerUid = req.auth?.uid;

      if (
        !callerUid ||
        (callerUid !== userId &&
          !(await admin.auth().getUser(callerUid)).customClaims?.admin)
      ) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Unauthorized."
        );
      }

      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User data not found."
        );
      }

      const userData = userDoc.data();
      if (!userData.access_token || !userData.refresh_token) {
        throw new functions.https.HttpsError("not-found", "Tokens not found.");
      }

      let accessToken = decrypt(userData.access_token);
      let refreshToken = decrypt(userData.refresh_token);
      let expiresAt = userData.expires_at;

      if (Date.now() >= expiresAt) {
        try {
          const clientId = process.env.SPOTIFY_CLIENT_ID;
          const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

          const refreshResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: clientId,
              client_secret: clientSecret,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );

          accessToken = refreshResponse.data.access_token;
          expiresAt = Date.now() + refreshResponse.data.expires_in * 1000;

          await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .update({
              access_token: encrypt(accessToken),
              expires_at: expiresAt,
            });

          console.log(`Access token refreshed for user ${userId}`);
        } catch (error) {
          console.error("Failed to refresh Spotify token:", error);
          throw new functions.https.HttpsError(
            "internal",
            "Failed to refresh token"
          );
        }
      }

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new functions.https.HttpsError("internal", "Decryption failed");
    }
  }
);
