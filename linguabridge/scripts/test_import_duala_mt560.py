import unittest

from import_duala_mt560 import curate


class CurateTests(unittest.TestCase):
    def test_deduplicates_and_rejects_empty_or_identical_pairs(self):
        rows = [
            {'eng': 'Send money', 'dua': 'example duala'},
            {'eng': 'send MONEY', 'dua': 'example duala'},
            {'eng': ' ', 'dua': 'x'},
            {'eng': 'same', 'dua': 'same'},
        ]
        result = curate(rows)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['domain'], 'banking_candidate')
        self.assertFalse(result[0]['reviewed'])

    def test_avoids_ambiguous_keyword_false_positives(self):
        result = curate([{'eng': 'The account of Lot', 'dua': 'example'}])
        self.assertEqual(result[0]['domain'], 'general')


if __name__ == '__main__':
    unittest.main()
