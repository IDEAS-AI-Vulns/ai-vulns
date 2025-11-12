import zipfile
from pathlib import Path
import tempfile
import os


def unzip_repository(zip_path: Path) -> Path:
    """
    Safely extracts a ZIP archive to a temporary directory.
    Returns the path to the temporary directory.
    """
    temp_dir = tempfile.mkdtemp(prefix="repo_")
    temp_dir_path = Path(temp_dir)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        for member in zip_ref.infolist():
            # Path traversal protection
            target_path = os.path.realpath(os.path.join(temp_dir, member.filename))
            if not target_path.startswith(os.path.realpath(temp_dir)):
                raise PermissionError(
                    f"Path traversal attempt detected: {member.filename}"
                )

            # Only extract files
            if not member.is_dir():
                zip_ref.extract(member, temp_dir_path)

    return temp_dir_path
