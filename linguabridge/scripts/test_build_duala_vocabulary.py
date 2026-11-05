import unittest
from build_duala_vocabulary import build, tokens

class VocabularyTests(unittest.TestCase):
    def test_combining_marks_and_apostrophes(self):
        self.assertEqual(tokens("M̱bá m'boa 123; M̱bá"), ['m̱bá', "m'boa", 'm̱bá'])

    def test_counts_and_uncertainty(self):
        source = {'source': 'sample', 'source_revision': 'test', 'declared_license': 'test', 'entries': [
            {'dua': 'Mboa mboa', 'en': 'Town town'},
            {'dua': 'mboa na', 'en': 'town and'},
        ]}
        result = build(source)
        self.assertEqual(result['duala_distinct_forms'], 2)
        self.assertEqual(result['entries'][0]['form'], 'mboa')
        self.assertEqual(result['entries'][0]['occurrences'], 3)
        self.assertEqual(result['entries'][0]['sentence_count'], 2)
        self.assertEqual(result['entries'][0]['example_pair_indices'], [0, 1])
        self.assertEqual(result['entries'][0]['english_cooccurrences_unverified'], [])

if __name__ == '__main__':
    unittest.main()
