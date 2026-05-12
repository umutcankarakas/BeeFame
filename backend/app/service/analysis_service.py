# app/service/analysis_service.py
from collections import defaultdict
import re
from typing import List, Optional
import json
import unicodedata
from service.redis_client import get_redis_client
from model.analysis import ClassifierRequest
from model.classifier import ClassifierName
from model.dataset import DatasetName
from model.evaluation import SubgroupPairRequest
from service.utils.dataset_utils import initial_dataset_analysis


class AnalysisService:
    def __init__(self):
        self.redis_client = get_redis_client()

    def _get_cache_key(self, dataset_name: str, classifier_name: str, test_size: float, pairs: Optional[List] = None) -> str:
        base = f"{self._slugify(dataset_name)}:{self._slugify(classifier_name)}:{test_size:.4f}"
        if pairs:
            pair_str = "_".join(sorted(f"{p['col1']}-{p['col2']}-{p.get('col3') or ''}" for p in pairs))
            base += f":sg_{pair_str}"
        return base

    def _slugify(self, text: str) -> str:
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = text.lower()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        text = text.strip('-')
        return text

    def analyse(
        self,
        dataset_names: List[DatasetName],
        classifier_requests: List[ClassifierRequest],
        test_size: float = 0.2,
        subgroup_pairs: Optional[List[SubgroupPairRequest]] = None,
    ) -> list:
        results = []
        missing_pairs = []

        requested_pairs = []
        if subgroup_pairs:
            for p in subgroup_pairs:
                requested_pairs.append({
                    "col1": p.col1,
                    "col2": p.col2,
                    "col3": p.col3 if hasattr(p, 'col3') else None,
                    "label": p.label,
                })

        for dataset in dataset_names:
            for classifier_request in classifier_requests:
                classifier_name = classifier_request.name
                cache_key = self._get_cache_key(
                    dataset.value, classifier_name, test_size,
                    requested_pairs if requested_pairs else None
                )
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
                subgroup_pairs=requested_pairs,
            )

            grouped_data = defaultdict(list)
            for entry in calculated_results:
                key = (entry["Dataset"], entry["Classifier"])
                grouped_data[key].append(entry)

            for (dataset, classifier), entries in grouped_data.items():
                cache_key = self._get_cache_key(
                    dataset, classifier, test_size,
                    requested_pairs if requested_pairs else None
                )
                self.redis_client.setex(cache_key, 86400, json.dumps(entries))
                results.extend(entries)

        return results