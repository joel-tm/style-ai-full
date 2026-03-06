from fastapi import APIRouter, Depends, HTTPException

from textile_shop.schemas import TextileShopSearchRequest, TextileShopSearchResponse
from textile_shop.services import search_nearby_textile_shops
from user.auth import get_current_user_id


router = APIRouter(prefix="/api/textile-shops", tags=["Textile Shops"])


@router.post("/nearby", response_model=TextileShopSearchResponse)
async def nearby_textile_shops(
    req: TextileShopSearchRequest,
    user_id: int = Depends(get_current_user_id),
):
    try:
        shops = await search_nearby_textile_shops(
            location_query=req.location_query,
        )
        return TextileShopSearchResponse(shops=shops)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Textile shop search failed: {str(exc)}")