from .prompt_gallery_node import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS, init_routes

# Initialize web API and static folder routing through ComfyUI server
init_routes()

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
