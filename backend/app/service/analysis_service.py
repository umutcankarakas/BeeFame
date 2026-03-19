# app/service/analyse_service.py
from collections import defaultdict
import re
from typing import List
import json
import unicodedata
from service.redis_client import get_redis_client
from model.analysis import ClassifierRequest
from model.classifier import ClassifierName
from model.dataset import DatasetName
from service.utils.dataset_utils import initial_dataset_analysis

class AnalysisService:
    def __init__(self):
        self.redis_client = get_redis_client()

    def _get_cache_key(self, dataset_name: str, classifier_name: str, test_size: float) -> str:
        return f"{self._slugify(dataset_name)}:{self._slugify(classifier_name)}:{test_size:.4f}"

    def _slugify(self,text: str) -> str:
        # Unicode karakterleri ASCII'ye çevir
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        # Küçük harfe çevir
        text = text.lower()
        # Harf ve rakam dışındakileri tire ile değiştir
        text = re.sub(r'[^a-z0-9]+', '-', text)
        # Baş ve sondaki tireleri sil
        text = text.strip('-')
        return text

    def analyse(self, dataset_names: List[DatasetName], classifier_requests: List[ClassifierRequest], test_size: float = 0.2) -> str:
        results = []
        missing_pairs = []

        for dataset in dataset_names:
            for classifier_request in classifier_requests:
                classifier_name = classifier_request.name
                cache_key = self._get_cache_key(dataset.value, classifier_name, test_size)
                cached = self.redis_client.get(cache_key)

                if cached:
                    results.extend(json.loads(cached))
                else:
                    missing_pairs.append((dataset, classifier_request))

        if missing_pairs:
            datasets_to_calculate = list(set(ds for ds, _ in missing_pairs))

            classifiers_to_calculate = []
            seen = set()

            for _, cr in missing_pairs:
                key = (cr.name, json.dumps(cr.params, sort_keys=True))
                if key not in seen:
                    seen.add(key)
                    classifiers_to_calculate.append(cr)

            calculated_results = initial_dataset_analysis(
                datasets_to_calculate,
                classifiers_to_calculate,
                test_size=test_size,
            )

            grouped_data = defaultdict(list)
            for entry in calculated_results:
                key = (entry["Dataset"], entry["Classifier"])
                grouped_data[key].append(entry)

            for (dataset, classifier), entries in grouped_data.items():
                cache_key = self._get_cache_key(dataset, classifier, test_size)
                self.redis_client.set(cache_key, json.dumps(entries))
                results.extend(entries)

        return results