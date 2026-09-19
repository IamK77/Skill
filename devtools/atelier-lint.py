#!/usr/bin/env python3
"""Atelier uses the same SOP/heuristic authoring contract as every other suite.

Checklist YAML/command parity is checked by the CLI lint job. Probe behaviour is
checked by its own tests; neither this structural lint nor a probe certifies taste.
"""
import sys
from skill_lint import ROOT, main

if __name__ == '__main__':
    sys.exit(main(ROOT / 'skills' / 'atelier'))
