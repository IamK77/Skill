#!/usr/bin/env python3
"""CLI compatibility entrypoint for the suite-wide authoring contract."""
from pathlib import Path
import sys
from skill_lint import ROOT, main

if __name__ == '__main__':
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'skills'))
