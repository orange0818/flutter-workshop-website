import os
import csv

ROOT = os.path.dirname(os.path.dirname(__file__))
STUDENTS_DIR = os.path.join(ROOT, 'assets', 'certificates', 'student')
DATA_FILE = os.path.join(ROOT, 'data', 'eligible-candidates.txt')

def normalize(name):
    return ''.join(c for c in name if c.isalnum() or c.isspace()).strip().lower()

def main():
    files = os.listdir(STUDENTS_DIR)
    files_map = {normalize(os.path.splitext(f)[0]): f for f in files}
    print(f"Found {len(files)} certificate files in {STUDENTS_DIR}")

    if not os.path.exists(DATA_FILE):
        print(f"Data file not found: {DATA_FILE}")
        return

    with open(DATA_FILE, encoding='utf-8') as fh:
        rows = [r for r in fh.read().splitlines() if r.strip()]
    if not rows:
        print("No rows in data file")
        return

    headers = rows[0].split('\t')
    try:
        name_idx = [h.lower() for h in headers].index('name')
    except ValueError:
        print('No `name` header in data file')
        return

    missing = []
    mismatches = []

    for r in rows[1:]:
        cols = r.split('\t')
        name = cols[name_idx].strip()
        key = normalize(name)
        if key in files_map:
            # exact normalized match
            continue
        # try fuzzy: find files that start with same tokens
        candidates = [f for k,f in files_map.items() if k.startswith(key) or key.startswith(k)]
        if candidates:
            mismatches.append((name, candidates))
        else:
            missing.append(name)

    print('\nMismatches (name -> candidate files):')
    for name, cands in mismatches:
        print(name, '->', cands)

    print('\nMissing files (no close match found):')
    for m in missing:
        print(m)

if __name__ == '__main__':
    main()
