"""Render Timezone Pop icon PNGs from icons/greyscale-icon.svg.

Usage: python3 make_icons.py
Requires: cairosvg (pip install cairosvg)
"""
import os
import cairosvg

SIZES = [16, 32, 48, 128]

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    src = os.path.join(here, 'icons', 'greyscale-icon.svg')
    out_dir = os.path.join(here, 'icons')
    with open(src, 'rb') as f:
        svg_bytes = f.read()
    for sz in SIZES:
        out = os.path.join(out_dir, f'icon{sz}.png')
        cairosvg.svg2png(bytestring=svg_bytes, write_to=out,
                         output_width=sz, output_height=sz)
    print(f'Wrote {len(SIZES)} icons to {out_dir}')
