# Duala MT560 import audit

Dataset: https://huggingface.co/datasets/michsethowusu/english-duala_sentence-pairs_mt560

The downloaded Parquet shard has 15,351 rows and columns `eng` and `dua`. Cleaning leaves 15,347 distinct nonempty pairs. The dataset card declares CC BY 4.0, but does not establish the rights of the apparent underlying Watch Tower / Jehovah's Witnesses texts. Its card calls the source original; the earlier OPUS MT560 attribution in this repository is not independently established. Preserve attribution and check upstream rights before redistribution or commercial use.

The keyword filter finds 69 candidates. Inspection shows religious narratives, donation notices, and incidental mentions of money or banks, including phrases such as “The earth is filled with those who have an inordinate love of self, money, and pleasures.” None is a reviewed bank interface translation. **Verified banking UI phrases: 0. Entries added to the active Duala translator: 0.** The research corpus must not be loaded as a production dictionary or treated as certified translations. French-to-Duala phrases cannot be derived directly from these English-to-Duala pairs.

Run `python linguabridge/scripts/import_duala_mt560.py` to download and rebuild the research file. Run `python -m unittest discover -s linguabridge/scripts -p 'test_import_duala_mt560.py'` to check cleaning rules. The existing fixture provider does not support Duala and returns no provider for that pair; it does not invent a financial translation.
