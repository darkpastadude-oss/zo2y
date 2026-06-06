$csp = '<meta http-equiv="Content-Security-Policy" content="default-src ''self''; script-src ''self'' ''unsafe-inline'' ''unsafe-eval'' https://cdn.jsdelivr.net; style-src ''self'' ''unsafe-inline'' https://fonts.googleapis.com; font-src ''self'' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src ''self'' data: blob: https:; media-src ''self'' https://*.supabase.co blob:; connect-src ''self'' https://*.supabase.co wss://*.supabase.co https://api.themoviedb.org https://api.thesportsdb.com https://restcountries.com https://openlibrary.org https://covers.openlibrary.org https://commons.wikimedia.org https://*.wikimedia.org https://flagcdn.com https://*.googleapis.com; frame-src ''self'' https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://player.vimeo.com; object-src ''none''; base-uri ''self''; form-action ''self'' https://*.supabase.co; frame-ancestors ''none''">'

$count = 0
$skipped = 0
$failed = 0
$updated = @()

Get-ChildItem -LiteralPath "." -Filter "*.html" | ForEach-Object {
  $path = $_.FullName
  $count++
  $content = Get-Content -LiteralPath $path -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { $failed++; return }
  if ($content -match 'http-equiv="Content-Security-Policy"') {
    $skipped++
    return
  }
  if ($content -notmatch '<meta\s+charset="UTF-8"') {
    $skipped++
    return
  }
  $new = $content -replace '(<meta\s+charset="UTF-8"[^>]*>)', ('$1' + "`n  " + $csp)
  if ($new -eq $content) {
    $skipped++
    return
  }
  Set-Content -LiteralPath $path -Value $new -NoNewline -ErrorAction SilentlyContinue
  if ($?) { $updated += $path } else { $failed++ }
}

Write-Host ""
Write-Host "Total: $count"
Write-Host "Updated: $($updated.Count)"
Write-Host "Skipped: $skipped"
Write-Host "Failed: $failed"
Write-Host ""
Write-Host "Updated files:"
$updated | ForEach-Object { Write-Host "  $_" }
