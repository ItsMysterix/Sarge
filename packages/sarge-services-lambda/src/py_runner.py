import importlib.util
import json
import sys

def load_module(path):
    spec = importlib.util.spec_from_file_location("module", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore
    return mod

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": {"message": "missing payload"}}))
        return
    payload = json.loads(sys.argv[1])
    module_path = payload.get("module")
    handler_name = payload.get("handler", "handler")
    event = payload.get("payload", {})
    context = payload.get("context", {})
    try:
        mod = load_module(module_path)
        handler = getattr(mod, handler_name, None)
        if handler is None:
            print(json.dumps({"ok": False, "error": {"message": f"handler {handler_name} not found"}}))
            return
        res = handler(event, context)
        print(json.dumps({"ok": True, "result": res}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": {"message": str(e)}}))

if __name__ == "__main__":
    main()
