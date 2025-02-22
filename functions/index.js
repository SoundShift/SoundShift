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

      if (!req.rawRequest || !req.rawRequest.headers) {
        console.warn("Request headers are missing, defaulting redirect URI");
      }

      const origin = req.rawRequest?.headers?.origin || "http://localhost:3000";
      console.log("Detected request origin:", origin);

      let redirectUri = "http://localhost:3000/callback"; // default
      if (origin.includes("soundshift.vercel.app")) {
        redirectUri = "https://soundshift.vercel.app/callback";
      }

      if (!clientId || !clientSecret || !encryptionKey) {
        console.error("Missing API credentials.");
        throw new functions.https.HttpsError(
          "internal",
          "Missing API credentials."
        );
      }

      let tokenResponse;
      try {
        tokenResponse = await axios.post(
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
        console.log("Received token response:", tokenResponse.data);
      } catch (error) {
        console.error(
          "Failed to exchange token with Spotify:",
          error.response?.data || error
        );
        throw new functions.https.HttpsError(
          "internal",
          "Spotify token exchange failed"
        );
      }

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      let userResponse;
      try {
        console.log("Fetching user profile from Spotify...");
        userResponse = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        console.log("Received user profile:", userResponse.data);
      } catch (error) {
        console.error(
          "Failed to fetch user profile:",
          error.response?.data || error
        );
        throw new functions.https.HttpsError(
          "internal",
          "Failed to fetch Spotify user profile"
        );
      }

      const spotifyUserId = userResponse.data.id;

      let userRecord;
      try {
        userRecord = await admin.auth().getUser(spotifyUserId);
        console.log("User exists:", userRecord.uid);
      } catch (error) {
        try {
          userRecord = await admin.auth().createUser({
            uid: spotifyUserId,
            displayName: userResponse.data.display_name,
            photoURL: userResponse.data.images?.[0]?.url,
          });
        } catch (createError) {
          console.error("Failed to create new user:", createError);
          throw new functions.https.HttpsError(
            "internal",
            "Failed to create Firebase user"
          );
        }
      }

      try {
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
      } catch (firestoreError) {
        console.error("Failed to save user data to Firestore:", firestoreError);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to save user data"
        );
      }

      let firebaseToken;
      try {
        console.log("Generating Firebase custom token...");
        firebaseToken = await admin.auth().createCustomToken(spotifyUserId);
        console.log("Firebase token generated successfully");
      } catch (tokenError) {
        console.error("Failed to generate Firebase custom token:", tokenError);
        throw new functions.https.HttpsError(
          "internal",
          "Failed to generate Firebase token"
        );
      }

      console.log("Function exchangeToken completed successfully");
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
