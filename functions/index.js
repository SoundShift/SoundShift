const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

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

      const origin = req.rawRequest?.headers?.origin || "http://localhost:3000";
      let redirectUri = origin.includes("soundshift.vercel.app")
        ? "https://soundshift.vercel.app/callback"
        : "http://localhost:3000/callback";

      if (!clientId || !clientSecret || !encryptionKey) {
        throw new functions.https.HttpsError(
          "internal",
          "Missing API credentials."
        );
      }

      // Exchange Spotify Token
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
      } catch (error) {
        throw new functions.https.HttpsError(
          "internal",
          "Spotify token exchange failed"
        );
      }

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get Spotify User ID
      let userResponse;
      try {
        userResponse = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
      } catch (error) {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to fetch Spotify user profile"
        );
      }

      const spotifyUserId = userResponse.data.id;

      // Fetch user from Firestore
      const userRef = admin.firestore().collection("users").doc(spotifyUserId);
      const userDoc = await userRef.get();
      let lastLikedSync = userDoc.exists
        ? userDoc.data().lastLikedSync || 0
        : 0;

      // **Define syncLikedSongs inside exchangeToken**
      async function syncLikedSongs() {
        const now = Date.now();
        const syncThreshold = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

        if (now - lastLikedSync < syncThreshold) {
          console.log("Liked songs were already synced recently. Skipping.");
          return { message: "Liked songs already up to date" };
        }

        console.log("Syncing all liked songs...");

        // **Fetch all liked songs**
        async function fetchLikedTracks() {
          let likedTracksMap = {};
          let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";
          let totalFetched = 0;

          while (nextUrl && totalFetched < 500) {
            const response = await axios.get(nextUrl, {
              headers: { Authorization: `Bearer ${access_token}` },
            });

            response.data.items.forEach((item) => {
              if (totalFetched < 500) {
                likedTracksMap[item.track.id] = true;
                totalFetched++;
              }
            });

            nextUrl =
              response.data.next && totalFetched < 500
                ? response.data.next
                : null;

            console.log(`Fetched ${totalFetched} liked songs so far...`);
          }

          return likedTracksMap;
        }

        const likedTracks = await fetchLikedTracks();
        console.log(
          `Final total liked songs: ${Object.keys(likedTracks).length}`
        );

        // **Save to Firestore**
        await userRef.set(
          {
            likedTracks: likedTracks, // Store as a map
            lastLikedSync: now, // Update last sync timestamp
          },
          { merge: true }
        );

        console.log("Liked songs successfully synced.");
        return { message: "Liked songs updated" };
      }

      // **Run Liked Songs Sync**
      await syncLikedSongs();

      // Save tokens & mark for liked songs sync
      try {
        await userRef.set(
          {
            access_token: encrypt(access_token),
            refresh_token: encrypt(refresh_token),
            expires_at: Date.now() + expires_in * 1000,
            profile: userResponse.data,
          },
          { merge: true }
        );
      } catch (firestoreError) {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to save user data"
        );
      }

      // Generate Firebase Token
      let firebaseToken;
      try {
        firebaseToken = await admin.auth().createCustomToken(spotifyUserId);
      } catch (tokenError) {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to generate Firebase token"
        );
      }

      return { firebaseToken };
    } catch (error) {
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

exports.moodAnalysis = functions.https.onCall(
  { enforceAppCheck: false },
  async (req) => {
    console.log("Analyzing: ", req);

    let mood = "";

    try {
      if (!req.auth || !req.auth.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated."
        );
      }

      const {context = "" } = req.data;
      console.log("Context:", context);

      const aiPrompt = `
      Describe the users mood in a single word:
      "${context}"`;

      console.log(aiPrompt);

      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,

          {
            contents: [{ parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
          }
        );

        const aiText =
          geminiResponse.data.candidates[0]?.content?.parts[0]?.text || "";
        console.log("Raw AI response:", aiText);
      } catch (error) {
        console.error(
          "Gemini error or parsing failure:",
          error.message || error
        );

        let fallbackMood = "Neutral"

        if (
          context.toLowerCase().includes("happy") ||
          context.toLowerCase().includes("good") ||
          context.toLowerCase().includes("great")
        ) {
          fallbackMood = "Happy";
        } else if (
          context.toLowerCase().includes("sad") ||
          context.toLowerCase().includes("bad") ||
          context.toLowerCase().includes("tired")
        ) {
          fallbackMood = "Sad";
        }

        return {
          mood: fallbackMood,
        };
      }

      return {
        mood: mood,
      };

    } catch (error) {
      console.error("Unexpected error:", error.message || error);
      throw new functions.https.HttpsError(
        "internal",
        "Error generating recommendations: " +
          (error.message || "Unknown error")
      );
    }
  }
);

exports.getRecommendations = functions.https.onCall(
  { enforceAppCheck: false },
  async (req) => {
    console.log("Recommendation request received with data:", req);

    try {
      if (!req.auth || !req.auth.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated."
        );
      }

      const userId = req.auth.uid;
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User data not found."
        );
      }

      const userData = userDoc.data();
      if (!userData.access_token || !userData.refresh_token) {
        throw new functions.https.HttpsError(
          "not-found",
          "Spotify tokens not found."
        );
      }

      let accessToken = decrypt(userData.access_token);
      let refreshToken = decrypt(userData.refresh_token);
      let expiresAt = userData.expires_at;

      if (Date.now() >= expiresAt) {
        try {
          console.log(`Refreshing access token for user: ${userId}`);
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

          await db
            .collection("users")
            .doc(userId)
            .update({
              access_token: encrypt(accessToken),
              expires_at: expiresAt,
            });

          console.log(`Access token refreshed for user: ${userId}`);
        } catch (error) {
          console.error(
            "Failed to refresh Spotify token:",
            error.response?.data || error
          );
          throw new functions.https.HttpsError(
            "internal",
            "Failed to refresh token"
          );
        }
      }

      const recentTracksResponse = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const recentTracks = recentTracksResponse.data.items.map((item) => ({
        name: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
      }));

      const recentSet = new Set(
        recentTracks.slice(0, 20).map((t) => `${t.name} by ${t.artist}`)
      );

      console.log("User's last 50 played songs:", recentTracks);

      const { mood, context = "" } = req.data;
      console.log("Mood:", mood);
      console.log("Context:", context);

      const aiPrompt = `
The user is currently feeling '${mood}'.
They said: "${context}"
Here are the last 50 songs they listened to:
${recentTracks.map((track) => `- ${track.name} by ${track.artist}`).join("\n")}

Please recommend 20 fresh songs they would enjoy based on mood, and past listening.
Avoid suggesting songs that appeared in the last 20 they listened to.
Return ONLY valid JSON in the format:
{
  "recommendations": [
    { "name": "Song Title 1", "artist": "Artist Name 1" },
    { "name": "Song Title 2", "artist": "Artist Name 2" }
  ],
  "explanation": "Why these songs were chosen"
}
`;

      let recommendations = [];
      let explanation = "";

      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,

          {
            contents: [{ parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
          }
        );

        const aiText =
          geminiResponse.data.candidates[0]?.content?.parts[0]?.text || "";
        console.log("Raw AI response:", aiText);

        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsedData = JSON.parse(jsonStr);

          if (Array.isArray(parsedData.recommendations)) {
            recommendations = parsedData.recommendations.filter(
              (r) => !recentSet.has(`${r.name} by ${r.artist}`)
            );
            explanation =
              parsedData.explanation ||
              "Here are some songs that match your mood.";
          }
        }

        if (recommendations.length === 0) {
          throw new Error("No valid recommendations found");
        }
      } catch (error) {
        console.error(
          "Gemini error or parsing failure:",
          error.message || error
        );

        let fallbackRecommendations = [];
        if (mood.toLowerCase().includes("happy")) {
          fallbackRecommendations = [
            { name: "Happy", artist: "Pharrell Williams" },
            { name: "Good as Hell", artist: "Lizzo" },
            { name: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
            { name: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
            { name: "Walking on Sunshine", artist: "Katrina & The Waves" },
          ];
        } else if (mood.toLowerCase().includes("sad")) {
          fallbackRecommendations = [
            { name: "Someone Like You", artist: "Adele" },
            { name: "Fix You", artist: "Coldplay" },
            { name: "Skinny Love", artist: "Bon Iver" },
            { name: "All I Want", artist: "Kodaline" },
            { name: "Hurt", artist: "Johnny Cash" },
          ];
        } else {
          fallbackRecommendations = [
            { name: "Circles", artist: "Post Malone" },
            { name: "Blinding Lights", artist: "The Weeknd" },
            { name: "Don't Start Now", artist: "Dua Lipa" },
            { name: "Watermelon Sugar", artist: "Harry Styles" },
            { name: "bad guy", artist: "Billie Eilish" },
          ];
        }

        return {
          tracks: fallbackRecommendations,
          explanation: "Here are some songs that might match your mood.",
        };
      }

      return {
        tracks: recommendations,
        explanation: explanation,
      };
    } catch (error) {
      console.error("Unexpected error:", error.message || error);
      throw new functions.https.HttpsError(
        "internal",
        "Error generating recommendations: " +
          (error.message || "Unknown error")
      );
    }
  }
);
