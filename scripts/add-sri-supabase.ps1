$sri = 'integrity="sha256-xS2zCnmQbdfvibZhfnqeZdQZq821LRYJlAfLw6FZpF0=" crossorigin="anonymous"'
$search = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.107.0?v=20260605m" defer></script>'
$replace = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.107.0?v=20260605m" ' + $sri + ' defer></script>'

$count = 0
$updated = 0
$skipped = 0
$failed = 0

Get-ChildItem -LiteralPath "." -Filter "*.html" | ForEach-Object {
  $path = $_.FullName
  $count++
  $content = Get-Content -LiteralPath $path -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { $failed++; return }
  if ($content -notmatch [regex]::Escape($search)) {
    $skipped++
    return
  }
  if ($content -match 'integrity="sha256-xS2zCnmQbdfvibZhfnqeZdQZq821LRYJlAfLw6FZpF0="') {
    $skipped++
    return
  }
  $new = $content.Replace($search, $replace)
  Set-Content -LiteralPath $path -Value $new -NoNewline -ErrorAction SilentlyContinue
  if ($?) { $updated++ } else { $failed++ }
}

Write-Host "Total: $count, Updated: $updated, Skipped: $skipped, Failed: $failed"
