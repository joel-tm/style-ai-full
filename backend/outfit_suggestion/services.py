import asyncio
import os


async def suggest_outfit_from_wardrobe(
    occasion: str,
    weather,
    wardrobe_items: list[dict],
    gender: str = "prefer_not_to_say",
    age: int | None = None,
    country: str = "",
    state: str = "",
) -> tuple[str, list[int], str]:
    """
    Use Gemini to suggest an outfit from the user's wardrobe.
    Returns: (suggestion_text, list_of_selected_item_ids, prompt_used)
    """
    import json
    import logging

    logger = logging.getLogger(__name__)

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is missing.")

    from google import genai
    from google.genai import types

    gender_str = gender.replace("_", " ") if gender and gender != "prefer_not_to_say" else "person"
    age_str = f", age {age}" if age else ""
    location_str = f" in {state}, {country}" if state and country else ""

    items_lines = []
    for item in wardrobe_items:
        desc = f"- Item ID {item['id']}: Category = {item['category']}"
        attrs = item.get("attributes")
        if attrs and isinstance(attrs, dict):
            parts = []
            if attrs.get("type"):
                parts.append(f"Type: {attrs['type']}")
            if attrs.get("primaryColor"):
                parts.append(f"Color: {attrs['primaryColor']}")
            if attrs.get("secondaryColors") and attrs["secondaryColors"] != "none":
                parts.append(f"Secondary: {attrs['secondaryColors']}")
            if attrs.get("fit"):
                parts.append(f"Fit: {attrs['fit']}")
            if attrs.get("length"):
                parts.append(f"Length: {attrs['length']}")
            if attrs.get("fabricType"):
                parts.append(f"Fabric: {attrs['fabricType']}")
            if attrs.get("texture"):
                parts.append(f"Texture: {attrs['texture']}")
            if attrs.get("neckline") and attrs["neckline"] != "N/A":
                parts.append(f"Neckline: {attrs['neckline']}")
            if attrs.get("sleevelength") and attrs["sleevelength"] != "N/A":
                parts.append(f"Sleeves: {attrs['sleevelength']}")
            if parts:
                desc += " | " + ", ".join(parts)
        items_lines.append(desc)

    items_desc = "\n".join(items_lines)

    prompt = (
        f"You are a personal fashion stylist. A {gender_str}{age_str}{location_str} needs an outfit for a {occasion} occasion.\n"
        f"The weather is {weather.weather_condition} with temperature around {weather.temperature_avg:.1f}°C "
        f"(high {weather.temperature_max:.1f}°C, low {weather.temperature_min:.1f}°C).\n\n"
        f"Here are the clothing items in their wardrobe:\n{items_desc}\n\n"
        f"RULES:\n"
        f"1. There are TWO valid outfit options — STRONGLY prefer Option A:\n"
        f"   Option A (PREFERRED): Select exactly 1 'Tops' item + 1 'Bottoms' item + 1 'Footwear' item.\n"
        f"   Option B (ONLY if no suitable top+bottom combo exists): Select exactly 1 'Dresses' item + 1 'Footwear' item (no top or bottom needed).\n"
        f"2. Use Option B ONLY as a last resort — when no good top+bottom combination works for the occasion and weather. Always try Option A first.\n"
        f"3. You MUST always select exactly 1 'Footwear' item.\n"
        f"4. You MAY optionally select 1 item from 'Accessories' if a suitable one exists.\n"
        f"5. Consider the weather carefully: for cold weather pick warm fabrics (wool, knit) and long sleeves; "
        f"for hot weather pick breathable fabrics (cotton, linen) and light colors.\n"
        f"6. Ensure the colors and styles complement each other.\n"
        f"7. Use the clothing attributes (type, color, fit, fabric, texture) to make informed decisions.\n"
        f"8. You MUST ALWAYS select items. NEVER refuse or say you cannot recommend. "
        f"Always pick the BEST AVAILABLE items from the wardrobe, even if they are not perfect for the weather or occasion.\n\n"
        f"Respond in this exact JSON format:\n"
        f'{{"suggestion": "Your styling advice explaining why these pieces work together for the occasion and weather", '
        f'"selected_item_ids": [id1, id2, ...]}}\n\n'
        f"Only use item IDs from the list above. The selected_item_ids array must NEVER be empty. Be specific about why each piece works."
    )

    def _ask_gemini():
        client = genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
        )
        return client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

    try:
        result = await asyncio.to_thread(_ask_gemini)
        text = result.text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(text)
        suggestion_text = parsed.get("suggestion", "Here's a suggested outfit from your wardrobe.")
        selected_ids = parsed.get("selected_item_ids", [])

        valid_ids = {item["id"] for item in wardrobe_items}
        selected_ids = [item_id for item_id in selected_ids if item_id in valid_ids]

        return suggestion_text, selected_ids, prompt
    except json.JSONDecodeError:
        logger.warning("Could not parse Gemini response as JSON, returning raw text")
        return result.text.strip(), [], prompt
    except Exception as exc:
        logger.error(f"Gemini suggestion failed: {exc}", exc_info=True)
        raise
