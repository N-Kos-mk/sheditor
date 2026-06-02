import os
import sys
import webview
from api import ShedAPI


def _app_dir() -> str:
    # Nuitka standalone: sys.frozen=True、sys.executable が app.exe のパス。
    # frontend/dist は exe と同じフォルダに置かれるので dirname(sys.executable) を使う。
    # 開発時 (python app.py): sys.frozen が存在しないので __file__ を使う。
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def _user_data_dir() -> str:
    # 本番: %APPDATA%\shed\ （インストーラーが config.json・rules\ を配置）
    # 開発: プロジェクトルート（config.json・rules\ を直接置いて動作確認）
    if getattr(sys, "frozen", False):
        return os.path.join(os.environ.get("APPDATA", ""), "shed")
    return os.path.dirname(os.path.abspath(__file__))


def main():
    dev = "--dev" in sys.argv
    file_path = next(
        (a for a in sys.argv[1:] if not a.startswith("--") and os.path.isfile(a)),
        None,
    )

    api = ShedAPI(file_path, user_data_dir=_user_data_dir())

    if dev:
        url = "http://localhost:5173"
    else:
        url = os.path.join(_app_dir(), "frontend", "dist", "index.html")

    webview.create_window(
        "shed",
        url,
        js_api=api,
        width=1400,
        height=900,
        min_size=(800, 600),
    )
    webview.start()


if __name__ == "__main__":
    main()
