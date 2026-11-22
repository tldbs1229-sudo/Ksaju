# Cut the 12-zodiac pixel sheet into one PNG per animal at its native dot resolution.
#
#   powershell -ExecutionPolicy Bypass -File tools/slice-sprites.ps1
#
# The reference sheet (assets/ref/zodiac-sheet.png) is an upscaled, slightly soft pixel drawing,
# so cropping it directly would look blurry when enlarged. For each animal we:
#   1. find the drawing's bounding box inside its 4x3 grid cell,
#   2. search the dot size and grid offset that make every dot as flat as possible,
#   3. sample one color per dot (centre of the dot), merge near-identical colors,
#   4. make the white background transparent (flood fill from the edges only, so white bellies stay),
#   5. detect the eyes and also write a "-blink" frame with them closed.
# Output: assets/animals/<name>.png, <name>-blink.png and animals.json (sizes + eye boxes).
# The page enlarges these with `image-rendering: pixelated`.
param(
  [string]$Sheet = (Join-Path $PSScriptRoot '..\assets\ref\zodiac-sheet.png'),
  [string]$OutDir = (Join-Path $PSScriptRoot '..\assets\animals'),
  [string]$Preview = '',
  [double]$DotMin = 7,
  [double]$DotMax = 9
)
$ErrorActionPreference = 'Stop'
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

public static class PixelSlicer {
  static int W, H; static int[] px;

  static void Load(string path) {
    using (var bmp = new Bitmap(path)) {
      W = bmp.Width; H = bmp.Height; px = new int[W * H];
      var d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      Marshal.Copy(d.Scan0, px, 0, px.Length); bmp.UnlockBits(d);
    }
  }
  static int R(int c) { return (c >> 16) & 255; } static int G(int c) { return (c >> 8) & 255; } static int B(int c) { return c & 255; }
  static bool IsBg(int c) { int r = R(c), g = G(c), b = B(c); return r > 232 && g > 232 && b > 232; }
  static bool IsDark(int c) { return R(c) * 0.3 + G(c) * 0.59 + B(c) * 0.11 < 70; }

  // within-dot color variance for a grid of size s with offset (ox, oy) over box [x0,x1)x[y0,y1)
  static double Cost(int x0, int y0, int x1, int y1, double s, double ox, double oy) {
    int gw = (int)((x1 - x0) / s) + 3, gh = (int)((y1 - y0) / s) + 3;
    var sum = new double[gw * gh * 3]; var sq = new double[gw * gh]; var n = new int[gw * gh];
    for (int y = y0; y < y1; y += 1) {
      int gy = (int)Math.Floor((y - y0 + oy) / s);
      for (int x = x0; x < x1; x += 1) {
        int c = px[y * W + x]; if (IsBg(c)) continue;
        int gx = (int)Math.Floor((x - x0 + ox) / s), k = gy * gw + gx;
        double r = R(c), g = G(c), b = B(c);
        sum[k * 3] += r; sum[k * 3 + 1] += g; sum[k * 3 + 2] += b; sq[k] += r * r + g * g + b * b; n[k]++;
      }
    }
    double cost = 0;
    for (int k = 0; k < n.Length; k++) if (n[k] > 0)
      cost += sq[k] - (sum[k*3]*sum[k*3] + sum[k*3+1]*sum[k*3+1] + sum[k*3+2]*sum[k*3+2]) / n[k];
    return cost;
  }

  public static string Run(string sheet, string outDir, string[] names, int cols, int rows, string preview, double dmin, double dmax) {
    Load(sheet);
    int cw = W / cols, ch = H / rows;
    var json = new StringBuilder("{\n");
    var previews = new List<Bitmap>();
    // 1) estimate one dot size for the whole sheet from the first few animals
    double best = 0, bestCost = double.MaxValue;
    var boxes = new int[names.Length][];
    for (int i = 0; i < names.Length; i++) boxes[i] = BBox((i % cols) * cw, (i / cols) * ch, cw, ch);
    for (double s = dmin; s <= dmax; s += 0.1) {
      double c = 0;
      for (int i = 0; i < 3; i++) { var b = boxes[i]; c += BestOffset(b, s, 2).Item3 / (b[2] * (double)b[3]); }
      // the search range must start above half the real dot size, or a 2x-finer grid also fits
      if (c < bestCost) { bestCost = c; best = s; }
    }
    for (double s = best - 0.3; s <= best + 0.3; s += 0.05) {
      double c = 0;
      for (int i = 0; i < 3; i++) { var b = boxes[i]; c += BestOffset(b, s, 1).Item3 / (b[2] * (double)b[3]); }
      if (c < bestCost) { bestCost = c; best = s; }
    }
    double dot = best;
    for (int i = 0; i < names.Length; i++) {
      var b = boxes[i];
      var o = BestOffset(b, dot, 1);
      Bitmap img, blink; string eyes;
      Sample(b, dot, o.Item1, o.Item2, out img, out blink, out eyes);
      img.Save(System.IO.Path.Combine(outDir, names[i] + ".png"), ImageFormat.Png);
      blink.Save(System.IO.Path.Combine(outDir, names[i] + "-blink.png"), ImageFormat.Png);
      json.AppendFormat("  \"{0}\": {{\"w\": {1}, \"h\": {2}, \"eyes\": {3}}}{4}\n", names[i], img.Width, img.Height, eyes, i < names.Length - 1 ? "," : "");
      previews.Add(img); previews.Add(blink);
    }
    json.Append("}\n");
    System.IO.File.WriteAllText(System.IO.Path.Combine(outDir, "animals.json"), json.ToString());
    if (preview.Length > 0) SavePreview(previews, preview, 8);
    return "dot size " + dot.ToString("0.00") + " px";
  }

  // drawings overflow their nominal 4x3 cells a little, so rows are split at the empty gaps between them
  static readonly double[] RowSplit = { 0, 0.357, 0.683, 1 };
  static int[] BBox(int cx, int cy, int cw, int ch) {
    int row = (int)Math.Round((double)cy / ch), top = (int)(RowSplit[row] * H) + 2, bot = (int)(RowSplit[row + 1] * H) - 2;
    int x0 = int.MaxValue, y0 = int.MaxValue, x1 = -1, y1 = -1;
    for (int y = top; y < bot; y++) for (int x = cx + 4; x < cx + cw - 4; x++)
      if (!IsBg(px[y * W + x])) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return new int[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1 };
  }

  static Tuple<double, double, double> BestOffset(int[] b, double s, int step) {
    double bo = 0, bp = 0, bc = double.MaxValue;
    for (double oy = 0; oy < s; oy += step) for (double ox = 0; ox < s; ox += step) {
      double c = Cost(b[0], b[1], b[0] + b[2], b[1] + b[3], s, ox, oy);
      if (c < bc) { bc = c; bo = ox; bp = oy; }
    }
    return Tuple.Create(bo, bp, bc);
  }

  static void Sample(int[] b, double s, double ox, double oy, out Bitmap img, out Bitmap blink, out string eyes) {
    int gw = (int)Math.Ceiling((b[2] + ox) / s), gh = (int)Math.Ceiling((b[3] + oy) / s);
    var col = new int[gw * gh]; var bg = new bool[gw * gh];
    var palette = new List<int>(); var gsum = new List<double[]>(); var grp = new int[gw * gh];
    for (int gy = 0; gy < gh; gy++) for (int gx = 0; gx < gw; gx++) {
      // average the middle half of the dot, ignoring the soft edges
      double cx0 = b[0] + gx * s - ox + s * 0.25, cy0 = b[1] + gy * s - oy + s * 0.25;
      double r = 0, g = 0, bl = 0; int n = 0, nbg = 0;
      for (int y = (int)cy0; y < (int)(cy0 + s * 0.5); y++) for (int x = (int)cx0; x < (int)(cx0 + s * 0.5); x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) { nbg++; continue; }
        int c = px[y * W + x]; if (IsBg(c)) nbg++;
        r += R(c); g += G(c); bl += B(c); n++;
      }
      int k = gy * gw + gx;
      if (n == 0 || nbg * 2 > n + nbg) { bg[k] = true; col[k] = unchecked((int)0xFFFFFFFF); continue; }
      int rgb = (255 << 24) | ((int)(r / n) << 16) | ((int)(g / n) << 8) | (int)(bl / n);
      if (IsDark(rgb)) rgb = unchecked((int)0xFF1E1E1E);
      // merge near-identical colors so flat areas stay flat (group = first color seen; painted with the group's mean)
      int hit = -1;
      for (int pi = 0; pi < palette.Count; pi++) { int p = palette[pi], dr = R(p) - R(rgb), dg = G(p) - G(rgb), db = B(p) - B(rgb); if (dr*dr + dg*dg + db*db < 26*26) { hit = pi; break; } }
      if (hit == -1) { palette.Add(rgb); gsum.Add(new double[4]); hit = palette.Count - 1; }
      gsum[hit][0] += R(rgb); gsum[hit][1] += G(rgb); gsum[hit][2] += B(rgb); gsum[hit][3]++;
      grp[k] = hit;
    }
    for (int k = 0; k < col.Length; k++) if (!bg[k]) {
      var s4 = gsum[grp[k]];
      col[k] = palette[grp[k]] == unchecked((int)0xFF1E1E1E) ? palette[grp[k]] : (255 << 24) | ((int)(s4[0] / s4[3]) << 16) | ((int)(s4[1] / s4[3]) << 8) | (int)(s4[2] / s4[3]);
    }
    // background = white dots reachable from the border (enclosed whites like bellies stay)
    var outside = new bool[gw * gh]; var q = new Queue<int>();
    for (int gx = 0; gx < gw; gx++) { q.Enqueue(gx); q.Enqueue((gh - 1) * gw + gx); }
    for (int gy = 0; gy < gh; gy++) { q.Enqueue(gy * gw); q.Enqueue(gy * gw + gw - 1); }
    while (q.Count > 0) {
      int k = q.Dequeue(); if (outside[k]) continue;
      if (!bg[k] && !IsBg(col[k])) continue;
      outside[k] = true; int gx = k % gw, gy = k / gw;
      if (gx > 0) q.Enqueue(k - 1); if (gx < gw - 1) q.Enqueue(k + 1); if (gy > 0) q.Enqueue(k - gw); if (gy < gh - 1) q.Enqueue(k + gw);
    }
    // the soft edge of the outline leaves a light-grey fringe on the outside: drop it
    for (int pass = 0; pass < 2; pass++) {
      var drop = new List<int>();
      for (int k = 0; k < col.Length; k++) {
        if (outside[k]) continue; int c = col[k], r = R(c), g = G(c), bb = B(c);
        int mx = Math.Max(r, Math.Max(g, bb)), mn = Math.Min(r, Math.Min(g, bb));
        if (mn < 165 || mx - mn > 30) continue;
        int x = k % gw, y = k / gw;
        if ((x > 0 && outside[k - 1]) || (x < gw - 1 && outside[k + 1]) || (y > 0 && outside[k - gw]) || (y < gh - 1 && outside[k + gw])) drop.Add(k);
      }
      foreach (int k in drop) outside[k] = true;
    }
    // eyes: small dark blobs inside the body (not touching the outside), in the upper part
    var seen = new bool[gw * gh]; var blobs = new List<List<int>>();
    for (int k = 0; k < col.Length; k++) {
      if (seen[k] || outside[k] || col[k] != unchecked((int)0xFF1E1E1E)) continue;
      var blob = new List<int>(); var st = new Stack<int>(); st.Push(k); bool touches = false;
      while (st.Count > 0) {
        int j = st.Pop(); if (seen[j]) continue; seen[j] = true; blob.Add(j); int x = j % gw, y = j / gw;
        int[] nb = { x > 0 ? j - 1 : -1, x < gw - 1 ? j + 1 : -1, y > 0 ? j - gw : -1, y < gh - 1 ? j + gw : -1 };
        foreach (int m in nb) { if (m < 0) { touches = true; continue; } if (outside[m]) touches = true; else if (!seen[m] && col[m] == unchecked((int)0xFF1E1E1E)) st.Push(m); }
      }
      if (!touches && blob.Count <= 4) blobs.Add(blob);
    }
    blobs.Sort((a, c) => (a[0] / gw).CompareTo(c[0] / gw));
    var eyeBlobs = new List<List<int>>();
    if (blobs.Count > 0) {
      int top = blobs[0][0] / gw;
      foreach (var bl in blobs) { int y = bl[0] / gw; if (Math.Abs(y - top) <= 1 && y < gh * 0.7 && eyeBlobs.Count < 2) eyeBlobs.Add(bl); }
    }
    img = new Bitmap(gw, gh, PixelFormat.Format32bppArgb); blink = new Bitmap(gw, gh, PixelFormat.Format32bppArgb);
    for (int k = 0; k < col.Length; k++) {
      var c = outside[k] ? Color.Transparent : Color.FromArgb(col[k]);
      img.SetPixel(k % gw, k / gw, c); blink.SetPixel(k % gw, k / gw, c);
    }
    var eb = new StringBuilder("[");
    foreach (var e in eyeBlobs) {
      int minx = int.MaxValue, maxx = -1, miny = int.MaxValue, maxy = -1;
      foreach (int j in e) { int x = j % gw, y = j / gw; minx = Math.Min(minx, x); maxx = Math.Max(maxx, x); miny = Math.Min(miny, y); maxy = Math.Max(maxy, y); }
      // closed eye: paint the eye with the face color above it, keep a one-dot line at the bottom
      int fy = Math.Max(0, miny - 1); int face = col[fy * gw + minx];
      if (face == unchecked((int)0xFF1E1E1E) || outside[fy * gw + minx]) face = col[miny * gw + Math.Max(0, minx - 1)];
      foreach (int j in e) { int x = j % gw, y = j / gw; if (y < maxy || maxy == miny) blink.SetPixel(x, y, Color.FromArgb(face)); }
      if (maxy == miny) for (int x = minx - 1; x <= maxx + 1; x++) if (x >= 0 && x < gw && !outside[(maxy + 1 < gh ? maxy + 1 : maxy) * gw + x]) blink.SetPixel(x, Math.Min(gh - 1, maxy + 1), Color.FromArgb(unchecked((int)0xFF1E1E1E)));
      if (eb.Length > 1) eb.Append(", ");
      eb.AppendFormat("[{0}, {1}, {2}, {3}]", minx, miny, maxx - minx + 1, maxy - miny + 1);
    }
    eyes = eb.Append("]").ToString();
  }

  static void SavePreview(List<Bitmap> imgs, string path, int scale) {
    int cell = 0; foreach (var b in imgs) cell = Math.Max(cell, Math.Max(b.Width, b.Height));
    int cs = cell * scale + 8, per = 6, rows = (imgs.Count + per - 1) / per;
    using (var o = new Bitmap(cs * per, cs * rows)) using (var g = Graphics.FromImage(o)) {
      g.Clear(Color.FromArgb(251, 245, 234)); g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
      g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
      for (int i = 0; i < imgs.Count; i++) g.DrawImage(imgs[i], (i % per) * cs + 4, (i / per) * cs + 4, imgs[i].Width * scale, imgs[i].Height * scale);
      o.Save(path, ImageFormat.Png);
    }
  }
}
'@
$names = 'rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig'
New-Item -ItemType Directory -Force $OutDir | Out-Null
$Sheet = (Resolve-Path $Sheet).Path; $OutDir = (Resolve-Path $OutDir).Path
[PixelSlicer]::Run($Sheet, $OutDir, $names, 4, 3, $Preview, $DotMin, $DotMax)
