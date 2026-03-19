# app/repository/dataset_repository.py
import json
from pathlib import Path
from typing import List, Optional
from model.method import MethodInfo

class MethodRepository:
    @staticmethod
    def get_methods() -> List[MethodInfo]:
        file_path = Path(__file__).parent.parent / "data" / "method.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Method file not found at {file_path}")

        with file_path.open("r", encoding="utf-8") as file:
            raw_data = json.load(file)

        methods = []
        for method in raw_data:
            

            method_info = MethodInfo(
                id=method["id"],
                name=method["name"],
                type=method["type"],
                url=method["url"],
                description=method["description"],
            )

            methods.append(method_info)

        return methods
