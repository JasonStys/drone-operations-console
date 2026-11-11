"""Jason Stys: independently wait on one known owned Windows service handle, without termination.

Functions/variables: docs/SOURCE_MAP.md. No process enumeration or user-data read.
"""

import ctypes.wintypes
import json
import sys
import time
from pathlib import Path


def main():
    """Keep a real handle across shutdown so PID reuse or the owner's reported status cannot pass."""
    pid = int(sys.argv[1])
    output = Path(sys.argv[2])
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [
        ctypes.wintypes.DWORD,
        ctypes.wintypes.BOOL,
        ctypes.wintypes.DWORD,
    ]
    kernel.OpenProcess.restype = ctypes.wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes = [ctypes.wintypes.HANDLE, ctypes.wintypes.DWORD]
    kernel.WaitForSingleObject.restype = ctypes.wintypes.DWORD
    kernel.GetExitCodeProcess.argtypes = [
        ctypes.wintypes.HANDLE,
        ctypes.POINTER(ctypes.wintypes.DWORD),
    ]
    kernel.GetExitCodeProcess.restype = ctypes.wintypes.BOOL
    kernel.CloseHandle.argtypes = [ctypes.wintypes.HANDLE]
    handle = kernel.OpenProcess(0x100000 | 0x1000, False, pid)
    if not handle:
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        output.with_suffix(".ready").write_text(str(pid), encoding="utf-8")
        started = time.monotonic()
        wait = kernel.WaitForSingleObject(handle, 40000)
        code = ctypes.wintypes.DWORD()
        if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
            raise ctypes.WinError(ctypes.get_last_error())
        output.write_text(
            json.dumps(
                {
                    "pid": pid,
                    "wait_result": wait,
                    "exit_code": code.value,
                    "observed_seconds": time.monotonic() - started,
                }
            ),
            encoding="utf-8",
        )
        if wait != 0 or code.value != 0:
            raise RuntimeError(
                "Owned service did not finish successfully within its observation deadline"
            )
    finally:
        kernel.CloseHandle(handle)


if __name__ == "__main__":
    main()
