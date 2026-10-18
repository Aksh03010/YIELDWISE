"""Local launcher; also recognizes the isolated Codex dependency installation."""
from pathlib import Path
import sys

if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(root))
    deps = root / '.backend-deps'
    if deps.exists():
        sys.path.insert(0, str(deps))
    import uvicorn
    uvicorn.run('backend.main:app', host='127.0.0.1', port=8000, reload=True, reload_dirs=[str(root / 'backend')])
