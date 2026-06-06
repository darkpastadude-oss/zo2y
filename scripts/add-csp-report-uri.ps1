$oldEnding = "frame-ancestors 'none'" + '">'
$newEnding = "frame-ancestors 'none'; report-uri /api/csp-report; report-to csp-endpoint" + '">'

$count = 0
$updated = 0
$skipped = 0
$failed = 0

Get-ChildItem -LiteralPath "." -Filter "*.html" | ForEach-Object {
  $path = $_.FullName
  $count++
  $content = Get-Content -LiteralPath $path -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { $failed++; return }
  if ($content -notmatch 'Content-Security-Policy') { $skipped++; return }
  if ($content -match 'report-uri\s+/api/csp-report') { $skipped++; return }
  $new = $content.Replace($oldEnding, $newEnding)
  if ($new -eq $content) { $skipped++; return }
  Set-Content -LiteralPath $path -Value $new -NoNewline -ErrorAction SilentlyContinue
  if ($?) { $updated++ } else { $failed++ }
}

Write-Host "Total: $count, Updated: $updated, Skipped: $skipped, Failed: $failed"
