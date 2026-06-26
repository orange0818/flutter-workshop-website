#!/usr/bin/env python3
"""
Generate student certificate JSON data from the text file source.

Usage:
    python scripts/generate-certificate-data.py

This script reads from 'data/eligible-candidates.txt'
and generates 'assets/data/student-certificates.json' with:
    - NAME → "name" field
    - Unique Code → "code" field
    - file path constructed from NAME

The portal now reads the text file directly, so this JSON is only an optional snapshot artifact.
"""

import json
import sys
from pathlib import Path

def main():
    text_path = Path("data/eligible-candidates.txt")
    output_path = Path("assets/data/student-certificates.json")
    
    if not text_path.exists():
        print(f"ERROR: Text data file not found at {text_path}")
        sys.exit(1)
    
    with text_path.open("r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    if len(lines) < 2:
        print("ERROR: Text data file must contain a header row and at least one data row.")
        sys.exit(1)
    header = [cell.strip().lower() for cell in lines[0].split("\t")]
    try:
        name_idx = header.index("name")
        code_idx = header.index("unique code")
    except ValueError as e:
        print(f"ERROR: Missing expected header: {e}")
        print(f"Available headers: {header}")
        sys.exit(1)

    records = []
    missing_files = []
    cert_dir = Path("assets/certificates/student")

    for line in lines[1:]:
        cols = [cell.strip() for cell in line.split("\t")]
        name = cols[name_idx] if name_idx < len(cols) else ""
        code = cols[code_idx] if code_idx < len(cols) else ""
        if not name or not code:
            continue
        cert_file = cert_dir / f"{name}.png"
        file_path = f"assets/certificates/student/{name}.png"
        
        if not cert_file.exists():
            missing_files.append(name)
        
        records.append({
            "name": name,
            "code": code,
            "file": file_path
        })
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {len(records)} certificate records in {output_path}")
    if missing_files:
        print(f"⚠ Warning: {len(missing_files)} certificate files not found:")
        for name in missing_files[:5]:
            print(f"  - {name}.png")
        if len(missing_files) > 5:
            print(f"  ... and {len(missing_files) - 5} more")

if __name__ == "__main__":
    main()
