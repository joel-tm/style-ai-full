import asyncio
import base64
import json
import logging
import os

logger = logging.getLogger(__name__)


async def analyze_clothing_image(image_path: str) -> dict:
    """
    Analyze a clothing image using Gemini 2.0 Flash multimodal vision.
    Returns a dict with keys: type, neckline, sleevelength, primaryColor,
    secondaryColors, fit, length, fabricType, texture.
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is missing.")

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Read the image file and encode as base64
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Determine MIME type from extension
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    mime_type = mime_map.get(ext, "image/jpeg")

    from google import genai
    from google.genai import types

    prompt = (
        "You are a fashion expert analyzing a clothing item image. "
        "Examine this clothing item carefully and provide a detailed analysis.\n\n"
        "You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no extra text) "
        "with exactly these keys:\n"
        '{\n'
        '  "type": "the specific garment type, e.g. t-shirt, blouse, jeans, sneakers, blazer, hoodie, skirt",\n'
        '  "neckline": "e.g. crew neck, v-neck, polo, turtleneck, scoop, no neck, collared. Use \'N/A\' for non-top items",\n'
        '  "sleevelength": "e.g. sleeveless, short, 3/4, long, N/A for non-top items",\n'
        '  "primaryColor": "the dominant color of the garment",\n'
        '  "secondaryColors": "other visible colors, comma-separated, or \'none\' if solid color",\n'
        '  "fit": "e.g. slim, regular, relaxed, oversized, tailored",\n'
        '  "length": "e.g. cropped, regular, knee-length, full-length, ankle",\n'
        '  "fabricType": "e.g. cotton, denim, wool, silk, polyester, leather, linen, knit",\n'
        '  "texture": "e.g. smooth, ribbed, chunky, flowy, structured, fuzzy, distressed"\n'
        '}\n\n'
        "Be specific and accurate. Respond with ONLY the JSON object."
    )

    def _ask_gemini():
        c = genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
        )
        return c.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        types.Part.from_text(text=prompt),
                    ],
                )
            ],
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=512,
            ),
        )

    try:
        result = await asyncio.to_thread(_ask_gemini)
        text = result.text.strip()

        # Handle cases where the model wraps in ```json blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(text)

        # Ensure all expected keys exist
        expected_keys = [
            "type", "neckline", "sleevelength", "primaryColor",
            "secondaryColors", "fit", "length", "fabricType", "texture"
        ]
        for key in expected_keys:
            if key not in parsed:
                parsed[key] = ""

        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {text}", exc_info=True)
        raise ValueError(f"AI analysis returned invalid JSON: {e}")
    except Exception as e:
        logger.error(f"Gemini clothing analysis failed: {e}", exc_info=True)
        raise
