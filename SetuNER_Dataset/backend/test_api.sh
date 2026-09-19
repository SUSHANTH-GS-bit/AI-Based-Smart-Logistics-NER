#!/bin/bash
# Smoke-tests every SetuNER API endpoint.
B=http://localhost:4000
pass=0; fail=0

check() { # name, url, [expected http code]
  exp="${3:-200}"
  # 2xx responses must carry success:true; error codes must carry success:false
  if [ "$exp" -lt 400 ]; then want='"success":true'; else want='"success":false'; fi
  code=$(curl -s -o /tmp/r.json -w "%{http_code}" --max-time 5 "$2")
  if [ "$code" = "$exp" ] && grep -q "$want" /tmp/r.json; then
    echo "  PASS  $1  ($code)"; pass=$((pass+1))
  else
    echo "  FAIL  $1  ($code, expected $exp)"; head -c 200 /tmp/r.json; echo; fail=$((fail+1))
  fi
}

checkpost() {
  code=$(curl -s -o /tmp/r.json -w "%{http_code}" --max-time 5 \
        -X POST -H 'Content-Type: application/json' -d "$3" "$2")
  if [ "$code" = "${4:-200}" ] && grep -q '"success":true' /tmp/r.json; then
    echo "  PASS  $1  ($code)"; pass=$((pass+1))
  else
    echo "  FAIL  $1  ($code)"; head -c 200 /tmp/r.json; echo; fail=$((fail+1))
  fi
}

echo "--- meta ---"
check "health"                 "$B/api/health"
check "states"                 "$B/api/states"
echo "--- districts ---"
check "districts"              "$B/api/districts"
check "districts?state=ML"     "$B/api/districts?state=ML"
check "districts/status"       "$B/api/districts/status"
check "district detail"        "$B/api/districts/D-ML-01"
echo "--- segments ---"
check "segments"               "$B/api/segments"
check "segments?risk=high"     "$B/api/segments?risk=high"
check "segments?status=blocked" "$B/api/segments?status=blocked"
check "segments?highway=NH-10" "$B/api/segments?highway=NH-10"
check "segment detail"         "$B/api/segments/SEG-0001"
echo "--- prediction & routing ---"
checkpost "predict-risk"       "$B/api/predict-risk" \
  '{"segment_id":"SEG-0001","rainfall_24h_mm":120,"rainfall_72h_mm":310,"rainfall_7d_mm":520}'
check "route Guwahati->Imphal" "$B/api/route?from=D-AS-01&to=D-MN-01"
check "route Guwahati->Aizawl" "$B/api/route?from=D-AS-01&to=D-MZ-01"
echo "--- incidents ---"
check "incidents"              "$B/api/incidents"
check "incidents?status=open"  "$B/api/incidents?status=open"
check "incidents?type=landslide" "$B/api/incidents?type=landslide"
checkpost "create incident"    "$B/api/incidents" \
  '{"segment_id":"SEG-0005","incident_type":"landslide","severity":"high","latitude":25.5,"longitude":91.8,"description":"Offline sync test"}' 201
echo "--- vehicles ---"
check "vehicles"               "$B/api/vehicles"
check "vehicles?status=delayed" "$B/api/vehicles?status=delayed"
check "vehicle track"          "$B/api/vehicles/VEH-001/track"
echo "--- alerts & dashboard ---"
check "alerts"                 "$B/api/alerts"
check "alerts?lang=lus"        "$B/api/alerts?lang=lus"
check "dashboard summary"      "$B/api/dashboard/summary"
echo "--- hazard module ---"
check "landslides"                "$B/api/landslides"
check "landslides?severity=major" "$B/api/landslides?severity=major"
check "landslides?trigger=rainfall" "$B/api/landslides?trigger=rainfall"
check "landslides?state=SK"       "$B/api/landslides?state=SK"
check "landslides?blocked=true"   "$B/api/landslides?blocked=true"
check "susceptibility"            "$B/api/susceptibility"
check "susceptibility?class=very_high" "$B/api/susceptibility?class=very_high"
check "disruptions"               "$B/api/disruptions"
check "disruptions?cause=landslide" "$B/api/disruptions?cause=landslide"
check "disruptions?min_hours=72"  "$B/api/disruptions?min_hours=72"
check "hazard trend"              "$B/api/hazard/trend"
check "hazard segments"           "$B/api/hazard/segments?limit=10"
checkpost "predict-duration"      "$B/api/predict-duration" \
  '{"segment_id":"SEG-0001","cause":"landslide","volume_m3":45000,"material":"rock","month":7}'

echo "--- error handling ---"
check "404 unknown segment"    "$B/api/segments/SEG-9999" 404
check "404 bad path"           "$B/api/nope" 404

echo
echo "PASSED: $pass   FAILED: $fail"
[ "$fail" -eq 0 ] || exit 1
