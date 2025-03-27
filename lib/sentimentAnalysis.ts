import { getFunctions, httpsCallable } from "firebase/functions";

interface SentimentResult {
  mood: string;
  genres: string[];
  activities: string[];
  intensity: number;
  context: string;
}

export async function analyzeSentiment(message: string): Promise<SentimentResult> {
  try {
    console.log("Analyzing sentiment for message:", message);
    const functions = getFunctions();
    const analyzeText = httpsCallable<
      { text: string },
      SentimentResult
    >(functions, "analyzeSentiment");
    
    console.log("Calling analyzeSentiment cloud function...");
    const result = await analyzeText({ text: message });
    console.log("Sentiment analysis result:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Fallback to basic analysis if cloud function fails
    return {
      mood: message.toLowerCase().includes("happy") ? "Happy" : 
            message.toLowerCase().includes("sad") ? "Sad" : "Neutral",
      genres: ["Pop", "Rock"],
      activities: [],
      intensity: 50,
      context: message
    };
  }
}