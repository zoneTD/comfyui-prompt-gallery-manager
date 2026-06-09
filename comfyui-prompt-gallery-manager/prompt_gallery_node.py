import os
import json
import random
from aiohttp import web
from server import PromptServer

# Filepaths for saving configuration within ComfyUI custom node directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_file_prompts = os.path.join(current_dir, "comfy_prompts.json")
db_file_active = os.path.join(current_dir, "comfy_active.json")

class PromptGalleryConnector:
    """
    ComfyUI Node that connects our visual Prompt & Gallery Web App with the generative workflow canvas.
    Retrieves the currently chosen 'active' card or a 'random' card from the gallery.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "server_url": ("STRING", {"default": "http://localhost:8188"}),
                "mode": (["active", "random"], {"default": "active"}),
                # Dummy input to force execution on each run (useful with Random mode)
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            },
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive_prompt", "negative_prompt")
    FUNCTION = "get_prompts"
    CATEGORY = "PromptGallery"

    def get_prompts(self, server_url, mode, seed):
        # Reads prompt values from the synced file
        cards = []
        if os.path.exists(db_file_prompts):
            try:
                with open(db_file_prompts, "r", encoding="utf-8") as f:
                    cards = json.load(f)
            except Exception as e:
                print(f"[PromptGallery] Error reading synced prompts: {e}")

        active_config = {"activeId": "", "customPrompt": "", "customNegativePrompt": ""}
        if os.path.exists(db_file_active):
            try:
                with open(db_file_active, "r", encoding="utf-8") as f:
                    active_config = json.load(f)
            except Exception as e:
                print(f"[PromptGallery] Error reading active selection: {e}")

        # 1. Random Selection Mode
        if mode == "random" and cards:
            card = random.choice(cards)
            positive = card.get("prompt", "")
            negative = card.get("skillPrompt", "")
            print(f"[PromptGallery] [Random Mode] Chosen: {card.get('id')} - Positive: {positive[:40]}...")
            return (positive, negative)

        # 2. Manual Active Option
        active_id = active_config.get("activeId")
        active_card = None
        if active_id:
            for c in cards:
                if c.get("id") == active_id:
                    active_card = c
                    break

        if active_card:
            positive = active_config.get("customPrompt") or active_card.get("prompt") or ""
            negative = active_config.get("customNegativePrompt") or active_card.get("skillPrompt") or ""
            print(f"[PromptGallery] [Active Mode] Chosen: {active_id} - Positive: {positive[:40]}...")
            return (positive, negative)
        elif cards:
            # Fallback to visual first item
            first_card = cards[0]
            positive = first_card.get("prompt", "")
            negative = first_card.get("skillPrompt", "")
            print(f"[PromptGallery] [Fallback Mode] First Card Positive: {positive[:40]}...")
            return (positive, negative)
        else:
            # Absolute default safety values
            print("[PromptGallery] No synced database found. Using fail-safe prompts.")
            return (
                "A futuristic cyberpunk robotic core, glowing emerald bio-luminescent fiber optics, highly detailed, Unreal Engine 5 render, cinematic keys",
                "blurry, details error, extra limbs, bad painting, low quality, deformed"
            )


# Add web handlers directly on the PromptServer instance so ComfyUI acts as the backend
def init_routes():
    router = PromptServer.instance.app.router

    # --- API ENDPOINTS ---

    # 1. Sync cards list
    @PromptServer.instance.routes.post("/api/comfy/sync")
    async def comfy_sync(request):
        try:
            data = await request.json()
            cards = data.get("cards", [])
            with open(db_file_prompts, "w", encoding="utf-8") as f:
                json.dump(cards, f, indent=2, ensure_ascii=False)
            return web.json_response({"success": True, "message": "Synced!"})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    # 2. Fetch synced cards list
    @PromptServer.instance.routes.get("/api/comfy/prompts")
    async def comfy_get_prompts(request):
        try:
            if os.path.exists(db_file_prompts):
                with open(db_file_prompts, "r", encoding="utf-8") as f:
                    return web.json_response(json.load(f))
            return web.json_response([])
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    # 3. Set a specific card as active, storing customizable overrides
    @PromptServer.instance.routes.post("/api/comfy/set-active")
    async def comfy_set_active(request):
        try:
            data = await request.json()
            config = {
                "activeId": data.get("activeId", ""),
                "customPrompt": data.get("customPrompt", ""),
                "customNegativePrompt": data.get("customNegativePrompt", "")
            }
            with open(db_file_active, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return web.json_response({"success": True, "message": "Successfully updated active node configuration."})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    # 4. Fetch Active Prompt (Used both by external calls & debugging)
    @PromptServer.instance.routes.get("/api/comfy/active")
    async def comfy_get_active(request):
        try:
            # Allow mode retrieval via query parameters: 'active' or 'random'
            mode = request.query.get("mode", "active")
            
            cards = []
            if os.path.exists(db_file_prompts):
                with open(db_file_prompts, "r", encoding="utf-8") as f:
                    cards = json.load(f)
                    
            active_config = {"activeId": "", "customPrompt": "", "customNegativePrompt": ""}
            if os.path.exists(db_file_active):
                with open(db_file_active, "r", encoding="utf-8") as f:
                    active_config = json.load(f)
                    
            if mode == "random" and cards:
                card = random.choice(cards)
                return web.json_response({
                    "id": card.get("id"),
                    "prompt": card.get("prompt"),
                    "negative_prompt": card.get("skillPrompt", ""),
                    "description": card.get("description", ""),
                    "tags": card.get("tags", []),
                    "imageUrl": card.get("imageUrl", ""),
                    "targetModel": card.get("targetModel", "")
                })

            active_id = active_config.get("activeId")
            active_card = None
            if active_id:
                for c in cards:
                    if c.get("id") == active_id:
                        active_card = c
                        break
                        
            if active_card:
                return web.json_response({
                    "id": active_card.get("id"),
                    "prompt": active_config.get("customPrompt") or active_card.get("prompt"),
                    "negative_prompt": active_config.get("customNegativePrompt") or active_card.get("skillPrompt") or "",
                    "description": active_card.get("description", ""),
                    "tags": active_card.get("tags", []),
                    "imageUrl": active_card.get("imageUrl", ""),
                    "targetModel": active_card.get("targetModel", "")
                })
            elif cards:
                card = cards[0]
                return web.json_response({
                    "id": card.get("id"),
                    "prompt": card.get("prompt"),
                    "negative_prompt": card.get("skillPrompt", ""),
                    "description": card.get("description", ""),
                    "tags": card.get("tags", []),
                    "imageUrl": card.get("imageUrl", ""),
                    "targetModel": card.get("targetModel", "")
                })
            else:
                return web.json_response({
                    "id": "default",
                    "prompt": "A modern beautiful cinematic digital painting of a metallic robot working on a glowing motherboard, cozy ambient light",
                    "negative_prompt": "blurry, low quality, deformed",
                    "description": "默认提示词 (未同步任何数据)",
                    "tags": ["默认", "科幻"],
                    "imageUrl": "",
                    "targetModel": "General"
                })
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    # --- SERVE THE REACT APPLICATION UI DIRECTLY ---
    dist_path = os.path.join(current_dir, "dist")
    if os.path.exists(dist_path):
        async def index_handler(request):
            return web.FileResponse(os.path.join(dist_path, "index.html"))

        # Root static paths
        router.add_get("/prompt-gallery", index_handler)
        router.add_get("/prompt-gallery/", index_handler)

        # Dynamic mapping for index.html assets (CSS, JS)
        assets_dir = os.path.join(dist_path, "assets")
        if os.path.exists(assets_dir):
            router.add_static("/prompt-gallery/assets", assets_dir)
            router.add_static("/assets", assets_dir) # Support root absolute assets pathing


# Node class registries
NODE_CLASS_MAPPINGS = {
    "PromptGalleryConnector": PromptGalleryConnector
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptGalleryConnector": "Prompt Gallery Connector 🎯"
}
