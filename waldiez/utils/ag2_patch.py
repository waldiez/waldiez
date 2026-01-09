# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=line-too-long, broad-exception-caught,too-many-locals
# pylint: disable=too-many-try-statements,too-complex,too-many-branches
# pylint: disable=too-many-statements
# cspell: disable

"""Patch ag2 if needed."""

import argparse
import importlib.util
import re
import sys
from collections.abc import Iterable
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


@dataclass
class Hunk:
    """Hunk class."""

    old_start: int
    old_len: int
    new_start: int
    new_len: int
    lines: list[str]


@dataclass
class FilePatch:
    """File patch class."""

    old_path: str | None
    new_path: str | None
    hunks: list[Hunk]


class PatchState(str, Enum):
    """Patch state."""

    CLEAN = "clean"
    ALREADY_APPLIED = "already_applied"
    DIVERGED = "diverged"


class PatchError(RuntimeError):
    """Patch error."""


_A_HDR = re.compile(r"^---\s+(?P<path>.+)")
_B_HDR = re.compile(r"^\+\+\+\s+(?P<path>.+)")
_HUNK = re.compile(r"^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@")


def _clean_header_path(raw: str) -> str:
    """Drop possible timestamps; normalize a/ and b/ prefixes."""
    # Header may be like: "path\tYYYY-MM-DD ...", or "a/foo/bar\t..."
    path = raw.strip()
    # Drop trailing metadata after a tab or space if it looks like timestamp
    if "\t" in path:
        path = path.split("\t", 1)[0]
    # Strip quotes if present
    if path.startswith('"') and path.endswith('"'):
        path = path[1:-1]
    # Normalize leading prefixes
    if path.startswith("a/"):
        path = path[2:]
    elif path.startswith("b/"):
        path = path[2:]
    return path


def _parse_unified_diff(text: str) -> list[FilePatch]:  # noqa: C901
    """Parse a unified diff (text-only) into FilePatch objects.

    Handles standard git-style '---'/'+++' headers and '@@' hunks.
    """
    lines = text.splitlines(keepends=True)
    i = 0
    patches: list[FilePatch] = []

    while i < len(lines):
        # Seek next file header
        if not lines[i].startswith("--- "):
            i += 1
            continue

        m_old = _A_HDR.match(lines[i].rstrip("\n"))
        if not m_old:
            raise PatchError(f"Malformed '---' header at line {i + 1}")
        i += 1
        if i >= len(lines) or not lines[i].startswith("+++ "):
            raise PatchError(f"Expected '+++' after '---' at line {i}")
        m_new = _B_HDR.match(lines[i].rstrip("\n"))
        if not m_new:
            raise PatchError(f"Malformed '+++' header at line {i + 1}")
        i += 1

        old_path_raw = m_old.group("path").strip()
        new_path_raw = m_new.group("path").strip()
        old_path = (
            None
            if old_path_raw == "/dev/null"
            else _clean_header_path(old_path_raw)
        )
        new_path = (
            None
            if new_path_raw == "/dev/null"
            else _clean_header_path(new_path_raw)
        )

        hunks: list[Hunk] = []
        # Collect hunks until next file or EOF
        while i < len(lines) and lines[i].startswith("@@ "):
            hm = _HUNK.match(lines[i].rstrip("\n"))
            if not hm:
                raise PatchError(
                    f"Malformed hunk header at line {i + 1}: {lines[i]}"
                )
            old_start = int(hm.group(1))
            old_len = int(hm.group(2) or "1")
            new_start = int(hm.group(3))
            new_len = int(hm.group(4) or "1")
            i += 1

            hunk_lines: list[str] = []
            # Hunk body: a sequence of lines starting with ' ', '+', '-', or '\
            # No newline...'
            while i < len(lines):
                line = lines[i]
                if (
                    line.startswith("--- ")
                    or line.startswith("@@ ")
                    or line.startswith("diff ")
                    or line.startswith("Index: ")
                ):
                    break
                if line.startswith("*** ") and " ****" in line:
                    break  # old-style context diff marker, treat as boundary
                # Unified diff content lines usually
                # start with ' ', '+', or '-'.
                # Special case: '\ No newline at end of file'
                if (
                    line.startswith(" ")
                    or line.startswith("+")
                    or line.startswith("-")
                    or line.startswith("\\")
                ):
                    hunk_lines.append(line)
                    i += 1
                else:
                    # End of hunk if unknown marker
                    break

            hunks.append(
                Hunk(old_start, old_len, new_start, new_len, hunk_lines)
            )

        patches.append(FilePatch(old_path, new_path, hunks))

    return patches


def _apply_hunks_to_content(content: list[str], hunks: list[Hunk]) -> list[str]:
    """Apply hunks to content (list of lines with keepends=True).

    Strict context matching (no fuzz).
    """
    # Work on a copy
    out = content[:]

    # Track offset between expected and actual positions after earlier edits
    line_offset = 0

    for h in hunks:
        # Position is 1-based in unified diff;
        # convert to 0-based index in our evolving buffer
        # Use the position for the *old* file to anchor context matching
        idx = h.old_start - 1 + line_offset

        # Build expected & replacement slices from the hunk
        expected_old: list[str] = []
        replacement_new: list[str] = []

        for line in h.lines:
            if line.startswith("\\"):
                # "\ No newline at end of file" — ignore during matching;
                #  we preserve original newline behavior
                continue
            tag = line[0]
            body = line[1:]
            if tag == " ":
                expected_old.append(body)
                replacement_new.append(body)
            elif tag == "-":
                expected_old.append(body)
            elif tag == "+":
                replacement_new.append(body)
            else:
                raise PatchError(f"Unknown hunk line tag: {tag!r}")

        # Verify the old slice matches exactly at idx
        old_slice = out[idx : idx + len(expected_old)]
        if old_slice != expected_old:
            # Provide a helpful preview
            preview_old = "".join(old_slice[:5])
            preview_exp = "".join(expected_old[:5])
            msg = (
                "Hunk context mismatch.\nExpected "
                f"at {idx}..{idx + len(expected_old)}:\n{preview_exp}\n"
                f"Found:\n{preview_old}\n"
                "The file likely diverged."
            )
            raise PatchError(msg)

        # Apply: replace that slice with the new lines
        out[idx : idx + len(expected_old)] = replacement_new

        # Update offset: new_len - old_len at this position
        line_offset += len(replacement_new) - len(expected_old)

    return out


def _find_package_root(package_name: str) -> Path:
    spec = importlib.util.find_spec(package_name)
    if spec is None:
        raise PatchError(
            f"Cannot find installed package/module '{package_name}'."
        )
    if spec.submodule_search_locations:
        pkg_dir = Path(next(iter(spec.submodule_search_locations)))
        return pkg_dir.parent
    if spec.origin:
        return Path(spec.origin).parent
    raise PatchError(
        f"Cannot resolve path for '{package_name}' (no origin or locations)."
    )


def _strip_components(path: str, strip: int) -> str:
    parts = Path(path).parts
    if strip <= 0:
        return str(Path(*parts))
    if strip >= len(parts):
        return ""
    return str(Path(*parts[strip:]))


def _guess_strip_for_package(paths: Iterable[str], package_name: str) -> int:
    for p in paths:
        parts = Path(p).parts
        if package_name in parts:
            return parts.index(package_name)
    return 0


def _apply_unified_diff_to_package(  # noqa: C901
    package_name: str,
    diff_path: Path | str,
    *,
    strip: int | None = None,
    dry_run: bool = True,
    allow_rejects: bool = True,
    encoding: str = "utf-8",
) -> None:
    """Apply a unified diff (text-only) to an installed package.

    - Supports creations (--- /dev/null), deletions (+++ /dev/null),
        and modifications.
    - Strict context matching; no fuzz.
    - Writes .rej files next to targets if allow_rejects=True on failure.
    - No external tools required.

    """
    diff_path = Path(diff_path).resolve()
    if not diff_path.exists():
        raise PatchError(f"Diff not found: {diff_path}")

    text = diff_path.read_text(encoding=encoding, errors="replace")
    file_patches: list[FilePatch] = _parse_unified_diff(text)

    # Determine strip if not provided
    if strip is None:
        candidate_paths: list[str] = []
        for fp in file_patches:
            if fp.new_path:
                candidate_paths.append(fp.new_path)
            elif fp.old_path:
                candidate_paths.append(fp.old_path)
        strip = _guess_strip_for_package(candidate_paths, package_name)

    pkg_root = _find_package_root(package_name)
    src_lines: list[str] = []

    # First pass: verify (dry run logic)
    for fp in file_patches:
        oldp = fp.old_path
        newp = fp.new_path

        # Target relative path after strip
        rel_old = _strip_components(oldp, strip) if oldp else None
        rel_new = _strip_components(newp, strip) if newp else None

        # Normalize paths for create/modify/delete
        is_create = (oldp is None) and (newp is not None)
        is_delete = (newp is None) and (oldp is not None)
        is_modify = (oldp is not None) and (newp is not None)

        target_rel = rel_new if not is_delete else rel_old
        if not target_rel:
            # Path stripped away; nothing to do
            # (but usually indicates wrong strip)
            msg = (
                f"After -p{strip}, target path is empty for file patch "
                f"(old={oldp!r}, new={newp!r}). Adjust strip level."
            )
            raise PatchError(msg)

        target_path = (pkg_root / target_rel).resolve()
        if is_create:
            # Validate create: file may or may not exist;
            # hunks should build new content
            # We simulate application starting from empty content
            src_lines = []
            new_lines = _apply_hunks_to_content(src_lines, fp.hunks)
            # No IO in dry-run
        elif is_delete:
            # Validate delete: file must exist and hunks must match content
            if not target_path.exists():
                raise PatchError(f"Delete target does not exist: {target_path}")
            src = target_path.read_text(encoding=encoding, errors="strict")
            src_lines = src.splitlines(keepends=True)
            _ = _apply_hunks_to_content(
                src_lines, fp.hunks
            )  # ensure it matches
        elif is_modify:
            # Modify
            if not target_path.exists():
                raise PatchError(f"Modify target does not exist: {target_path}")
            src = target_path.read_text(encoding=encoding, errors="strict")
            src_lines = src.splitlines(keepends=True)
            _ = _apply_hunks_to_content(src_lines, fp.hunks)

    # If only dry-run requested, stop here
    if dry_run:
        return

    # Second pass: actually mutate
    rejects: list[tuple[Path, str]] = []
    for fp in file_patches:
        oldp = fp.old_path
        newp = fp.new_path
        rel_old = _strip_components(oldp, strip) if oldp else None
        rel_new = _strip_components(newp, strip) if newp else None

        is_create = (oldp is None) and (newp is not None)
        is_delete = (newp is None) and (oldp is not None)
        is_modify = (oldp is not None) and (newp is not None)

        target_rel = rel_new if not is_delete else rel_old
        if not target_rel:
            continue
        target_path = (pkg_root / target_rel).resolve()
        try:
            if is_create:
                src_lines = []
                new_lines = _apply_hunks_to_content(src_lines, fp.hunks)
                target_path.parent.mkdir(parents=True, exist_ok=True)
                _safe_write_text(target_path, "".join(new_lines), encoding)
            elif is_delete:
                src = target_path.read_text(encoding=encoding, errors="strict")
                src_lines = src.splitlines(keepends=True)
                _ = _apply_hunks_to_content(src_lines, fp.hunks)
                # If it applies cleanly, delete
                target_path.unlink(missing_ok=False)
            elif is_modify:
                src = target_path.read_text(encoding=encoding, errors="strict")
                src_lines = src.splitlines(keepends=True)
                new_lines = _apply_hunks_to_content(src_lines, fp.hunks)
                _safe_write_text(target_path, "".join(new_lines), encoding)
        except Exception as e:  # collect rejects if asked
            if allow_rejects:
                rej = _format_reject(fp)
                rej_path = target_path.with_suffix(target_path.suffix + ".rej")
                rej_path.write_text(rej, encoding=encoding)
                rejects.append((rej_path, str(e)))
            else:
                raise

    if rejects:
        details = "\n".join(f"- {p}: {err}" for p, err in rejects)
        raise PatchError(
            "Some hunks failed to apply; .rej files were written:\n" + details
        )


def _safe_write_text(path: Path, data: str, encoding: str) -> None:
    # Write atomically
    tmp = path.with_suffix(path.suffix + ".tmp___apply")
    tmp.write_text(data, encoding=encoding)
    tmp.replace(path)


def _format_reject(fp: FilePatch) -> str:
    lines: list[str] = []
    op_old = fp.old_path or "/dev/null"
    op_new = fp.new_path or "/dev/null"
    lines.append(f"--- {op_old}\n")
    lines.append(f"+++ {op_new}\n")
    for h in fp.hunks:
        header = (
            f"@@ -{h.old_start},{h.old_len} +{h.new_start},{h.new_len} @@\n"
        )
        lines.append(header)
        lines.extend(h.lines)
    return "".join(lines)


def _dry_run_apply_parsed(
    package_name: str,
    file_patches: list[FilePatch],
    *,
    strip: int,
    encoding: str = "utf-8",
) -> bool:
    """Simulate a dry-run apply of already-parsed patches."""
    pkg_root = _find_package_root(package_name)
    try:
        for fp in file_patches:
            oldp = fp.old_path
            newp = fp.new_path
            rel_old = _strip_components(oldp, strip) if oldp else None
            rel_new = _strip_components(newp, strip) if newp else None

            is_create = (oldp is None) and (newp is not None)
            is_delete = (newp is None) and (oldp is not None)

            target_rel = rel_new if not is_delete else rel_old
            if not target_rel:
                return False
            target_path = (pkg_root / target_rel).resolve()
            if is_create:
                src_lines: list[str] = []
                _ = _apply_hunks_to_content(src_lines, fp.hunks)
            elif is_delete:
                if not target_path.exists():
                    return False
                src = target_path.read_text(encoding=encoding, errors="strict")
                src_lines = src.splitlines(keepends=True)
                _ = _apply_hunks_to_content(src_lines, fp.hunks)
            else:
                if not target_path.exists():
                    return False
                src = target_path.read_text(encoding=encoding, errors="strict")
                src_lines = src.splitlines(keepends=True)
                _ = _apply_hunks_to_content(src_lines, fp.hunks)
        return True
    except Exception:
        return False


def _reverse_file_patches(file_patches: list[FilePatch]) -> list[FilePatch]:
    """Produce a reversed patch.

    swap old/new paths, swap ranges, flip +/- lines.
    """
    rev: list[FilePatch] = []
    for fp in file_patches:
        rev_hunks: list[Hunk] = []
        for h in fp.hunks:
            flipped_lines: list[str] = []
            for ln in h.lines:
                if ln.startswith("\\"):
                    # keep "\ No newline..." lines as-is
                    flipped_lines.append(ln)
                elif ln.startswith("+"):
                    flipped_lines.append("-" + ln[1:])
                elif ln.startswith("-"):
                    flipped_lines.append("+" + ln[1:])
                else:
                    # context ' '
                    flipped_lines.append(ln)
            rev_hunks.append(
                Hunk(
                    old_start=h.new_start,
                    old_len=h.new_len,
                    new_start=h.old_start,
                    new_len=h.old_len,
                    lines=flipped_lines,
                )
            )
        rev.append(
            FilePatch(
                old_path=fp.new_path,
                new_path=fp.old_path,
                hunks=rev_hunks,
            )
        )
    return rev


def _check_patch_state(
    package_name: str,
    diff_path: Path | str,
    *,
    strip: int | None = None,
    encoding: str = "utf-8",
) -> PatchState:
    """Check whether a diff is clean to apply, already applied, or diverged."""
    diff_path = Path(diff_path).resolve()
    text = diff_path.read_text(encoding=encoding, errors="replace")
    parsed = _parse_unified_diff(text)

    if strip is None:
        candidate_paths: list[str] = []
        for fp in parsed:
            if fp.new_path:
                candidate_paths.append(fp.new_path)
            elif fp.old_path:
                candidate_paths.append(fp.old_path)
        strip = _guess_strip_for_package(candidate_paths, package_name)

    # Forward
    if _dry_run_apply_parsed(
        package_name, parsed, strip=strip, encoding=encoding
    ):
        return PatchState.CLEAN

    # Reverse (means target already matches post-image)
    reversed_parsed = _reverse_file_patches(parsed)
    if _dry_run_apply_parsed(
        package_name, reversed_parsed, strip=strip, encoding=encoding
    ):
        return PatchState.ALREADY_APPLIED

    return PatchState.DIVERGED


def apply_patch(
    package_name: str,
    diff_path: Path | str,
    *,
    strip: int | None = None,
    allow_rejects: bool = True,
    encoding: str = "utf-8",
    dry_run: bool = False,
) -> None:
    """Apply patch.

    Parameters
    ----------
    package_name : str
        The name of the package to patch.
    diff_path : Path | str
        The path of the .dff file with the changes.
    strip : int | None
        the -p level; if None we try to guess using the package name.
    allow_rejects : bool
        on real apply, write .rej files on hunk mismatch (still raises)
    encoding : str
        The text encoding for reading/writing files.
    dry_run : bool
        if True, validate first; if it passes, function returns (no mutation).

    1) Dry-run to validate.
    2) Real apply with .rej generation on any failure (and raise).
    """
    state = _check_patch_state(
        package_name, diff_path, strip=strip, encoding=encoding
    )
    if state == PatchState.CLEAN:
        _apply_unified_diff_to_package(
            package_name,
            diff_path,
            strip=strip,
            dry_run=True,
            allow_rejects=allow_rejects,
            encoding=encoding,
        )
        if not dry_run:
            _apply_unified_diff_to_package(
                package_name,
                diff_path,
                strip=strip,
                dry_run=False,
                allow_rejects=allow_rejects,
                encoding=encoding,
            )


def patch_ag2() -> None:
    """Patch ag2 if a diff file is found."""
    diff_path = Path(__file__).parent / "ag2.diff"
    if diff_path.is_file():
        try:
            apply_patch("autogen", diff_path)
        except BaseException as e:  # pylint: disable=broad-exception-caught
            print(e)


def _cli() -> argparse.ArgumentParser:
    """Get cli args parser."""
    parser = argparse.ArgumentParser(
        description=(
            "Apply a unified diff (text-only) to an installed Python package."
        )
    )

    parser.add_argument(
        "package",
        help="Import name of the installed package to patch (e.g. 'ag2').",
    )
    parser.add_argument(
        "diff", help="Path to unified diff file (produced without --binary)."
    )
    parser.add_argument(
        "-p",
        "--strip",
        type=int,
        default=None,
        help=(
            "Strip leading path components (like git apply -pN). "
            "If omitted, auto-guess using the package name."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only validate the diff; do not modify files.",
    )
    parser.add_argument(
        "--no-rejects",
        action="store_true",
        help=(
            "Fail immediately if a hunk cannot be applied; "
            "do not write .rej files."
        ),
    )
    parser.add_argument(
        "--encoding",
        default="utf-8",
        help="Encoding used to read/write source files. Default: utf-8",
    )
    parser.add_argument(
        "--state",
        action="store_true",
        help=(
            "Print whether the patch is clean, already_applied, or diverged."
        ),
    )

    return parser


def main() -> None:
    """Entry point for cli usage."""
    parser = _cli()
    args, _ = parser.parse_known_args()
    if args.state:
        st = _check_patch_state(
            args.package, args.diff, strip=args.strip, encoding=args.encoding
        )
        value = " ".join(st.value.split("_"))
        print(f"State: {value}")
        sys.exit(0)
    try:
        # Delegate to main engine
        apply_patch(
            package_name=args.package,
            diff_path=args.diff,
            strip=args.strip,
            dry_run=args.dry_run,
            allow_rejects=not args.no_rejects,
            encoding=args.encoding,
        )
    except PatchError as e:
        print("\nERROR applying diff:\n", file=sys.stderr)
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print("\nUNEXPECTED ERROR:\n", file=sys.stderr)
        print(repr(e), file=sys.stderr)
        sys.exit(2)
    else:
        if args.dry_run:
            print("Dry-run successful: patch is clean.")
        else:
            print("Patch applied successfully.")


if __name__ == "__main__":
    main()
