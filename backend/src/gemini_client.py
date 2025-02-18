import os
import google.generativeai as genai
from typing import List, Dict
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

async def get_recommendations(user_id: str, recent_tracks: List[Dict], mood: str = None) -> List[Dict]:
    try:
        logger.info(f"Getting recommendations for user {user_id} with mood {mood}")
        
        # Format recent tracks into a readable string
        track_info = "\n".join([
            f"- {track['track']['name']} by {track['track']['artists'][0]['name']}"
            for track in recent_tracks[:5]
        ])
        
        # Create the prompt
        prompt = f"""You are a music recommendation expert. Based on these recently played tracks:
        {track_info}
        
        {f'The listener is feeling {mood}.' if mood else ''}
        
        Recommend 5 songs that would be perfect for this listener. Consider the musical style, energy, and mood of their recent tracks.
        Format your response as a JSON array with 'artist' and 'track' fields only. Example:
        [
            {{"artist": "Artist Name", "track": "Track Name"}},
            ...
        ]
        """
        
        logger.info(f"Sending prompt to Gemini: {prompt}")
        
        # Get model response
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        logger.info(f"Received response from Gemini: {response.text}")
        
        # Extract the JSON part from the response
        try:
            start = response.text.find('[')
            end = response.text.rfind(']') + 1
            if start == -1 or end == 0:
                raise ValueError("No JSON array found in response")
            
            json_str = response.text[start:end]
            recommendations = json.loads(json_str)
            return recommendations
        except Exception as e:
            logger.error(f"Error parsing JSON from response: {str(e)}")
            logger.error(f"Response text: {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        logger.exception(e)
        return [] 