"""Creates and verifies the official capstone submission ZIP: team_name_voiceops.zip.
Ensures zero secrets, no node_modules, no dataset copy, and complete reproducible code.
"""
import os
import zipfile
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
ZIP_FILENAME = "team_debosmita_voiceops.zip"
ZIP_PATH = _ROOT / ZIP_FILENAME

# Files and directories to explicitly include
INCLUDES = [
    "README.md",
    ".env.example",
    "requirements.txt",
    "run.py",
    "report.pdf",
    "demo_script.md",
]

INCLUDE_DIRS = [
    "src",
    "sample_outputs",
]

# Patterns that MUST NEVER be included in the submission ZIP
PROHIBITED_SUBSTRINGS = [
    ".env",
    "node_modules",
    "Capstone_Project_Dataset_FTTT_2026",
    "__pycache__",
    ".pytest_cache",
    ".git",
    "venv",
    ".venv",
]


def create_submission_zip():
    print(f"Creating submission archive: {ZIP_PATH}...")
    
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for fname in INCLUDES:
            fpath = _ROOT / fname
            if fpath.exists():
                zipf.write(fpath, arcname=fname)
                print(f"  Added file: {fname}")
            else:
                print(f"  [Warning] Missing expected file: {fname}")

        # Add directories
        for dname in INCLUDE_DIRS:
            dpath = _ROOT / dname
            if dpath.exists():
                for root, dirs, files in os.walk(dpath):
                    # Filter out prohibited dirs in-place
                    dirs[:] = [d for d in dirs if not any(p in d for p in PROHIBITED_SUBSTRINGS)]
                    for f in files:
                        if any(p in f for p in PROHIBITED_SUBSTRINGS) or f.endswith(".pyc"):
                            continue
                        full_p = Path(root) / f
                        rel_p = full_p.relative_to(_ROOT)
                        zipf.write(full_p, arcname=str(rel_p).replace("\\", "/"))
                        print(f"  Added: {rel_p}")

    print(f"\nZIP Archive created successfully: {ZIP_PATH} ({ZIP_PATH.stat().st_size} bytes)")

    # Also create a copy named team_name_voiceops.zip as per spec
    spec_zip = _ROOT / "team_name_voiceops.zip"
    import shutil
    shutil.copyfile(ZIP_PATH, spec_zip)
    print(f"Copied spec archive: {spec_zip} ({spec_zip.stat().st_size} bytes)")

    # Verification inspection
    print("\n--- Verifying Submission Archive Integrity ---")
    with zipfile.ZipFile(ZIP_PATH, "r") as zipf:
        namelist = zipf.namelist()
        print(f"Total entries in archive: {len(namelist)}")
        
        # Check prohibited items
        violations = []
        for name in namelist:
            for p in [".env", "node_modules", "Capstone_Project_Dataset", "__pycache__", ".git"]:
                if p == ".env" and name == ".env.example":
                    continue
                if p in name:
                    violations.append((name, p))

        if violations:
            print(f"FAIL: Found {len(violations)} prohibited entries in ZIP:")
            for v in violations:
                print(f"  - {v[0]} (matched {v[1]})")
            return False
        else:
            print("PASS: Zero secrets, no node_modules, and no dataset copy found in archive.")

        # Check required files
        missing_required = []
        for req in ["README.md", ".env.example", "requirements.txt", "run.py", "report.pdf", "src/api/main.py", "sample_outputs/manifest.json"]:
            if req not in namelist and not any(req in n for n in namelist):
                missing_required.append(req)

        if missing_required:
            print(f"FAIL: Missing required files: {missing_required}")
            return False
        else:
            print("PASS: All required files and folders are present.")

    return True


if __name__ == "__main__":
    create_submission_zip()
