"""
Model Registry — Save/load trained models with versioning.
"""

import os
import json
import joblib
from typing import Optional, Any
from datetime import datetime
from src.config import MODEL_SAVE_DIR


class ModelRegistry:
    """Manages model persistence and versioning."""

    def __init__(self, save_dir: str = MODEL_SAVE_DIR):
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)
        self.metadata_path = os.path.join(save_dir, "model_metadata.json")

    def save_model(
        self, name: str, model: Any, metrics: dict, version: str = "v1"
    ) -> str:
        """Save a trained model with metadata."""
        filename = f"{name}_{version}.joblib"
        filepath = os.path.join(self.save_dir, filename)
        joblib.dump(model, filepath)

        # Update metadata
        metadata = self._load_metadata()
        metadata[name] = {
            "version": version,
            "filename": filename,
            "trained_at": datetime.now().isoformat(),
            "metrics": metrics,
        }
        self._save_metadata(metadata)

        print(f"[MODEL] Saved {name} {version} to {filepath}")
        return filepath

    def load_model(self, name: str, version: str = None) -> Optional[Any]:
        """Load a trained model by name."""
        metadata = self._load_metadata()
        entry = metadata.get(name)

        if not entry:
            return None

        if version and entry.get("version") != version:
            # Try specific version file
            filename = f"{name}_{version}.joblib"
        else:
            filename = entry.get("filename", f"{name}_v1.joblib")

        filepath = os.path.join(self.save_dir, filename)

        if os.path.exists(filepath):
            model = joblib.load(filepath)
            print(f"[MODEL] Loaded {name} from {filepath}")
            return model

        return None

    def get_model_info(self, name: str) -> Optional[dict]:
        """Get metadata for a saved model."""
        metadata = self._load_metadata()
        return metadata.get(name)

    def list_models(self) -> dict:
        """List all saved models."""
        return self._load_metadata()

    def _load_metadata(self) -> dict:
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, "r") as f:
                return json.load(f)
        return {}

    def _save_metadata(self, metadata: dict) -> None:
        with open(self.metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)


# Singleton
_registry: Optional[ModelRegistry] = None


def get_model_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
