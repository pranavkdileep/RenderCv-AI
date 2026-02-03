from __future__ import annotations

from pathlib import Path
from typing import Iterable

from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model
from rendercv.renderer.typst import generate_typst
from rendercv.renderer.pdf_png import generate_pdf, get_typst_compiler, copy_photo_next_to_typst_file



def _ensure_list(value_or_list: bytes | list[bytes] | None) -> list[bytes]:
    if value_or_list is None:
        return []
    return value_or_list if isinstance(value_or_list, list) else [value_or_list]


def render_yaml_to_pdf_and_svg(
    yaml_path: Path,
    *,
    pdf_path: Path | None = None,
    typst_path: Path | None = None,
    svg_dir: Path | None = None,
) -> tuple[Path, list[Path]]:
    """
    Render a RenderCV YAML file to PDF and SVG(s).

    - Uses the same internal pipeline RenderCV’s CLI uses:
      YAML -> validated model -> Typst -> PDF
    - For SVG, calls the same Typst compiler RenderCV uses, with format="svg".

    Args:
        yaml_path: Path to the YAML input file.
        pdf_path: Optional output PDF path. If omitted, uses RenderCV defaults.
        typst_path: Optional Typst output path. If omitted, uses RenderCV defaults.
        svg_dir: Directory to write SVG pages. Defaults to "<yaml_dir>/rendercv_output".

    Returns:
        (pdf_file_path, [svg_file_paths])
    """
    yaml_path = Path(yaml_path)
    svg_dir = svg_dir or (yaml_path.parent / "rendercv_output")

    # Build the validated model, optionally overriding output paths
    _, model = build_rendercv_dictionary_and_model(
        yaml_path,
        pdf_path=pdf_path,
        typst_path=typst_path,
        # Leave PNG/Markdown/HTML disabled by not calling their generators
    )

    # 1) Generate Typst file
    typ_path = generate_typst(model)
    if typ_path is None:
        raise RuntimeError("Typst generation was disabled in settings.")

    # 2) Generate PDF using RenderCV’s built-in function
    pdf_file = generate_pdf(model, typ_path)
    if pdf_file is None:
        raise RuntimeError("PDF generation was disabled in settings.")

    # 3) Generate SVG by calling the underlying Typst compiler directly
    #    (RenderCV doesn’t ship an SVG helper, but typst-py supports SVG output.)
    svg_dir.mkdir(parents=True, exist_ok=True)
    compiler = get_typst_compiler(typ_path, model._input_file_path)  # internal helper
    # Ensure photos are next to the Typst file so Typst can resolve relative paths
    copy_photo_next_to_typst_file(model, typ_path)

    svg_bytes_list: Iterable[bytes] = _ensure_list(compiler.compile(format="svg"))

    # Multi-page Typst docs yield multiple pages; write each to a separate .svg
    svg_paths: list[Path] = []
    base_stem = typ_path.stem  # e.g., "John_Doe_CV"
    for i, svg_bytes in enumerate(svg_bytes_list, start=1):
        svg_path = svg_dir / f"{base_stem}_{i}.svg"
        svg_path.write_bytes(svg_bytes)
        svg_paths.append(svg_path)

    # If there was a single page, you may prefer NAME.svg instead of NAME_1.svg:
    if len(svg_paths) == 1:
        single = svg_paths[0]
        preferred = svg_dir / f"{base_stem}.svg"
        if preferred != single:
            single.rename(preferred)
            svg_paths = [preferred]

    return pdf_file, svg_paths

def render_only_svg(
    yaml_path: Path,
    svg_dir: Path | None = None,
) -> list[Path]:
    """
    Render a RenderCV YAML file to SVG(s) only.

    Args:
        yaml_path: Path to the YAML input file.
        svg_dir: Directory to write SVG pages. Defaults to "<yaml_dir>/rendercv_output".

    Returns:
        [svg_file_paths]
    """
    pdf_path = None  # Disable PDF generation
    typst_path = None  # Use default Typst path
    svg_dir = svg_dir or (yaml_path.parent / "rendercv_output")

    # Build the validated model, disabling PDF generation
    _, model = build_rendercv_dictionary_and_model(
        yaml_path,
        pdf_path=pdf_path,
        typst_path=typst_path,
    )

    # 1) Generate Typst file
    typ_path = generate_typst(model)
    if typ_path is None:
        raise RuntimeError("Typst generation was disabled in settings.")

    # 2) Generate SVG by calling the underlying Typst compiler directly
    svg_dir.mkdir(parents=True, exist_ok=True)
    compiler = get_typst_compiler(typ_path, model._input_file_path)  # internal helper
    # Ensure photos are next to the Typst file so Typst can resolve relative paths
    copy_photo_next_to_typst_file(model, typ_path)

    svg_bytes_list: Iterable[bytes] = _ensure_list(compiler.compile(format="svg"))

    # Multi-page Typst docs yield multiple pages; write each to a separate .svg
    svg_paths: list[Path] = []
    base_stem = typ_path.stem  # e.g., "John_Doe_CV"
    for i, svg_bytes in enumerate(svg_bytes_list, start=1):
        svg_path = svg_dir / f"{base_stem}_{i}.svg"
        svg_path.write_bytes(svg_bytes)
        svg_paths.append(svg_path)

    # If there was a single page, you may prefer NAME.svg instead of NAME_1.svg:
    if len(svg_paths) == 1:
        single = svg_paths[0]
        preferred = svg_dir / f"{base_stem}.svg"
        if preferred != single:
            single.rename(preferred)
            svg_paths = [preferred]

    return svg_paths


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Render a RenderCV YAML to PDF and SVG(s).")
    parser.add_argument("yaml", type=Path, help="Path to the YAML input file, e.g., John_Doe_CV.yaml")
    parser.add_argument("--pdf", type=Path, help="Optional explicit PDF output path")
    parser.add_argument("--typst", type=Path, help="Optional explicit Typst output path (.typ)")
    parser.add_argument("--svg-dir", type=Path, help="Directory to write SVG page(s)")
    args = parser.parse_args()

    pdf, svgs = render_yaml_to_pdf_and_svg(args.yaml, pdf_path=args.pdf, typst_path=args.typst, svg_dir=args.svg_dir)
    print(f"PDF written to: {pdf}")
    if svgs:
        print("SVG(s) written to:")
        for p in svgs:
            print(f" - {p}")