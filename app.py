import os
import sys
import webview
from api import ShedAPI


def main():
    dev = "--dev" in sys.argv
    file_path = next(
        (a for a in sys.argv[1:] if not a.startswith("--") and os.path.isfile(a)),
        None,
    )

    api = ShedAPI(file_path)

    if dev:
        url = "http://localhost:5173"
    else:
        url = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")

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
