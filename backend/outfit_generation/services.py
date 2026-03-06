import asyncio
import os
import uuid

from weather_data.models import WeatherData


async def generate_outfit_image(
    occasion: str,
    weather: WeatherData,
    gender: str = "prefer_not_to_say",
    age: int | None = None,
    country: str = "",
    state: str = "",
) -> tuple[str, str, str, str]:
    """
    Generates an outfit image using Google Vertex AI.
    Returns: (top_description, bottom_description, image_url, prompt_used)
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is missing for Vertex AI.")

    from google import genai
    from google.genai import types

    gender_str = gender.replace("_", " ") if gender and gender != "prefer_not_to_say" else "person"
    age_str = f", age {age}" if age else ""
    location_str = f" in {state}, {country}" if state and country else (f" in {country}" if country else "")
    prompt = (
        f"A stylish, full-body outfit for a {gender_str}{age_str}{location_str} for a {occasion} occasion. "
        f"A professional flat lay of {gender_str}{age_str} clothing for a {occasion} occasion. "
        f"The outfit is designed for {weather.weather_condition} weather at {weather.temperature_avg:.1f}°C{location_str}. "
        f"High-quality {gender_str} fashion items laid flat on a clean, neutral background. "
        f"Visible items: [Top Piece] and [Bottom Piece]. "
        f"Strictly no people, no models, no limbs, and no mannequins. "
        f"Only the clothes are shown, neatly arranged from a top-down perspective."
    )

    def _generate():
        client = genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
        )
        return client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/jpeg",
            ),
        )

    import logging

    logger = logging.getLogger(__name__)
    try:
        result = await asyncio.to_thread(_generate)
    except Exception as exc:
        logger.error(f"Vertex AI image generation failed: {exc}", exc_info=True)
        raise

    generated_image = result.generated_images[0]

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "outfits")
    os.makedirs(uploads_dir, exist_ok=True)

    unique_name = f"outfit_{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(uploads_dir, unique_name)

    with open(filepath, "wb") as file_handle:
        file_handle.write(generated_image.image.image_bytes)

    image_url = f"/uploads/outfits/{unique_name}"
    top_desc = f"Top suitable for {occasion} in {weather.weather_condition}"
    bottom_desc = f"Bottoms tailored for {weather.temperature_avg:.1f}C weather"
    return top_desc, bottom_desc, image_url, prompt
