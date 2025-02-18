import httpx
import logging

logger = logging.getLogger(__name__)

async def get_recent_tracks(access_token):
    logger.info("Fetching recent tracks")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.spotify.com/v1/me/player/recently-played",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            logger.info(f"Recent tracks status: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            return data["items"]
        except Exception as e:
            logger.error(f"Error in get_recent_tracks: {str(e)}")
            raise

async def get_user_profile(access_token):
    logger.info("Fetching user profile")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            logger.info(f"User profile status: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error in get_user_profile: {str(e)}")
            raise 