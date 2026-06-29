from src.evaluator import violation_edge


def test_enqueue_only_on_entry_into_violation():
    # not violating -> no enqueue
    assert violation_edge(1.0, 0.8, False) == (False, False)
    # entering violation -> enqueue, now flagged
    assert violation_edge(0.5, 0.8, False) == (True, True)
    # still violating -> no repeat enqueue
    assert violation_edge(0.5, 0.8, True) == (False, True)
    # recovered -> re-armed, no enqueue
    assert violation_edge(1.0, 0.8, True) == (False, False)
    # None ec -> never violating
    assert violation_edge(None, 0.8, True) == (False, False)
