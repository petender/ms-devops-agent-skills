#!/usr/bin/env bash
# Emit a CSV of avg + p95 CPU per VM over the last 14 days.
set -euo pipefail
: "${SUB_ID:?SUB_ID required}"
az account set -s "$SUB_ID"

echo "vmId,avgCpu,p95Cpu"
for VM in $(az vm list --query '[].id' -o tsv); do
  DATA=$(az monitor metrics list \
    --resource "$VM" \
    --metric 'Percentage CPU' \
    --interval PT1H \
    --start-time "$(date -u -d '14 days ago' +%FT%TZ)" \
    --aggregation Average \
    --query 'value[0].timeseries[0].data[].average' -o tsv | grep -v '^$')

  if [ -z "$DATA" ]; then continue; fi
  AVG=$(echo "$DATA" | awk '{s+=$1; n++} END {if (n>0) printf "%.1f", s/n; else print "0"}')
  P95=$(echo "$DATA" | sort -n | awk 'BEGIN {c=0} {a[c++]=$1} END {if (c>0) printf "%.1f", a[int(c*0.95)]}')
  echo "$VM,$AVG,$P95"
done
