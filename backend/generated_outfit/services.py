from sqlalchemy.orm import Session

from generated_outfit.models import GeneratedOutfit


def create_generated_outfit(
    db: Session,
    *,
    request_id: int,
    top_description: str,
    bottom_description: str,
    image_url: str | None,
    llm_model_used: str,
    prompt_used: str,
) -> GeneratedOutfit:
    generated_outfit = GeneratedOutfit(
        request_id=request_id,
        top_description=top_description,
        bottom_description=bottom_description,
        image_url=image_url,
        llm_model_used=llm_model_used,
        prompt_used=prompt_used,
    )
    db.add(generated_outfit)
    db.flush()
    return generated_outfit
